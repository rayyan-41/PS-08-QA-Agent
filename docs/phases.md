# First Iteration: Six Core Phases

**Status:** Agreed outer structure and allocation of responsibilities. Detailed choices for each phase remain open until discussed and confirmed with the team.

**Numbering:** Phase 1 through Phase 6. Infrastructure setup and deployment support the whole journey; they are not an extra analyst-facing phase.

## Purpose

Deliver one working journey: upload a draft file, confirm and save a review profile, execute checks, investigate findings, approve a supported correction, recheck, and submit through a quality gate before the accepted destination.

These phases describe responsibilities and handoffs. They do not prescribe six agents, six services, or six screens. One application can implement several phases. The number of agents and choice of frameworks, models, and storage remain undecided.

## Terms

- **Algorithms / ordinary code:** file handling, calculations, explicit validation rules, configuration checks, edits, persistence, and submission controls.
- **Statistics / ML:** descriptive statistics, learned patterns, anomaly detection, historical comparisons, and forecasting where the data supports it. LLMs are also ML models; this document uses ML as shorthand for the structured-data analytical models discussed separately from language models.
- **LLM agents:** interpret context, ask useful questions, plan supported checks, call tools, investigate their results, and explain supported actions.

Use ordinary code where it can reliably perform the work. Introduce an LLM where interpreting language or context, selecting tools, or investigating evidence justifies its cost, latency, and variability. Exact boundaries remain subject to the phase-by-phase discussion.

## Phase overview and handoffs

| Phase | Responsibility | Algorithms / ordinary code | Statistics / ML | LLM agents | Output to the next phase |
|---|---|---|---|---|---|
| **1. Receive and inspect** | Accept a CSV with headers, preserve original values, inspect all rows within agreed limits, and establish a readable draft. | Primary: parsing, empty-value counts, candidate types, mixed-format evidence, and traceable source rows. | Descriptive statistics only; no trained model in this phase. | None. Unresolved business meaning passes to Phase 2. | Original draft, structural summary, preview, and unresolved questions. |
| **2. Understand and configure** | Confirm meaning and context, recommend applicable checks, obtain analyst confirmation, and save a reusable profile. | Validate configuration, available inputs, and tool prerequisites; save the profile. | No custom training is required in this phase. Existing analytical patterns may inform recommendations. | Primary for contextual questions and proposing a supported review plan. | Confirmed field meanings, units, requirements, checks, references, and rules that hold submission. |
| **3. Execute checks** | Perform the selected analyses on the draft and available context. | Explicit checks for required information, ranges, formats, duplicates, and defined relationships. | Outliers, historical patterns, and forecast deviations where applicable. Specific models remain open. | Select and call applicable tools, inspect completion, and request additional checks. Contextual checks may themselves use an LLM with supporting evidence. | Structured measurements, violations, anomaly signals, evidence, and explicit incomplete or inapplicable checks. |
| **4. Investigate and explain** | Combine evidence, consult procedures, investigate explanations, and verify proposed actions. | Verify calculations, evidence references, output requirements, and proposed changes. | Additional analytical calls when the investigation needs them. | Primary for contextual reasoning, further tool use, and supported explanations or actions. | Findings with affected records, evidence, severity, uncertainty, procedure links, and supported corrections. |
| **5. Review and resolve** | Show findings, preview and apply analyst-approved corrections, record decisions, and rerun affected checks. | Primary: user actions, edits, decision records, and recheck triggers. | Rerun affected analyses when relevant. | Explain or reassess contextual findings when needed; no LLM is required for a simple approved cell edit. | Revised draft, decision history, and fresh results for the reviewed version. |
| **6. Release and record** | Enforce submission conditions and write the exact reviewed version to the accepted destination once. | Primary: gate enforcement, version checks, persistence, submission confirmation, and audit records. | No model fitting or prediction is required for release itself. | Optional summary; no discretionary authority to bypass the gate. | Accepted records, confirmation, recorded changes, and feedback available for later reviews. |

## Important transitions

Phase 2 establishes what should run. Phase 3 records what actually ran and what it established. Missing history or supporting documents must not be hidden behind a completed check status.

Phase 3 produces signals; Phase 4 interprets them. A numerical anomaly score is not automatically a probability that a record is wrong, and a forecast is not a source of truth for a replacement value.

Phase 4 can return to Phase 3 for further evidence. Phase 5 returns through Phases 3 and 4 when a correction affects previous results. These are loops within the same happy path.

Phase 6 uses enforceable submission conditions and the current reviewed data version. An agent's narrative does not waive unresolved required checks. Uploading draft data and accepting final records are distinct events.

## Confidence, severity, and feedback

Severity describes potential consequence. Confidence describes evidence strength. Initially, evidence-based categories may be more defensible than numerical confidence percentages; calibrated probabilities require evaluation.

Record feedback when the analyst acts in Phase 5. Demonstrate a bounded effect on future relevant reviews, such as advisory ranking. Acceptance or dismissal alone does not prove correctness, waive a required rule, or authorize automatic correction.

Model fitting, evaluation, and later refreshes form a separate maintenance lifecycle. Most submissions should reuse appropriate existing analytical capabilities. New training after every upload or click is not assumed.

## What the phase documents will decide

Discuss one phase at a time. For each phase, establish its inputs, outputs, responsibilities, relevant data assumptions, use of ordinary code versus statistics/ML versus LLMs, implementation alternatives, trade-offs, and evidence needed to verify it.

The six detailed phase documents below record selected choices, delegated engineering defaults, and remaining implementation work. They do not claim that the application or analytical models are already implemented. Exact route shapes belong in the API contract when defined.

## Phase 1 decisions

CSV-only intake, headers, preservation of original values, full inspection within agreed limits, and deterministic candidate-type detection are confirmed. The Python backend uses Pandas for CSV parsing and profiling; the frontend displays upload progress, the returned preview, and actionable feedback. No LLM or trained model is used here. See the [Phase 1 document](phases/phase-1.md) for details and remaining decisions about CSV conventions, limits, storage, preview controls, and the handoff.

The default CSV format is UTF-8 (including a byte-order mark), comma-separated, with standard quoting and a header row. An optional "Not sure? Detect format" action proposes settings for confirmation; it does not silently apply a guessed format.

The first iteration accepts up to 10,000 data rows per upload (excluding the header), 10 MB per file, and 100 columns. The preview shows the first 50 data rows, while inspection covers all accepted rows. Uploads exceeding a limit receive a clear message rather than being silently truncated. These are agreed product limits to verify during implementation, not measured capacity claims.

Cloud Storage holds original uploads and versioned working files. Firestore holds draft metadata, file references, inspection summaries, status, and saved profiles. Retain files, drafts, and profiles without automatic expiry for the hackathon. Region remains an implementation choice; organizer credits are expected. Phase 6 reuses these services for the accepted snapshot and authoritative acceptance record.

FastAPI is confirmed. Upload and inspection use separate requests, with inspection returning when complete rather than introducing a job queue initially. Phase 2 loads a persisted inspection identified by draft ID and version; the frontend receives its preview and summary.

Phase 1 is locked: unreadable or structurally invalid files and exceeded limits block progression; readable mixed types and ambiguous values proceed as warnings after preview confirmation. See the detailed phase document for the full behavior. Remaining detector, version, region, and route details belong to implementation planning.

## Phase 2 decisions

[Phase 2](phases/phase-2.md) uses one Google ADK ReAct planner with deterministic validation, summaries first with bounded examples on demand, a configurable supported-check catalog, and profile reuse after compatibility and meaning confirmation. Use Gemini Developer API free-tier inference during development, with no automatic paid fallback; OpenAI access is planned later.

Phase 2 asks adaptive batches of 3–5 unresolved questions, with suggested answers and optional text. Optional context initially includes built-in demo references, text/Markdown, and historical CSVs; PDF and Word ingestion are deferred.

Phase 2 is locked. Initial reference retrieval uses direct lookup and keyword search without a vector database. One consolidated profile approval saves the plan and begins review; ordinary tool calls and individual checks do not prompt for approval. Compatible profile reuse combines meaning/units confirmation and running in a single action. Material plan changes receive a concise change summary for reapproval.

## Phase 3 decisions

Phase 3 uses Streamable HTTP MCP and broad first-iteration statistical/ML coverage, including forecasting. Split supplied records into development/reference and reviewed evaluation roles, supplementing with identified suitable forecasting history. The [Phase 3 document](phases/phase-3.md) specifies the concrete initial catalog and engineering defaults; availability and results still require implementation and verification.

## Phase 4 decisions

[Phase 4](phases/phase-4.md) validates and consolidates evidence, investigates through ReAct/MCP, and produces validated actionable findings. The confirmed gate is risk-based: required-rule violations and material suspicions under the approved profile hold submission; lower-risk anomalies remain advisories. Code enforces this policy, not an unconstrained LLM verdict.

## Phase 5 workflow

[Phase 5](phases/phase-5.md) provides grouped review, individual or selected-group correction approval, recorded verification reasons, new draft versions, and dependency-aware rechecks. Routine edits use ordinary code; contextual investigation invokes the existing agent only when needed. Feedback affects advisory ranking within explicit limits and does not waive required checks.

## Phase 6 workflow

[Phase 6](phases/phase-6.md) enforces the gate on the exact reviewed version, then publishes a whole accepted batch. The prototype uses an immutable Cloud Storage payload plus a transactionally published Firestore acceptance record. Submission retries return the same receipt. No LLM release approval or new database service is added. External database connectors and per-row materialization are later integrations.

## Related documents

- [Initial problem scope](problem/initial-problem-scope.md)
- [First iteration journey](problem/first-iteration-solution.md)
- [Evaluation definitions and data limitations](problem/problem-scoping.md)
- [Vision and competitor research](strategy/vision-and-competitors.md)
