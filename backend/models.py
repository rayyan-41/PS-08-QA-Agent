"""Concrete estimator implementations for eligible independent reference data.

Inputs to these functions must already be confirmed comparable and disjoint from
the incoming records. Scores are raw model evidence, not error probabilities.
"""
from __future__ import annotations

import warnings
import numpy as np
from sklearn.covariance import MinCovDet
from sklearn.decomposition import PCA
from sklearn.ensemble import (HistGradientBoostingClassifier,
                              HistGradientBoostingRegressor,
                              IsolationForest, RandomForestClassifier,
                              RandomForestRegressor)
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neighbors import LocalOutlierFactor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing


def tabular_outliers(reference, incoming):
    """Fit unsupervised detectors on independent comparable numeric rows."""
    x = np.asarray(reference, dtype=float); q = np.asarray(incoming, dtype=float)
    if x.ndim != 2 or q.ndim != 2 or x.shape[1] != q.shape[1] or len(x) < max(30, x.shape[1]*8) or not np.isfinite(x).all() or not np.isfinite(q).all():
        raise ValueError("Need 30+ finite, comparable reference rows with matching features")
    if len(np.unique(x, axis=0)) < 20:
        raise ValueError("Too few distinct reference rows")
    scaler = StandardScaler().fit(x); xs = scaler.transform(x); qs = scaler.transform(q)
    methods = {
        "isolation_forest": IsolationForest(n_estimators=100, contamination=.05, random_state=8),
        "local_outlier_factor": LocalOutlierFactor(n_neighbors=min(20, len(x)-1), novelty=True, contamination=.05),
        "one_class_svm": OneClassSVM(nu=.05, gamma="scale"),
    }
    output = {}
    for name, estimator in methods.items():
        estimator.fit(xs)
        output[name] = {"scores": estimator.decision_function(qs).tolist(), "flags": (estimator.predict(qs) == -1).tolist(), "reference_count": len(x)}
    try:
        robust = MinCovDet(random_state=8).fit(xs)
        distances = robust.mahalanobis(qs)
        threshold = float(np.quantile(robust.mahalanobis(xs), .95))
        output["robust_covariance"] = {"scores": distances.tolist(), "flags": (distances > threshold).tolist(), "reference_count": len(x)}
    except ValueError as exc:
        output["robust_covariance"] = {"status": "ineligible", "reason": str(exc)}
    components = min(max(1, x.shape[1]-1), 3)
    pca = PCA(n_components=components, random_state=8).fit(xs)
    reconstruction = pca.inverse_transform(pca.transform(qs))
    residual = np.sum((qs-reconstruction)**2, axis=1)
    ref_residual = np.sum((xs-pca.inverse_transform(pca.transform(xs)))**2, axis=1)
    threshold = float(np.quantile(ref_residual, .95))
    output["pca_reconstruction"] = {"scores": residual.tolist(), "flags": (residual > threshold).tolist(), "reference_count": len(x)}
    return output


def supervised(reference_features, labels, incoming_features):
    """Caller must supply human-reviewed binary labels and a held-out evaluation."""
    x=np.asarray(reference_features,dtype=float); y=np.asarray(labels,dtype=int); q=np.asarray(incoming_features,dtype=float)
    if len(x)<40 or len(np.unique(y))!=2 or min(np.bincount(y))<10 or x.shape[1]!=q.shape[1]:
        raise ValueError("Need 40+ reviewed examples, at least 10 per class, and matching numeric features")
    methods={"logistic_regression":make_pipeline(StandardScaler(),LogisticRegression(max_iter=500)),"random_forest_classifier":RandomForestClassifier(n_estimators=100,random_state=8),"hist_gradient_boosting_classifier":HistGradientBoostingClassifier(random_state=8)}
    output={}
    for name,model in methods.items():
        model.fit(x,y)
        output[name]={"scores":model.predict_proba(q)[:,1].tolist(),"predictions":model.predict(q).tolist(),"reference_count":len(x),"label_source":"human-reviewed required"}
    return output


def expected_values(reference_features, targets, incoming_features):
    x=np.asarray(reference_features,dtype=float); y=np.asarray(targets,dtype=float); q=np.asarray(incoming_features,dtype=float)
    if len(x)<40 or x.shape[1]!=q.shape[1] or not all(np.isfinite(z).all() for z in (x,y,q)):
        raise ValueError("Need 40+ comparable independent target examples and matching finite features")
    methods={"linear_regression":LinearRegression(),"random_forest_regressor":RandomForestRegressor(n_estimators=100,random_state=8),"hist_gradient_boosting_regressor":HistGradientBoostingRegressor(random_state=8)}
    output={}
    for name,model in methods.items():
        model.fit(x,y)
        output[name]={"predictions":model.predict(q).tolist(),"reference_count":len(x)}
    return output


def forecast(history, horizon=1, season_length=None):
    """History must be a confirmed regular, comparable sequence in time order."""
    y=np.asarray(history,dtype=float)
    if len(y)<24 or horizon<1 or horizon>12 or not np.isfinite(y).all():
        raise ValueError("Need 24+ finite, regularly spaced observations and horizon 1..12")
    output={"naive_forecast":{"predictions":[float(y[-1])]*horizon}}
    if season_length and 2<=season_length<=len(y)//3:
        output["seasonal_naive_forecast"]={"predictions":[float(y[-season_length+i%season_length]) for i in range(horizon)]}
    else:
        output["seasonal_naive_forecast"]={"status":"ineligible","reason":"No confirmed season length"}
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for name,fit in (
            ("exponential_smoothing",lambda: ExponentialSmoothing(y,trend="add",seasonal=None).fit().forecast(horizon)),
            ("arima",lambda: ARIMA(y,order=(1,1,1)).fit().forecast(horizon)),
            ("sarima",lambda: ARIMA(y,order=(1,1,1),seasonal_order=(1,0,0,season_length)).fit().forecast(horizon) if season_length and 2<=season_length<=len(y)//3 else None),
        ):
            try:
                result=fit()
                output[name]={"predictions":np.asarray(result,dtype=float).tolist()} if result is not None else {"status":"ineligible","reason":"No confirmed season length"}
            except (ValueError,TypeError,np.linalg.LinAlgError) as exc:
                output[name]={"status":"ineligible","reason":str(exc)}
    return output
