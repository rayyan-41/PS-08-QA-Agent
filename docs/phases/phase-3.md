# Phase 3: Execute Checks

**Status:** Streamable HTTP MCP, split supplied-data roles, additional suitable forecasting history, and broad first-iteration statistical/ML coverage are confirmed. The implementation defaults and concrete initial catalog below follow the user's direction to resolve routine engineering choices without repeated approval. Product-level ambiguities remain open for discussion.

## Responsibility

Execute the confirmed review plan against its draft version and available context. Return structured measurements and evidence for Phase 4. Keep tool implementation independent of the language model.

## Confirmed direction

- Expose analytical capabilities through MCP rather than selecting direct function calls as the agent-facing interface.
- Include forecasting and broad relevant statistical/ML families in the first iteration. The catalog below makes that direction concrete; model implementation and evidence of effectiveness remain separate deliverables.
- Model availability does not establish applicability to every file. Each tool must identify required inputs, fitting/reference data, and insufficient-evidence conditions.
- Use MCP Streamable HTTP. Start with one analytical MCP server exposing multiple tools, not one deployed service per algorithm. Use the official Python MCP SDK; keep analytical functions separate from transport wrappers.
- Split the supplied CSV into development/reference records and a separately reviewed evaluation set. Add identified suitable historical series for forecasting. External and generated history must be labeled by source and role, and evaluation results must preserve that distinction.

## Supplied CSV: evidence and limitations

The supplied file has 300 historical entry rows. Each row describes one field entry rather than a complete company financial statement. It includes previous values, expected ranges, entry dates, a supporting-document flag, and rejection labels. See [dataset notes](../../data/README.md).

Its approved roles are development/reference history and separately reviewed evaluation examples, with illustrative incoming entries excluded from their own reference history. Establish disjoint roles/splits before using it in tools or fitting. Evaluation answers and held-out records must not leak into the planner's historical context or model training. Exclude the current record from historical self-matches and avoid using future records in historical comparisons. Exact membership and split sizes are determined before fitting or tuning, accounting for linked records and time boundaries.

The rejection labels are provisional because they disagree with several visible fields. Do not treat the full file as a trusted clean baseline or a verified supervised training set. Unsupervised methods can fit without error labels, but their anomaly signals still need evaluation against reviewed answers.

An entry date alone does not establish a regular time series of a comparable business measure. Forecasting needs defined entities, measures, units, observation periods, and sufficient history. Cross-field checks also require reliable grouping keys; do not invent reporting periods or join unrelated entries.

## Concrete initial catalog

Use Pandas/NumPy for preparation and statistical calculations, scikit-learn for tabular estimators and preprocessing pipelines, and statsmodels for fitted time-series forecasts. Pin compatible versions during implementation. These are engineering defaults, not a claim that any estimator already runs or achieves a particular score.

| Family | Initial methods | Required evidence |
|---|---|---|
| Deterministic validation | Required values/documents, confirmed types/formats/ranges, exact duplicates, date order/staleness, and configured cross-field/record relationships | Confirmed rules and appropriate record keys/context |
| Robust statistical checks | IQR, median absolute deviation, z-score, change from previous value | Comparable values and appropriate baseline assumptions; these are statistics, not all learned models |
| Unsupervised tabular detection | Isolation Forest, Local Outlier Factor, One-Class SVM, robust covariance, PCA reconstruction | Sufficient comparable features/records, valid preprocessing, and method-specific assumptions |
| Supervised error prediction | Logistic regression, random forest classifier, histogram gradient boosting classifier | Reviewed training labels, usable features, and enough examples/classes for fitting and evaluation |
| Expected-value regression | Linear regression, random forest regressor, histogram gradient boosting regressor | Defined target, relevant predictors, and suitable independent evaluation data |
| Time-series forecasts | Naive and seasonal-naive baselines, exponential smoothing, ARIMA, seasonal ARIMA | Meaningful observation dates/frequency, sufficient history, and series grouped by entity, measure, and units |

This is a concrete first implementation inventory across the requested families, rather than an undefined promise of every ML algorithm. It can be extended through the same MCP interface. Each method needs a real implementation, eligibility checks, and verification before appearing as available in the planner's catalog. Report unsupported inputs or insufficient data rather than fabricate forecasts or training results.

Keep model fitting, inference, and evaluation distinguishable. Existing fitted models may be reused when suitable; the application must not claim every library estimator is a pretrained model. The selected plan determines which eligible tools run, rather than blindly running the entire catalog on every upload.

## Execution and model lifecycle defaults

The agent invokes registered MCP tools for groups of checks and analytical work. Do not require one LLM call per row or per numerical calculation. Ordinary code verifies that every required check in the approved plan has a recorded outcome; an omitted, failed, or ineligible required check is not a pass.

Tools load the draft and references by identifiers and versions. Pass identifiers and bounded parameters through MCP rather than repeatedly embedding full files in tool requests or observations. Persist detailed results and return concise summaries with evidence references to the agent.

Fit reusable models on eligible development/reference data, recording preprocessing, features, groups, training window, data provenance, and model version. Reuse compatible fitted artifacts; refit only when needed by a changed baseline, configuration, or evaluated update policy. Supervised fitting waits for reviewed labels. Current-upload exploratory outlier analysis must be identified separately from scoring new records against independent historical training data.

Keep unlike measures, currencies, units, and observation frequencies separate unless an explicit validated transformation makes them comparable. Do not pool all numeric values in the supplied CSV into one financial baseline. Insufficient data for a method is an explicit result.

Forecasts support quality review by providing expected behavior and uncertainty where the selected method supports it; they do not determine corrected source values. A standalone business-forecasting dashboard is not added to the first user journey.

## Evidence handoff to Phase 4

Each result records the draft/version, affected source rows/columns, check or model identifier/version, execution status, baseline/training references, observed values, relevant statistics or predictions, applicable thresholds/intervals, and evidence references.

Keep raw anomaly scores method-specific. Do not average unrelated scores or label an uncalibrated score as the probability of an error. Return disagreement between eligible methods as evidence for investigation. Mandatory deterministic violations remain identifiable regardless of advisory ranking or model disagreement.

Phase 4 interprets this evidence and proposes actions. Phase 3 does not silently correct financial entries or release accepted records.

## Remaining implementation work

Prepare and review the concrete datasets before fitting. Define eligibility thresholds, preprocessing, candidate selection, evaluation splits, exact tools and schemas, fitted-artifact storage, and execution limits. Update the API contract when routes or payload shapes are defined. Verify each exposed method on suitable known-answer and held-out cases; do not advertise an installed estimator as a verified capability.

## Related documents

- [Phase overview](../phases.md)
- [Phase 2 planner](phase-2.md)
- [Evaluation process](../problem/problem-scoping.md)
- [MCP standard transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Scikit-learn outlier and novelty detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [Statsmodels time-series methods](https://www.statsmodels.org/stable/tsa.html)
