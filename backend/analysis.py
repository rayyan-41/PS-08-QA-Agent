"""Evidence-producing checks. Model scores are advisory, never probabilities."""
from __future__ import annotations

from collections import Counter
from datetime import date
from datetime import timedelta
import math
import numpy as np
import pandas as pd

NUMERIC = (int, float, np.integer, np.floating)
MODEL_NAMES = ["iqr", "mad", "z_score", "previous_change", "isolation_forest", "local_outlier_factor", "one_class_svm", "robust_covariance", "pca_reconstruction", "logistic_regression", "random_forest_classifier", "hist_gradient_boosting_classifier", "linear_regression", "random_forest_regressor", "hist_gradient_boosting_regressor", "naive_forecast", "seasonal_naive_forecast", "exponential_smoothing", "arima", "sarima"]


def to_number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError):
        return None


def finding(row, field, code, severity, evidence, action, proposed=None, hold=True, strength="confirmed", source="deterministic"):
    return {"row": row, "field": field, "code": code, "severity": severity,
            "evidence_strength": strength, "evidence": evidence, "action": action,
            "proposed_value": proposed, "hold": hold, "source": source,
            "procedure": f"/procedures/{code}"}


def deterministic(rows, profile):
    findings = []
    checks = set(profile.get("checks", []))
    required = profile.get("required_fields", [])
    unique = profile.get("unique_fields", [])
    seen = {}
    for index, row in enumerate(rows, 1):
        for field in required if "required_value" in checks else []:
            if not str(row.get(field, "")).strip():
                findings.append(finding(index, field, "required_value", "high", "Value is blank", "Enter and verify the required value"))
        for field in unique if "duplicate_entry" in checks else []:
            key = (field, row.get(field, ""))
            if key[1] and key in seen:
                findings.append(finding(index, field, "duplicate_entry", "high", f"Same {field} as row {seen[key]}", "Verify which entry is correct"))
            else:
                seen[key] = index
        if "range_violation" in checks and all(k in row for k in ("entered_value", "expected_range_min", "expected_range_max")):
            value, low, high = (to_number(row.get(k)) for k in ("entered_value", "expected_range_min", "expected_range_max"))
            if None not in (value, low, high) and low <= high and not low <= value <= high:
                findings.append(finding(index, "entered_value", "range_violation", "high", f"{value:g} is outside [{low:g}, {high:g}]", "Verify source and correct the entry if needed"))
        if "missing_document" in checks and profile.get("require_supporting_doc") and row.get("has_supporting_doc", "").lower() in ("false", "no", "0", ""):
            findings.append(finding(index, "has_supporting_doc", "missing_document", "high", "Required supporting document is absent", "Provide or confirm the supporting document"))
        if "date_conflict" in checks and "entry_date" in row:
            try:
                entered = date.fromisoformat(row["entry_date"])
                if entered > date.today():
                    findings.append(finding(index, "entry_date", "date_conflict", "high", "Entry date is in the future", "Correct or verify the date"))
                age = profile.get("max_age_days")
                if age is not None and entered < date.today()-timedelta(days=int(age)):
                    findings.append(finding(index, "entry_date", "stale_data", "high", f"Entry date exceeds the configured {age} day age limit", "Verify this period is current"))
            except ValueError:
                findings.append(finding(index, "entry_date", "format_error", "high", "Expected ISO date YYYY-MM-DD", "Correct the date format"))
        if "logical_relationship" in checks:
            for rule in profile.get("relationships", []):
                left, right = to_number(row.get(rule.get("left"))), to_number(row.get(rule.get("right")))
                op = rule.get("operator")
                if left is None or right is None or op not in ("<=", ">=", "<", ">", "=="):
                    continue
                good = {"<=": left <= right, ">=": left >= right, "<": left < right, ">": left > right, "==": left == right}[op]
                if not good:
                    findings.append(finding(index, rule["left"], "logical_inconsistency", "high", f"{rule['left']}={left:g} must be {op} {rule['right']}={right:g}", "Verify the related fields and correct the source value"))
    return findings


def statistical(rows, profile):
    """Compare like fields only. Exploratory same-batch signals are labelled as such."""
    findings = []
    outcomes = []
    if "entered_value" not in (rows[0] if rows else {}):
        return findings, [{"model": n, "status": "ineligible", "reason": "No entered_value column"} for n in MODEL_NAMES]
    groups = {}
    for i, row in enumerate(rows, 1):
        group = (row.get("entity_name", "all entities"), row.get("field_name", "entered_value"))
        value = to_number(row.get("entered_value"))
        if value is not None:
            groups.setdefault(group, []).append((i, value, row))
    enabled = set(profile.get("checks", []))
    eligible_groups = 0
    for group, points in groups.items():
        vals = np.array([v for _, v, _ in points], dtype=float)
        if len(vals) < 12:
            continue
        eligible_groups += 1
        median = float(np.median(vals)); q1, q3 = np.quantile(vals, [.25, .75]); spread = float(q3-q1)
        mad = float(np.median(np.abs(vals-median))); sd = float(np.std(vals))
        for pos, (rownum, value, row) in enumerate(points):
            signals = []
            if "iqr" in enabled and spread > 0 and (value < q1-1.5*spread or value > q3+1.5*spread): signals.append("IQR")
            if "mad" in enabled and mad > 0 and abs(value-median)/mad > 3.5: signals.append("MAD")
            if "z_score" in enabled and sd > 0 and abs(value-float(np.mean(vals)))/sd > 3: signals.append("z-score")
            prior = to_number(row.get("previous_value"))
            if "previous_change" in enabled and prior not in (None, 0) and abs(value-prior)/abs(prior) > 2: signals.append("change from previous")
            if signals:
                findings.append(finding(rownum, "entered_value", "statistical_anomaly", "medium", f"{', '.join(signals)} flagged {value:g} within {group[0]} / {group[1]}; same-upload exploratory baseline of {len(vals)} values", "Verify source value and units", hold=profile.get("hold_suspicions", False), strength="suspicion", source="statistics"))
        outcomes.append({"model": "statistics", "status": "completed", "group": " / ".join(group), "reference": "same-upload exploratory", "count": len(points)})
    model_ready = len(rows) >= 30 and "field_name" in rows[0]
    for name in MODEL_NAMES:
        if name in {"iqr", "mad", "z_score", "previous_change"}:
            outcomes.append({"model": name, "status": "completed" if name in enabled and eligible_groups else "ineligible" if name in enabled else "not_selected", "reason": None if eligible_groups else "Need 12+ comparable values in a field group"})
        elif name in enabled:
            outcomes.append({"model": name, "status": "ineligible", "reason": "Requires reviewed labels, independent comparable baseline, or dated regular history"})
        else:
            outcomes.append({"model": name, "status": "not_selected"})
    return findings, outcomes


def summarize(findings):
    counts = Counter(f["code"] for f in findings)
    return {"total": len(findings), "holds": sum(f["hold"] for f in findings), "by_code": dict(counts)}


def historical_models(rows, profile):
    """Score incoming rows against a distinct, earlier analyst-supplied CSV."""
    from io import BytesIO
    from . import models, store
    selected = set(profile.get("checks", [])) & set(MODEL_NAMES[4:])
    if not selected:
        return [], []
    ref_id = profile.get("reference_id")
    reference = store.get_doc("references", ref_id) if ref_id else None
    if not reference:
        return [], [{"model": n, "status": "ineligible", "reason": "No independent historical CSV supplied"} for n in selected]
    history = pd.read_csv(BytesIO(store.get_blob(reference["key"])), dtype=str, keep_default_na=False).to_dict("records")
    incoming_ids = {r.get("entry_id") for r in rows if r.get("entry_id")}
    earliest = min((r.get("entry_date") for r in rows if r.get("entry_date")), default=None)
    history = [r for r in history if (not r.get("entry_id") or r.get("entry_id") not in incoming_ids) and (not earliest or not r.get("entry_date") or r["entry_date"] < earliest)]
    findings=[]; outcomes=[]
    grouped={}
    for i,row in enumerate(rows,1): grouped.setdefault((row.get("entity_name","all entities"),row.get("field_name","all fields")),[]).append((i,row))
    unsupervised={"isolation_forest","local_outlier_factor","one_class_svm","robust_covariance","pca_reconstruction"}
    classifiers={"logistic_regression","random_forest_classifier","hist_gradient_boosting_classifier"}
    regressors={"linear_regression","random_forest_regressor","hist_gradient_boosting_regressor"}
    forecasts={"naive_forecast","seasonal_naive_forecast","exponential_smoothing","arima","sarima"}
    for group, incoming in grouped.items():
        baseline=[r for r in history if (r.get("entity_name","all entities"),r.get("field_name","all fields"))==group]
        if not baseline:
            outcomes.extend({"model":name,"status":"ineligible","group":" / ".join(group),"reason":"No earlier independent comparable rows"} for name in selected)
            continue
        group_name=" / ".join(group)
        common=[f for f in ("entered_value","previous_value","expected_range_min","expected_range_max") if all(to_number(r.get(f)) is not None for r in baseline+ [x[1] for x in incoming])]
        if selected & unsupervised and common:
            try:
                scores=models.tabular_outliers([[to_number(r[f]) for f in common] for r in baseline],[[to_number(r[f]) for f in common] for _,r in incoming])
                for name,result in scores.items():
                    if name not in selected: continue
                    outcomes.append({"model":name,"status":result.get("status","completed"),"group":group_name,"reference_count":len(baseline),"reference_id":ref_id,"reason":result.get("reason")})
                    for (rownum,row),flag,score in zip(incoming,result.get("flags",[]),result.get("scores",[])):
                        if flag:
                            findings.append(finding(rownum,"entered_value","historical_anomaly","medium",f"{name} flagged this {group_name} record against {len(baseline)} earlier independent rows; raw score {score:.3g}","Verify source, units and reporting period",hold=profile.get("hold_suspicions",False),strength="suspicion",source=name))
            except ValueError as exc:
                outcomes.extend({"model":n,"status":"ineligible","group":group_name,"reason":str(exc)} for n in selected & unsupervised)
        features=[f for f in ("previous_value","expected_range_min","expected_range_max") if all(to_number(r.get(f)) is not None for r in baseline+[x[1] for x in incoming])]
        if selected & regressors and features and all(to_number(r.get("entered_value")) is not None for r in baseline):
            try:
                values=models.expected_values([[to_number(r[f]) for f in features] for r in baseline],[to_number(r["entered_value"]) for r in baseline],[[to_number(r[f]) for f in features] for _,r in incoming])
                for name,result in values.items():
                    if name in selected: outcomes.append({"model":name,"status":"completed","group":group_name,"reference_count":len(baseline),"predictions":result["predictions"],"reference_id":ref_id})
            except ValueError as exc:
                outcomes.extend({"model":n,"status":"ineligible","group":group_name,"reason":str(exc)} for n in selected & regressors)
        if selected & classifiers and features:
            if not reference.get("labels_verified"):
                outcomes.extend({"model":n,"status":"ineligible","group":group_name,"reason":"Historical error labels have not been human-reviewed"} for n in selected & classifiers)
            else:
                try:
                    values=models.supervised([[to_number(r[f]) for f in features] for r in baseline],[int(r.get("error_type","None")!="None") for r in baseline],[[to_number(r[f]) for f in features] for _,r in incoming])
                    for name,result in values.items():
                        if name in selected: outcomes.append({"model":name,"status":"completed","group":group_name,"reference_count":len(baseline),"scores":result["scores"],"reference_id":ref_id})
                except ValueError as exc:
                    outcomes.extend({"model":n,"status":"ineligible","group":group_name,"reason":str(exc)} for n in selected & classifiers)
        if selected & forecasts:
            dated=[r for r in baseline if r.get("observation_date") and to_number(r.get("value")) is not None]
            dated.sort(key=lambda r:r["observation_date"])
            try:
                frequency=pd.infer_freq(pd.to_datetime([r["observation_date"] for r in dated])) if len(dated)>=3 else None
            except ValueError:
                frequency=None
            candidate_date=incoming[0][1].get("observation_date") or incoming[0][1].get("entry_date")
            expected_date=pd.date_range(start=dated[-1]["observation_date"],periods=2,freq=frequency)[1].date().isoformat() if frequency else None
            if not frequency or len(dated)<24 or candidate_date!=expected_date:
                outcomes.extend({"model":n,"status":"ineligible","group":group_name,"reason":f"Needs 24+ regular observations and next observation date {expected_date}"} for n in selected & forecasts)
            else:
                season=12 if frequency in ("MS","ME") and len(dated)>=36 else None
                try:
                    values=models.forecast([to_number(r["value"]) for r in dated],1,season)
                    forecast_signals=[]
                    for name,result in values.items():
                        if name in selected:
                            outcomes.append({"model":name,"status":result.get("status","completed"),"group":group_name,"prediction":result.get("predictions"),"reason":result.get("reason"),"reference_id":ref_id})
                            if result.get("predictions") and incoming:
                                observed=to_number(incoming[0][1].get("entered_value"))
                                typical_change=float(np.std(np.diff([to_number(r["value"]) for r in dated])))
                                if observed is not None and typical_change>0 and abs(observed-result["predictions"][0])>3*typical_change:
                                    forecast_signals.append(f"{name} expected {result['predictions'][0]:.3g}")
                    if forecast_signals:
                        findings.append(finding(incoming[0][0],"entered_value","forecast_deviation","medium",f"Observed {incoming[0][1]['entered_value']} differs from forecasts: {', '.join(forecast_signals)}; historical change SD {typical_change:.3g}","Verify period, source and value; forecast is not a replacement",hold=profile.get("hold_suspicions",False),strength="suspicion",source="forecast"))
                except ValueError as exc:
                    outcomes.extend({"model":n,"status":"ineligible","group":group_name,"reason":str(exc)} for n in selected & forecasts)
    covered={x["model"] for x in outcomes}
    outcomes += [{"model":name,"status":"ineligible","reason":"No eligible comparable history or fields"} for name in selected-covered]
    return findings,outcomes
