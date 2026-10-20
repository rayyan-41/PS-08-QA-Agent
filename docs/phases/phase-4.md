# Phase 4: Investigate and Explain

**Status:** Core workflow and risk-based submission policy confirmed. Implementation follows the existing ADK, model, MCP, and storage choices. Exact schemas and policy parameters are defined alongside the check catalog.

## Responsibility and inputs

Turn Phase 3's versioned analytical evidence into a concise, actionable review. Inputs include the approved profile, check outcomes, model/baseline references, affected records, source context, and procedure references. Preserve the difference between measured evidence and an interpretation of that evidence.

## Workflow

1. Ordinary code validates draft versions, record references, source references, and tool completion status. Missing or invalid evidence is not a successful check.
2. Consolidate related signals into useful findings. Several detectors flagging one potential issue should not create repetitive alerts; preserve their individual results and disagreements in the supporting detail.
3. Use one investigation agent with the existing Google ADK ReAct approach and configured development model policy. Retrieve bounded record details, procedures, and additional analytical results through MCP as needed. A dedicated reviewer-agent hierarchy is not added.
4. Explain the issue, relevant uncertainty, likely consequence, and supported next action. Propose replacement values only when evidence establishes them. Historical expectations and forecasts alone do not establish a correct source value.
5. Validate the structured report in ordinary code. Check evidence references, supported actions, completeness, and conformity with the approved profile before presentation.

An example is revenue of 100 million compared with earlier values near 10 million. An acquisition may explain the change. Without evidence establishing the intended value, the action is verification rather than replacing the value with the previous observation.

## Confirmed risk-based gate

Hold submission for confirmed violations of required rules and material suspected errors that meet the approved profile's holding conditions. Show lower-risk anomalies as advisories.

Code applies the configured holding policy. An LLM's opinion alone does not invent a new blocking rule, waive a required rule, or convert an incomplete required check into a pass. Material suspicion must trace to evidence and the profile's configured treatment, not just a high-severity adjective in generated text. Preserve deterministic violations even if other evidence is reassuring.

Define field criticality, check thresholds, and holding conditions with the profile and tool catalog. Record which condition caused each hold. Until a required check completes or its applicable prerequisite is resolved, the result cannot count as validated for release.

## Finding contents

- Stable finding identifier, affected record/field references, and draft/profile versions.
- Observed value, supporting measurements, relevant sources, and model/check identifiers.
- Explanation of why the issue matters, with uncertainty and alternative explanations where supported.
- Severity reflecting potential consequence if the issue is real.
- Evidence strength, distinguishing confirmed violations, supported suspicions, and insufficient context.
- Recommended action: correct, verify, provide evidence, or acknowledge an advisory.
- Relevant procedure and any evidence-backed proposed replacement.
- Submission effect: hold or advisory, with its configured policy reason.

Raw scores retain their model-specific meaning. Numerical confidence percentages require calibration and evaluation. Do not invent a probability from narrative confidence or average incompatible anomaly scores.

## Output and handoff

Persist a versioned review with consolidated findings, supporting evidence references, completion information, and ready/held status per record. Return concise summaries for the frontend while detailed evidence remains retrievable using the existing storage services. Phase 5 lets the analyst resolve those findings.

The activity view shows actual tool calls, observations, and concise action summaries. LLM inference failures must be identified; existing deterministic evidence remains available without pretending contextual investigation completed.

## Boundaries

This phase does not apply unapproved data edits or submit records to the accepted destination. It investigates and proposes actions; Phases 5 and 6 handle resolution and release. Grouping findings must preserve distinct rule violations, source provenance, and all active holding conditions.

## Related documents

- [Phase overview](../phases.md)
- [Approved planning behavior](phase-2.md)
- [Analytical evidence](phase-3.md)
- [First iteration journey](../problem/first-iteration-solution.md)
