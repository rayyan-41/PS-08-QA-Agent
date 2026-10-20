# Phase 1: Receive and Inspect

**Status:** Phase 1 product behavior and core stack locked for the first iteration. Remaining engineering details can be resolved during implementation without reopening the agreed behavior.

## Responsibility

Receive a draft CSV, preserve the original input, inspect its structure and values, and produce a preview plus a factual summary for Phase 2. Establish what values can be parsed as; Phase 2 establishes business meaning and applicable rules.

## Confirmed decisions

- Start with CSV; expand to other file formats later.
- Accept at most 10,000 data rows per upload, excluding the header. Inspect every accepted row. Reject an upload exceeding this limit with an actionable message; do not silently truncate or treat the first 10,000 rows as the complete file. This is a first-iteration product limit, not a measured capacity claim.
- Accept files up to 10 MB and at most 100 columns. Show the first 50 data rows in the initial preview while computing inspection results over all accepted rows. Enforce these product limits explicitly and verify them during implementation; they are not measured capacity claims.
- Default to UTF-8 (including UTF-8 with a byte-order mark), comma-separated fields, required headers, and standard double-quote escaping for quoted fields, embedded commas, and line breaks.
- Provide an optional "Not sure? Detect format" action. Use deterministic detection to suggest a delimiter and, where possible, an encoding. Show uncertainty and require confirmation before applying detected settings. Detection must not silently reinterpret the upload or pretend to establish an uncertain encoding. If the format cannot be established, explain how to export a supported CSV.
- Use Python with FastAPI for the backend and Pandas for CSV parsing and profiling.
- Configure Pandas to read cell values as strings initially, preserve literal markers such as `None` and `NA`, and report malformed records rather than silently skip them. Keep candidate numeric and date representations separate from the preserved text. Exact reader settings and header/row-shape checks must implement these requirements explicitly.
- The backend performs authoritative parsing and inspection. The frontend handles file selection, upload progress, and displaying the backend's preview and feedback. A separate browser parser is not required for this iteration.
- Require a header row and show a preview so the analyst can verify how the file was read.
- Use an established CSV parser that understands quoted fields and embedded delimiters. Do not split lines on commas manually.
- Preserve the original file and cell text. Keep candidate typed representations separate from the original values.
- Inspect every row within an agreed file-size and row-count limit. A small preview is not the basis for whole-file conclusions.
- Use deterministic parsing rules and descriptive statistics. No LLM or trained ML model is required in this phase. Ambiguous business meaning passes to Phase 2.
- Keep stable references to source rows and columns for later findings and edits. A logical CSV record may span multiple physical lines.
- Report mixed and ambiguous values with counts and source references. Do not silently convert unparseable values to missing data or discard rows.
- Keep structural type candidates separate from business meaning. A decimal-compatible column does not establish currency, units, reporting period, or the meaning of its measure.

## How columns and candidate types are detected

The parser identifies fields according to the supported CSV format and takes column names from the header row. Original names and column positions remain available; duplicate or unclear names must not silently overwrite data.

Read values as text first. For each column, test the nonempty values against explicit supported parsing rules, such as integer, decimal, boolean, and unambiguous date formats. Record match counts, exceptions, and unresolved formats. An inferred type is a candidate rather than a confirmed business requirement.

For example, a column with 295 integer-compatible values and 5 other values is mixed. Preserve the five exceptions and their source references so later phases can interpret them.

Names can provide hints for later interpretation, but they do not establish units or business rules.

## Examples to preserve correctly

| Input | Required treatment |
|---|---|
| Identifier `00123` | Retain leading zeros; do not silently replace it with `123`. |
| Literal `None` or `NA` | Preserve the text. Do not assume it is a missing-value marker. |
| Empty cell | Count it as empty without inventing a value. Additional business missing-value conventions are confirmed later. |
| Date `03/04/2026` | Report ambiguous interpretation unless the format has been established. |
| Number-like text `1,250` | Preserve the value; locale and grouping conventions may need confirmation. |
| A column containing only blanks | Report insufficient evidence for type inference. |
| A quoted company name containing a comma | Parse it as one field using CSV quoting rules. |

## Output to Phase 2

- Original file reference and draft identifier.
- Parsed rows with stable source references and original text values.
- Column names and positions, row and column counts, and a readable preview.
- Per-column empty counts, distinct-value counts, type candidates, parsing match counts, and mixed-format examples.
- Structural issues and unresolved questions that need confirmation.

Persist the inspection result and refer to it using a draft ID and version. Send the preview and summary to the frontend; Phase 2 loads the saved result rather than recomputing it by default. A change to input or parsing settings requires a new corresponding inspection version. Exact field names and route shapes remain to be specified in the API contract. Structural problems that prevent a faithful parse must be distinguished from business errors inside otherwise readable records.

## Request flow

Use separate upload and inspection requests. The upload request establishes a stored draft. The inspection request uses the confirmed/default parsing settings, waits for inspection to finish, persists the result, and returns its reference, preview, and summary. Optional format detection can occur between those requests, with settings confirmed before inspection.

Do not introduce a background-job queue in this initial phase. Keep inspection implementation separate from request handling so execution can change later if measured latency justifies it. CPU work must not block an asynchronous event loop merely because the route is declared asynchronous; choose the appropriate execution mechanism during implementation.

Persist status and errors so a frontend can retrieve the state after a lost response. A draft ID alone is not proof that an inspection completed. Exact retry behavior and route definitions belong in the API contract.

## Preview and feedback experience

The analyst sees upload progress, a clear inspection-in-progress state, and the backend-produced preview when available. Progress indicators must reflect actual observable work; do not invent completion percentages for inspection stages.

Show detected columns, row counts, candidate types, empty counts, and mixed or ambiguous formats. Connect examples to the affected rows and columns. Explain parsing problems with an actionable message rather than only a generic failure.

Let the analyst confirm that the file has been read correctly and identify a mistaken structural interpretation. If an intake setting changes, the backend reparses the preserved original and refreshes the preview. Exact controls and supported CSV settings remain to be chosen.

Intake feedback concerns whether the file was read correctly. Business meaning is confirmed in Phase 2, and decisions on quality findings belong in Phase 5. A preview confirmation does not approve the data for submission.

## Conditions for passing to Phase 2

Block progression when a file cannot be faithfully read: unreadable input, exceeded upload limits, missing or duplicate headers, or inconsistent record structure. Explain the affected location and how to correct or re-export it. A wrong delimiter can require corrected parsing settings rather than editing the source values.

Readable mixed types, empty cells, ambiguous dates, and suspicious values proceed with warnings and source references. These are inputs to contextual interpretation and quality checks, not grounds for discarding records during intake. The analyst confirms the preview before proceeding; that confirms the interpretation, not final submission approval.

## Implementation details to resolve

Choose the optional detector and supported alternative format settings while preserving the confirmed default and explicit confirmation behavior. Pin dependency versions and define region, preview controls, draft/version references, retry handling, and the API contract during implementation planning. No additional services or LLM are implied by these details.

Python, FastAPI, Pandas, CSV-only intake, and Cloud Storage plus Firestore are confirmed. Dependency versions remain to be pinned during implementation. Agreed upload limits require verification during implementation; they are not measured capacity claims.

## Storage and continuity

Use Google Cloud Storage for original CSV uploads and versioned working-data files. Preserve the original; approved edits produce a new working version.

Use Firestore for draft identifiers, file references, processing status, inspection summaries, and saved review profiles. Store file contents as objects rather than putting an entire CSV into a metadata document. Later phases refer to a draft and its version, rather than repeatedly transferring the full dataset through the browser.

The organizers are expected to provide cloud credits. Do not depend on credits being active until checked during deployment. Region selection remains open and can prioritize compatibility, latency, and transfer costs alongside the compute and model services; a US region is not required solely for the Cloud Storage free allowance.

For the hackathon, retain uploaded files, working drafts, and profiles without automatic expiry. Do not add a timed deletion policy or cleanup workflow to this iteration. Retention policy for a later product can be discussed separately.

This decision concerns draft files, metadata, and profiles. The accepted-records destination for Phase 6 remains to be chosen. Storage setup and detailed consistency behavior will be defined during implementation planning.

## References

- [Six-phase overview](../phases.md)
- [First iteration journey](../problem/first-iteration-solution.md)
- [Dataset conventions](../../data/README.md)
- [Python CSV parsing documentation](https://docs.python.org/3/library/csv.html)
- [Pandas CSV parsing controls](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html)
- [Cloud Storage objects](https://docs.cloud.google.com/storage/docs/objects)
- [Firestore data model](https://firebase.google.com/docs/firestore/data-model)
- [FastAPI file uploads](https://fastapi.tiangolo.com/tutorial/request-files/)
