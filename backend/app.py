from __future__ import annotations

import csv
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import html
from io import StringIO
import json
import os
from pathlib import Path
import uuid

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel, Field

from . import analysis, store
from .mcp_server import mcp_app

@asynccontextmanager
async def lifespan(api):
    async with mcp_app.router.lifespan_context(mcp_app):
        yield


app = FastAPI(title="PS-08 Predictive Data Quality API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in os.getenv("PS08_CORS_ORIGINS", "*").split(",")], allow_methods=["*"], allow_headers=["*"])
MAX_BYTES = 10 * 1024 * 1024
DEFAULT_CHECKS = ["required_value", "duplicate_entry", "range_violation", "date_conflict", "iqr", "mad", "z_score", "previous_change"]


def get_draft(draft_id):
    draft = store.get_doc("drafts", draft_id)
    if not draft:
        raise HTTPException(404, "Draft not found")
    return draft


def get_rows(draft):
    return json.loads(store.get_blob(draft["working_key"]))


def save_rows(draft, rows, expected_previous_version=None):
    payload = json.dumps(rows, ensure_ascii=False).encode()
    key = f"working/{draft['id']}/v{draft['version']}.json"
    store.put_blob(key, payload, immutable=True)
    draft["working_key"] = key
    draft["digest"] = store.digest(payload)
    if expected_previous_version is None:
        store.put_doc("drafts", draft["id"], draft)
    else:
        store.update_draft_if_version(draft, expected_previous_version)


def inspect_bytes(raw):
    try:
        decoded = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(422, "CSV must be UTF-8; export it as UTF-8 and retry")
    try:
        reader = csv.reader(StringIO(decoded, newline=""), strict=True)
        headers = next(reader)
        if not headers or any(not x.strip() for x in headers) or len(set(headers)) != len(headers):
            raise HTTPException(422, "Headers must be present, named, and unique")
        if len(headers) > 100:
            raise HTTPException(413, "CSV exceeds 100 columns")
        for number, row in enumerate(reader, 2):
            if len(row) != len(headers):
                raise HTTPException(422, f"Row {number} has {len(row)} cells; expected {len(headers)}")
            if number > 10001:
                raise HTTPException(413, "CSV exceeds 10,000 data rows")
        frame = pd.read_csv(StringIO(decoded), dtype=str, keep_default_na=False)
    except (csv.Error, StopIteration, pd.errors.ParserError) as exc:
        raise HTTPException(422, f"Unreadable CSV: {exc}")
    rows = frame.to_dict(orient="records")
    if not rows:
        raise HTTPException(422, "CSV has no data rows")
    columns = []
    for name in headers:
        values = [x for x in frame[name].tolist() if str(x).strip()]
        numeric = sum(analysis.to_number(x) is not None for x in values)
        columns.append({"name": name, "candidate_type": "number" if numeric == len(values) and values else "mixed" if numeric else "text", "blank_count": len(rows)-len(values), "distinct_count": len(set(values))})
    return rows, {"row_count": len(rows), "column_count": len(headers), "columns": columns, "preview": rows[:50], "warnings": [f"{c['name']} contains mixed numeric and text values" for c in columns if c["candidate_type"] == "mixed"]}


@app.get("/api/health")
def health():
    return {"status": "ok", "storage": "gcp" if store.BUCKET and store.PROJECT else "local"}


@app.post("/api/drafts")
async def upload(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(422, "Upload a CSV file")
    raw = await file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "CSV exceeds 10 MB")
    draft_id = uuid.uuid4().hex
    original = f"original/{draft_id}/{file.filename.split('/')[-1]}"
    store.put_blob(original, raw, immutable=True)
    draft = {"id": draft_id, "filename": file.filename, "original_key": original, "original_digest": store.digest(raw), "version": 1, "status": "uploaded", "created_at": datetime.now(timezone.utc).isoformat()}
    store.put_doc("drafts", draft_id, draft)
    return {"draft_id": draft_id, "version": 1, "status": "uploaded"}


@app.post("/api/drafts/{draft_id}/inspect")
def inspect(draft_id: str):
    draft = get_draft(draft_id)
    rows, summary = inspect_bytes(store.get_blob(draft["original_key"]))
    draft["inspection"] = summary
    draft["status"] = "inspected"
    save_rows(draft, rows)
    return {"draft_id": draft_id, "version": draft["version"], "inspection": summary}


@app.get("/api/drafts/{draft_id}")
def draft_details(draft_id: str):
    return get_draft(draft_id)


@app.get("/api/profiles")
def list_profiles():
    return store.list_docs("profiles")


@app.post("/api/references")
async def upload_reference(file: UploadFile = File(...)):
    """Optional analyst-supplied history; labels remain unverified by default."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(422, "Upload a historical CSV")
    raw = await file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "Historical CSV exceeds 10 MB")
    rows, summary = inspect_bytes(raw)
    reference_id = uuid.uuid4().hex
    key = f"references/{reference_id}/original.csv"
    store.put_blob(key, raw, immutable=True)
    reference = {"id": reference_id, "key": key, "filename": file.filename, "row_count": len(rows), "columns": [x["name"] for x in summary["columns"]], "digest": store.digest(raw), "labels_verified": False, "role": "analyst-supplied history"}
    store.put_doc("references", reference_id, reference)
    return reference


@app.get("/api/drafts/{draft_id}/plan")
async def plan(draft_id: str):
    draft = get_draft(draft_id)
    if "inspection" not in draft:
        raise HTTPException(409, "Inspect this draft first")
    cols = [x["name"] for x in draft["inspection"]["columns"]]
    recommended = {"name": f"Review {draft['filename']}", "required_fields": [x for x in ("entry_id", "entered_value", "entry_date") if x in cols], "unique_fields": ["entry_id"] if "entry_id" in cols else [], "require_supporting_doc": False, "hold_suspicions": False, "checks": [x for x in DEFAULT_CHECKS if x != "range_violation" or all(y in cols for y in ("entered_value", "expected_range_min", "expected_range_max"))]}
    questions = [{"field": "meaning", "label": "What does one row represent?", "suggested": "One analyst entry" if "entry_id" in cols else "One record"}, {"field": "units", "label": "Are comparable values in the same units?", "suggested": "Confirm before using statistical comparisons"}, {"field": "documents", "label": "Must every row have a supporting document?", "suggested": "No"}]
    from .agent import run_turn
    agent_result = await run_turn(draft_id, "plan")
    return {"draft_id": draft_id, "version": draft["version"], "recommended_profile": recommended, "questions": questions, "available_checks": analysis.MODEL_NAMES + ["required_value", "duplicate_entry", "range_violation", "date_conflict", "missing_document", "logical_relationship"], "planner_status": agent_result["status"], "planner_note": agent_result.get("note", ""), "planner_activity": agent_result["activity"], "planner_error": agent_result.get("reason")}


class ProfileApproval(BaseModel):
    draft_version: int
    name: str = "Review profile"
    required_fields: list[str] = Field(default_factory=list)
    unique_fields: list[str] = Field(default_factory=list)
    require_supporting_doc: bool = False
    hold_suspicions: bool = False
    checks: list[str] = Field(default_factory=lambda: DEFAULT_CHECKS.copy())
    answers: dict[str, str] = Field(default_factory=dict)
    reuse_profile_id: str | None = None
    reference_id: str | None = None
    required_checks: list[str] = Field(default_factory=list)
    max_age_days: int | None = Field(default=None, ge=0, le=36500)
    relationships: list[dict[str, str]] = Field(default_factory=list)


@app.post("/api/drafts/{draft_id}/profile")
def approve_profile(draft_id: str, approval: ProfileApproval):
    draft = get_draft(draft_id)
    if draft["version"] != approval.draft_version or "inspection" not in draft:
        raise HTTPException(409, "Draft changed or has not been inspected")
    columns = {x["name"] for x in draft["inspection"]["columns"]}
    if any(x not in columns for x in approval.required_fields + approval.unique_fields):
        raise HTTPException(422, "Selected field is absent from CSV")
    if any(x not in analysis.MODEL_NAMES + ["required_value", "duplicate_entry", "range_violation", "date_conflict", "missing_document", "logical_relationship"] for x in approval.checks):
        raise HTTPException(422, "Unknown check")
    if any(r.get("left") not in columns or r.get("right") not in columns or r.get("operator") not in ("<=", ">=", "<", ">", "==") for r in approval.relationships):
        raise HTTPException(422, "Relationship rule must use present columns and a supported operator")
    if approval.reference_id and not store.get_doc("references", approval.reference_id):
        raise HTTPException(404, "Historical reference not found")
    if any(x not in approval.checks for x in approval.required_checks):
        raise HTTPException(422, "Required checks must be selected")
    profile_id = uuid.uuid4().hex
    if approval.reuse_profile_id and not store.get_doc("profiles", approval.reuse_profile_id):
        raise HTTPException(404, "Profile not found")
    profile = approval.model_dump(exclude={"draft_version", "reuse_profile_id"}) | {"id": profile_id, "version": 1, "reused_from": approval.reuse_profile_id}
    store.put_doc("profiles", profile_id, profile)
    draft["profile_id"] = profile_id
    draft["status"] = "configured"
    try:
        store.update_draft_if_version(draft, approval.draft_version)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    return {"profile": profile, "draft_id": draft_id, "version": draft["version"]}


def review_draft(draft):
    if not draft.get("profile_id"):
        raise HTTPException(409, "Approve a profile first")
    profile = store.get_doc("profiles", draft["profile_id"])
    rows = get_rows(draft)
    findings = analysis.deterministic(rows, profile)
    statistical, outcomes = analysis.statistical(rows, profile)
    findings += statistical
    historical, historical_outcomes = analysis.historical_models(rows, profile)
    findings += historical
    outcomes = [x for x in outcomes if x["model"] not in {y["model"] for y in historical_outcomes}] + historical_outcomes
    for check in profile.get("required_checks", []):
        matching = [x for x in outcomes if x["model"] == check]
        if check in analysis.MODEL_NAMES and (not matching or any(x["status"] != "completed" for x in matching)):
            findings.append(analysis.finding(0, "", "required_check_incomplete", "high", f"Required check {check} has not completed", "Provide eligible history or update the approved profile"))
    for item in findings:
        item["id"] = f"{draft['version']}:{item['row']}:{item['field']}:{item['code']}"
        item["draft_version"] = draft["version"]
        if not item["hold"] and item["evidence_strength"] == "suspicion":
            root = profile.get("reused_from") or profile["id"]
            feedback = store.get_doc("feedback", f"{root}:{item['code']}") or {}
            item["prior_valid_verifications"] = feedback.get("valid_count", 0)
    findings.sort(key=lambda x: (not x["hold"], {"high":0,"medium":1,"low":2}.get(x["severity"],3), x.get("prior_valid_verifications",0)))
    summary = analysis.summarize(findings)
    result = {"id": uuid.uuid4().hex, "draft_id": draft["id"], "draft_version": draft["version"], "profile_id": profile["id"], "findings": findings, "outcomes": outcomes, **summary, "activity": [{"step": "deterministic_checks", "status": "completed"}, {"step": "statistical_checks", "status": "completed"}], "created_at": datetime.now(timezone.utc).isoformat()}
    store.put_doc("reviews", result["id"], result)
    draft["review"] = {"id": result["id"], "holds": result["holds"], "version": draft["version"]}
    draft["status"] = "held" if result["holds"] else "ready"
    try:
        store.update_draft_if_version(draft, draft["version"])
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    return result


@app.post("/api/drafts/{draft_id}/review")
async def run_review(draft_id: str):
    draft = get_draft(draft_id)
    if not draft.get("profile_id"):
        raise HTTPException(409, "Approve a profile first")
    from .agent import run_turn
    agent_result = await run_turn(draft_id, "review")
    latest = get_draft(draft_id)
    if latest.get("review") and latest["review"]["version"] == latest["version"]:
        result = store.get_doc("reviews", latest["review"]["id"])
    else:
        result = review_draft(latest)
    result["agent"] = agent_result
    result["activity"] += agent_result["activity"]
    store.put_doc("reviews", result["id"], result)
    return result


@app.get("/api/drafts/{draft_id}/review")
def current_review(draft_id: str):
    draft = get_draft(draft_id)
    if not draft.get("review"):
        raise HTTPException(404, "Review not run")
    return store.get_doc("reviews", draft["review"]["id"])


class Correction(BaseModel):
    draft_version: int
    changes: list[dict]
    reason: str


class Decision(BaseModel):
    draft_version: int
    finding_id: str
    decision: str
    reason: str
    evidence: str = ""


@app.post("/api/drafts/{draft_id}/decisions")
def decide(draft_id: str, payload: Decision):
    draft = get_draft(draft_id)
    if draft["version"] != payload.draft_version or not draft.get("review"):
        raise HTTPException(409, "Refresh the current review before deciding")
    review = store.get_doc("reviews", draft["review"]["id"])
    finding = next((f for f in review["findings"] if f["id"] == payload.finding_id), None)
    if not finding:
        raise HTTPException(404, "Finding not found")
    if payload.decision not in ("acknowledge", "verified_valid") or not payload.reason.strip():
        raise HTTPException(422, "Give a supported decision and reason")
    if finding["evidence_strength"] == "confirmed" and finding["hold"]:
        raise HTTPException(409, "A confirmed required violation must be corrected and rechecked")
    if finding["hold"] and payload.decision == "verified_valid" and not payload.evidence.strip():
        raise HTTPException(422, "A held suspicion needs supporting evidence to verify as valid")
    if finding["hold"] and payload.decision == "acknowledge":
        raise HTTPException(409, "Acknowledgement does not clear a hold")
    existing = next((x for x in draft.get("decisions", []) if x.get("finding_id") == payload.finding_id), None)
    if existing:
        return {"draft_id": draft_id, "version": draft["version"], "review": review}
    record = payload.model_dump() | {"review_id": review["id"], "at": datetime.now(timezone.utc).isoformat()}
    draft.setdefault("decisions", []).append(record)
    if payload.decision == "verified_valid":
        finding["resolved_by"] = "analyst_verification"
        finding["hold"] = False
        if finding["evidence_strength"] == "suspicion":
            profile = store.get_doc("profiles", draft["profile_id"])
            root = profile.get("reused_from") or profile["id"]
            key = f"{root}:{finding['code']}"
            feedback = store.get_doc("feedback", key) or {"valid_count": 0}
            feedback["valid_count"] += 1
            store.put_doc("feedback", key, feedback)
    else:
        finding["resolved_by"] = "acknowledged"
    review.update(analysis.summarize(review["findings"]))
    store.put_doc("reviews", review["id"], review)
    draft["review"]["holds"] = review["holds"]
    draft["status"] = "held" if review["holds"] else "ready"
    try:
        store.update_draft_if_version(draft, payload.draft_version)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    return {"draft_id": draft_id, "version": draft["version"], "review": review}


@app.post("/api/drafts/{draft_id}/corrections")
def correct(draft_id: str, payload: Correction):
    draft = get_draft(draft_id)
    if draft["version"] != payload.draft_version or not draft.get("review"):
        raise HTTPException(409, "Refresh the current review before editing")
    rows = get_rows(draft)
    history = draft.setdefault("decisions", [])
    for change in payload.changes:
        index, field = change.get("row"), change.get("field")
        if not isinstance(index, int) or index < 1 or index > len(rows) or field not in rows[index-1]:
            raise HTTPException(422, "Invalid row or field")
        before = rows[index-1][field]
        after = str(change.get("value", ""))
        rows[index-1][field] = after
        history.append({"row": index, "field": field, "before": before, "after": after, "reason": payload.reason, "version": draft["version"]})
    old_version = draft["version"]
    draft["version"] += 1
    draft.pop("review", None)
    try:
        save_rows(draft, rows, expected_previous_version=old_version)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    return {"draft_id": draft_id, "version": draft["version"], "review": review_draft(draft)}


@app.post("/api/drafts/{draft_id}/submit")
def submit(draft_id: str):
    draft = get_draft(draft_id)
    review = draft.get("review")
    if not review or review["version"] != draft["version"] or review["holds"]:
        raise HTTPException(409, "Current review is held, missing, or stale")
    payload = store.get_blob(draft["working_key"])
    key = f"accepted/{draft_id}/v{draft['version']}-{store.digest(payload)}.json"
    store.put_blob(key, payload, immutable=True)
    receipt = {"id": f"{draft_id}-{draft['version']}", "draft_id": draft_id, "version": draft["version"], "profile_id": draft["profile_id"], "review_id": review["id"], "row_count": draft["inspection"]["row_count"], "digest": store.digest(payload), "snapshot_key": key, "accepted_at": datetime.now(timezone.utc).isoformat()}
    try:
        return store.publish_once(draft_id, draft["version"], receipt)
    except ValueError as exc:
        raise HTTPException(409, str(exc))


@app.get("/api/accepted/{receipt_id}")
def accepted(receipt_id: str):
    record = store.get_doc("accepted", receipt_id)
    if not record:
        raise HTTPException(404, "Receipt not found")
    return record


@app.get("/api/accepted/{receipt_id}/download")
def download(receipt_id: str):
    record = accepted(receipt_id)
    rows = json.loads(store.get_blob(record["snapshot_key"]))
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0]))
    writer.writeheader(); writer.writerows(rows)
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={receipt_id}.csv"})


@app.get("/")
def placeholder():
    return FileResponse(Path(__file__).resolve().parent.parent / "fallback" / "index.html")


@app.get("/procedures/{code}")
def procedure_page(code: str):
    from .mcp_server import procedure_for
    result = procedure_for(code)
    return HTMLResponse(f"<!doctype html><html lang='en'><meta charset='utf-8'><title>Review procedure</title><body style='font:18px system-ui;max-width:680px;margin:50px auto;padding:20px;line-height:1.5'><a href='/'>← Review desk</a><h1>{html.escape(code.replace('_',' ').title())}</h1><p>{html.escape(result['procedure'])}</p><small>Source: {html.escape(result['source'])}</small></body></html>")


app.mount("/tools", mcp_app)
