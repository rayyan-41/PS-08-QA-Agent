# Initial Problem Scope

**Updated:** 20 October 2026

**Status:** Working scope combining the latest team research and product discussion. Technology choices remain open.

## The problem

An analyst enters company information that other people rely on. A value can look plausible and still be wrong: an extra zero, a figure copied from the wrong reporting period, an overlooked duplicate, or a change without the required supporting evidence.

Simple checks catch some mistakes. Others need earlier values, related records, company context, and team procedures. Finding them after submission causes repeated work and further investigation.

Our product checks draft records before they reach the destination database, explains suspected problems, and helps resolve them before submission.

## The first user and task

The primary user is a financial data analyst at a data provider, preparing company figures for submission. They want fewer rejections, accurate records, and less repetitive checking. A QA reviewer or team lead is a secondary user; their separate journey can follow later.

The first task is to upload a draft file of company data, confirm a few details, save the recommended review profile, resolve an evidence-backed finding, and submit the reviewed batch through a quality gate.

Company data is the first demonstration domain because it matches the provided examples. A configurable service for other workflows is the broader direction.

## How the product understands the task

The product inspects the file and proposes what its columns mean. It asks short questions about what it cannot establish: the meaning of a row, units, reporting periods, required values or documents, duplicate definitions, and relationships between records.

Analysts should not have to write a long description or choose individual agents to begin. Recommended checks should explain their purpose and identify any missing information.

## History and supporting context

Reusable checks and clearly identified reference material can be available from the start. Analysts may optionally provide their own history, documents, references, or procedures.

General patterns do not establish what is normal for a particular company. A forecast-based check needs suitable history; an unusual value supports verification rather than an automatic conclusion that it is wrong. Missing evidence must be stated.

Demonstration history and team-created procedures must identify their source. The supplied file contains a document-present flag rather than document contents, and some checks need context absent from its columns.

## Saved review profiles

A profile remembers the confirmed column meanings, units, required information, references, chosen checks, and submission rules. The analyst names and saves it, then retrieves it for future compatible files without repeating setup. Changed or missing columns must be identified before reuse.

## The quality gate and findings

The gate automatically identifies records that meet the configured checks and holds those needing attention. In the first journey, the analyst resolves the batch's holding issues before releasing it to the accepted destination.

Each finding identifies the affected record, shows evidence, explains potential consequences, links the relevant procedure, and offers a clear next action. A replacement value needs supporting evidence. Analysts can inspect changes and record decisions with reasons.

Severity describes consequences if the issue is real; confidence describes evidence strength. Distinguish confirmed rule violations, unusual values needing verification, and cases lacking enough context. Precise confidence percentages require measured support.

## Feedback and growing autonomy

Record analyst decisions and show a specific, bounded effect on future relevant reviews, such as changing the order of a comparable advisory finding. Acceptance or dismissal alone does not establish correctness, waive required rules, or authorize automatic correction.

The longer-term vision is a quality layer that passes acceptable records, holds likely errors, asks about uncertainty, and makes only specifically authorized corrections automatically. The first complete journey uses analyst-approved corrections. Broader autonomous correction follows after its actions, evidence, and permissions are agreed and evaluated.

## What success means

- Detect confirmed errors before submission while keeping unnecessary alerts low.
- Help the analyst understand and resolve findings with less effort.
- Save a profile and retrieve it for future work.
- Keep held records out of the accepted destination until resolved.
- Record decisions and demonstrate a bounded feedback effect.
- Complete the real journey on Google Cloud Platform.

Performance claims need reviewed answers and an explicit evaluation method. Supplied labels are provisional because some disagree with visible fields. Preserve the raw file and keep reviewed supplied results separate from generated challenge results. Detailed metric definitions remain in [problem-scoping.md](problem-scoping.md).

## Boundaries and open questions

This iteration covers one analyst journey with one draft file and a saved profile. Continuous monitoring of stored tables, live feeds, multiple organizations, separate reviewer workflows, arbitrary agent editing, and independent forecasting reports are later paths.

The exact demonstration data, reference history, procedures, field meanings, holding rules, and feedback effect still need agreement. Agent count, models, frameworks, storage, and service interfaces belong in the upcoming technical discussion.

## Related documents

- [First iteration journey](first-iteration-solution.md)
- [Official problem statement](ps-08-problem-statement.md)
- [Earlier discussion and evaluation definitions](problem-scoping.md)
- [Vision and competitor research](../strategy/vision-and-competitors.md)
- [Dataset notes](../../data/README.md)
