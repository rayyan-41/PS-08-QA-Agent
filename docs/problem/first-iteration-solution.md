# First Iteration: End-to-End Solution

**Updated:** 20 October 2026

**Status:** Proposed first complete journey, written to guide the next discussion. Technology choices remain open.

## What we demonstrate

A financial data analyst uploads a draft file, confirms and saves a review profile, resolves an evidence-backed finding, and submits the reviewed batch. A quality gate keeps unresolved records out of the accepted destination. This is one journey from draft to accepted data, with reusable settings for future work.

## Starting conditions

The analyst is in a working workspace with a small company-data file. The demonstration includes legitimate records and a mistake that available evidence can establish. Any built-in history, references, and team-created procedures identify their source.

The accepted destination is separate from draft uploads so the demonstration can show held records staying out. Account creation, billing, and organization administration are separate journeys; beginning in a prepared workspace must not imply those features exist.

## 1. Upload and inspect the file

The analyst uploads a draft file and sees a readable preview. The product identifies columns, likely value types, and obvious gaps, then explains what it thinks the important columns mean. The original input remains available for comparison.

## 2. Answer targeted questions

The product asks only what the file cannot establish. For example:

- Does each row describe a company figure for a particular reporting period?
- Are monetary values in units, thousands, or millions?
- Which fields together identify a record that should appear only once?
- Which fields or documents are required before submission?

The analyst confirms or corrects the suggestions. Additional history, source documents, procedures, or references are optional. The product shows what context it already has and which checks need more evidence.

## 3. Confirm and save the review profile

The product recommends applicable checks with explanations. The analyst confirms the plan and saves a named profile such as "Company financial updates".

The profile remembers column meanings, units, required information, references, chosen checks, and rules for holding submission. It remains available when the analyst returns. A compatible future file can reuse it after checking for changed or missing columns.

Users configure understandable checks and requirements. Choosing agent names or editing internal prompts is not required to begin. Checks that lack prerequisites must not be presented as completed.

## 4. Execute the review and investigate

The agent follows the confirmed plan and calls specialist checks for formats, required information, ranges, duplicates, relationships, historical changes, and unusual patterns where the evidence supports them.

It brings the results together, retrieves relevant context, and requests further checks when needed. Calculations and proposed changes are verified before presentation.

The analyst sees meaningful progress such as "Checking related records" and "Comparing available history", plus an account of actual checks and their results.

## 5. Review the gate decision

The product marks each record as ready or held and asks for verification where evidence is uncertain. In this journey, the batch remains a draft until holding issues are resolved and the analyst submits it.

The review prioritizes findings by consequence and distinguishes confirmed violations from suspected anomalies. Each finding shows:

- The affected record, field, and entered value.
- The evidence and its source.
- Why it matters and how strong the evidence is.
- The next action and linked procedure.
- A proposed replacement, if supported, with a preview of the change.

For example, a tenfold revenue increase can justify verification. A supplied source report may establish the intended value; the previous revenue alone does not. The system should explain that difference.

## 6. Resolve and recheck

For the happy path, the analyst inspects evidence and accepts a supported correction. The product records the original value, the change, the reason, and the analyst's decision. It reruns affected checks, including relationships the change could alter, and shows the new result.

Feedback is saved for future relevant reviews. Its first effect must be specific and demonstrable, such as changing the order of a comparable advisory finding with the reason shown. A single decision does not establish correctness or remove required checks.

Dismissal and escalation remain parts of the broader design; they do not require separate demonstration journeys in this iteration. The current path uses analyst-approved corrections rather than autonomous edits.

## 7. Submit and inspect the outcome

After holding issues are resolved, the analyst submits. The system confirms that submission uses the current reviewed values and records the accepted batch in the demonstration destination.

The analyst sees which records were accepted, a record of changes, and an option to download the reviewed data. A draft upload is not an accepted submission. A report download alone does not demonstrate a gate: unresolved records must stay out of the accepted destination and reviewed records must reach it after release.

## What counts as complete

- The deployed Google Cloud Platform service runs this journey on actual inputs with actual check results.
- A profile can be saved and retrieved after returning to the workspace.
- The plan leads to real checks with supporting evidence and relevant procedures.
- A confirmed mistake is held, corrected, rechecked, and accepted.
- The accepted destination records the reviewed values once and excludes unresolved drafts.
- Original values, changes, and decisions can be inspected.
- Saved feedback has a bounded, demonstrable effect on a later relevant review.
- Accuracy results identify the evaluation method and distinguish reviewed supplied examples from generated examples.

## Decisions for the next discussion

Agree the demonstration file, field meanings, holding rules, procedures, reference history, initial checks, and feedback effect. Then choose how the system delivers this journey. The number of agents, models, tools, and hosting components remains open.

The broader vision includes authorized automatic correction, live intake, and separate reviewer workflows after this first journey works.

## Related documents

- [Initial problem scope](initial-problem-scope.md)
- [Evaluation definitions and dataset findings](problem-scoping.md)
- [Vision and competitor research](../strategy/vision-and-competitors.md)
