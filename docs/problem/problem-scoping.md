# PS-08 Problem Scoping

**Date:** 20 October 2026  
**Status:** Record of the team's problem discussion and proposed evaluation approach. This document does not select the technical stack or claim measured product performance.

**Current scope:** The updated [initial problem scope](initial-problem-scope.md) and [first iteration journey](first-iteration-solution.md) describe the current direction: saved review profiles and a quality gate before the accepted destination. This file preserves the earlier discussion and detailed evaluation definitions; read workflow questions below alongside the newer documents.

## What the problem asks us to build

Build a predictive QA agent that reviews an analyst's data entry before submission. It acts like a spell-checker for data: find likely mistakes, explain the evidence, rank their severity, and suggest what the analyst should do next.

The user is an analyst entering or processing records. Errors that escape review cause rework, escalations, missed service deadlines, and reduced quality scores. Existing static checks miss mistakes that require historical context or reasoning across fields and records.

The brief requires:

1. Pre-submission validation using LLM reasoning over the available context.
2. Historical error pattern analysis to predict likely mistakes.
3. Cross-field and cross-record consistency checks.
4. Severity-ranked issues with suggested corrections and links to relevant procedures.
5. A feedback loop in which analyst decisions on suggestions improve future predictions.

The suggested GCP services in the brief are suggestions; the technical implementation is a separate team decision. Event deployment and agent workflow requirements still apply; see [AGENTS.md](../../AGENTS.md).

## Example user journey

This is an illustrative scenario, not a row from the supplied dataset:

1. An analyst enters company revenue of 100 million; the previous value was 10 million.
2. Before submission, the agent retrieves relevant history and supporting context and checks for inconsistencies.
3. The agent flags the tenfold jump for verification. An extra zero is one possible explanation, but the increase could be legitimate; historical difference alone does not establish an error or the correct replacement value.
4. If the record also contains an acquisition date later than the reporting cutoff, the agent checks the applicable procedure and flags any confirmed conflict separately.
5. The analyst reviews the findings, corrects the entry or dismisses a suggestion with a reason, and submits after review.
6. The system records those decisions for future improvement. Analyst acceptance is useful feedback, but is not automatically proof that a suggestion was correct.

Each finding should help the analyst understand the affected field or record, the evidence, its severity, the proposed action, and the relevant procedure. The exact API and UI representation remains to be agreed.

## What the problem statement evaluates

The brief lists three criteria without numerical targets or weights:

| Criterion | Meaning | Example |
|---|---|---|
| Error catch rate | Share of actual errors detected before submission | Catching 8 of 10 real errors gives 80% recall |
| False alarm rate | Share of correct entries incorrectly flagged | Flagging 5 of 100 correct entries gives a 5% false positive rate |
| Analyst trust/adoption | Whether analysts find the system useful and use its suggestions | Suggestion acceptance and actual use, interpreted alongside correctness |

Precision and F1 are useful additional metrics. Reporting precision and recall does not require reporting F1.

For an entry-level binary evaluation, define a positive as an entry containing at least one confirmed error:

- **TP:** erroneous entry correctly flagged.
- **FP:** correct entry incorrectly flagged.
- **FN:** erroneous entry missed.
- **TN:** correct entry correctly left unflagged.
- **Precision:** `TP / (TP + FP)`.
- **Recall / error catch rate:** `TP / (TP + FN)`.
- **False alarm rate:** `FP / (FP + TN)`. This differs from `1 - precision`.
- **F1:** `2 * precision * recall / (precision + recall)`.

State the counting unit, treatment of uncertain cases and zero denominators, sample size, and split when publishing results. Entry-level detection scores do not establish correct error classification or correct suggested fixes; assess those separately if claiming them.

## What we learned about the supplied data

The [original CSV](../../data/ps08_data_entries.csv) contains 300 entries: 223 labeled `None` and 77 labeled with an error. The seven error categories are Range Violation, Logical Inconsistency, Missing Document, Duplicate Entry, Date Conflict, Format Error, and Stale Data. See the [data dictionary and notes](../../data/README.md).

The historical labels are available, but their reliability as evaluation answers requires review. Our inspection found:

- Only 3 of the 11 entries labeled `Range Violation` fall outside their stated range.
- 47 entries labeled `None` fall outside their stated range.
- Only 2 of the 8 entries labeled `Missing Document` have `has_supporting_doc=False`.
- `entered_value` is numeric even for fields named `acquisition_date` and `completion_status`.

These observations establish disagreement between labels and visible fields. They do not establish why the disagreement exists. The data may be intentionally dirty, synthetic, or dependent on business context absent from the CSV. No model performance conclusion follows without an experiment.

The CSV provides a supporting-document flag rather than document contents and limited context for proving date conflicts, cross-field contradictions, or duplicate business events. Confirm what additional evidence each error category needs before treating it as objectively detectable.

## What “cleaning” means for this problem

Preserve the supplied CSV as the raw source. Erroneous inputs are valuable examples for an error-detection agent; replacing their values with correct values would remove the mistakes we want it to detect.

Our proposed preparation work concerns schema meaning, context, and evaluation labels. For reviewed examples, retain the original input and supplied label, record the reviewed label and rationale separately, and mark examples as uncertain when available evidence is insufficient. Document any proposed correction separately from the original value.

A trusted evaluation answer needs an explicit error definition and enough evidence to decide whether the input violates it. Historical rejection alone is a provisional label until reviewed.

## Proposed data and evaluation process

1. Preserve the original dataset and document its limitations.
2. Define each error category, relevant business rules, and required context.
3. Create a human-reviewed evaluation set with evidence and reasons for its labels. Record uncertain cases explicitly and disclose how they affect scoring.
4. Freeze that evaluation set before tuning prompts, checks, examples, or models. Keep its answers out of the agent's accessible context and tools.
5. Use the remaining development data to build the workflow and investigate historical patterns.
6. Find additional datasets whose fields, business meaning, and error definitions fit this workflow. Record provenance and label methodology; no external dataset has been selected yet.
7. Augment development data with realistic, documented errors such as changed digits, missing required evidence, conflicting dates, duplicates, and cross-field contradictions. Include legitimate unusual entries so the agent can learn to avoid unnecessary alerts. Review generated examples for coherent labels.
8. Split source examples before augmentation. Keep related records and generated variants together to prevent near copies leaking across development and evaluation. Choose the split according to the intended use case, including time or entity boundaries where appropriate.
9. Report reviewed real-data results separately from synthetic challenge results. State the test set size, error mix, limitations, and method; generated examples alone do not establish real-world performance.

For prediction, exclude `error_type`, `was_rejected`, and `rejection_reason` from the current entry's input. Historical labels from development records may inform the agent, but evaluation answers must remain inaccessible. Review every other field for whether it would actually be known before submission.

## Decisions still open

- The exact analyst workflow, domain rules, severity definitions, and procedure sources.
- The additional context and record structure needed for cross-field and cross-record checks.
- Evaluation set membership, reviewers, split strategy, and handling of uncertainty.
- External datasets and augmentation methodology.
- How analyst feedback will change subsequent predictions and how that improvement will be demonstrated.
- Technical stack, agent architecture, and frontend/backend API contract.

## References

- [Official PS-08 brief](ps-08-problem-statement.md)
- [Dataset notes](../../data/README.md)
- [Team plan](../team/team-plan.md)
- [Frontend handoff](../team/frontend-handoff.md)
