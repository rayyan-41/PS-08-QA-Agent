# Phase 5: Review and Resolve

**Status:** Proceeding with the discussed workflow and low-friction implementation defaults. No new framework or model service is introduced.

## Responsibility and inputs

Let the analyst resolve Phase 4 findings while preserving evidence and data history. Inputs are the current draft/profile versions, consolidated findings, proposed corrections, procedures, and ready/held status under the approved policy.

## Review experience

Show a grouped review queue with held findings first. Connect each finding to affected cells, source evidence, the relevant procedure, and its submission implication. Keep detailed model signals expandable rather than showing one repetitive alert per detector.

Preview before-and-after values for supported corrections. Let the analyst approve an individual correction or a selected group in one action; record the decision for every affected finding. A group of corrections must be compatible and refer to the same reviewed draft version. Do not add an approval prompt for every backend tool invocation.

An analyst can verify a suspected anomaly with a reason, supplying further evidence where the approved profile requires it. A dismissal does not remove confirmed required-rule violations or required evidence conditions. Lower-risk advisory findings can be acknowledged without blocking release.

## Apply changes and recheck

Use ordinary Python/FastAPI code to validate the submitted action, confirm its draft version and referenced findings, and apply the approved edits to a new working version. Preserve the original upload and before/after values. Reject stale actions with a clear refresh message rather than applying them to a changed draft.

Rerun affected checks through the existing MCP analytical tools. If an edit changes a relationship or a batch-wide statistic, rerun the corresponding dependent checks over the affected group or batch. Do not automatically refit historical models on analyst corrections as part of every edit.

Prior results remain traceable to their original versions. Only current results can establish readiness for the revised draft. Successful rechecking resolves a finding; clicking Accept by itself does not establish that every holding condition is satisfied.

## Role of code, models, and agents

- Ordinary code handles previews, action validation, edits, versioning, persistence, audit records, and recheck triggers.
- Statistical/ML tools rerun where changes affect their inputs or comparison groups.
- LLM investigation is conditional: a straightforward approved edit requires no new model call. New contextual evidence can return to Phase 4 when interpretation is needed.

Use the existing frontend and backend contract rather than adding a dedicated review service. Store working artifacts in Cloud Storage and structured decisions/status in Firestore, keeping large results referenced rather than embedded into one metadata document.

## Feedback

Record finding/check identifiers, draft/profile versions, the decision, reason, affected changes, and subsequent check results. Acceptance measures adoption; it is not automatically a verified training label.

For the initial feedback demonstration, use a bounded, explicitly scoped change to advisory ranking for comparable future cases, with the reason shown. Required checks, material holding rules, and correction permissions are not waived by accumulated dismissals. Model retraining is separately evaluated and versioned.

## Output to Phase 6

The exact reviewed draft version, current check/review references, remaining holds, approved decisions, and change history. Final submission is a separate explicit action after the review is ready.

## Implementation verification

Verify supported edits, selected-group approval, stale-version rejection, dependency-aware rechecking, retained source values, and feedback behavior. A duplicate action retry must not apply the same edit twice. Use actual outcomes in the UI and adoption metrics.

## Related documents

- [Phase overview](../phases.md)
- [Analytical tools](phase-3.md)
- [Investigated findings and gate policy](phase-4.md)
- [Release and record](phase-6.md)
