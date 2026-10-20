# Phase 2: Understand and Configure

**Status:** Phase 2 product behavior and core stack locked. The initial supported check catalog is defined with Phase 3; remaining engineering details are implementation work.

## Responsibility and input

Load the versioned Phase 1 inspection, establish business meaning and available context, ask targeted questions, and propose a review profile for analyst confirmation. Save the confirmed profile and executable review plan for Phase 3.

## Confirmed: summaries first, evidence on demand

Give the planning process the schema and persisted inspection summaries first. Use a proper ReAct tool loop to inspect bounded examples or additional context when needed rather than placing the entire uploaded dataset into the initial model request.

The loop observes available context, identifies an unresolved question, selects an applicable tool, receives actual results, and reassesses what is needed. Repeat until the plan can be proposed, clarification is required from the analyst, or an execution limit is reached. Treat an unanswered question as unresolved, not as a fact to invent.

Candidate tool capabilities include retrieving column examples, inspecting mixed-format cases, reading available procedures and reference definitions, checking available history, listing supported checks, and validating a proposed configuration. Exact tool definitions and provider transport remain undecided. This phase gathers planning evidence; the full execution of selected quality checks belongs in Phase 3.

Apply bounded tool outputs, iteration/token/time budgets, and explicit stopping conditions. The exact budgets are engineering choices still to be set. Persist user answers and plan revisions so analyst clarification can resume planning without restarting intake. Record tool calls, observations, and concise action summaries for the visible activity history.

## Confirmed: supported-check catalog

The plan selects supported checks and configures their parameters from a defined catalog. A plain-language request may be translated into these settings. Identify unsupported requests and missing prerequisites explicitly instead of inventing executable capabilities.

Ordinary code validates check identifiers, column references, parameter types, dependencies, and required context before the plan is accepted. The analyst confirms the proposed plan and its assumptions. No arbitrary generated Python or SQL execution is implied by this choice.

Each selected check needs its affected columns, parameter settings, prerequisites, purpose, applicable procedure reference where available, and submission treatment. Exact schema and supported initial check set will be specified later.

## Confirmed: guided questions

Ask short adaptive batches of 3–5 questions when that many unresolved questions exist; ask fewer when appropriate. Provide suggested answers and optional free text. Skip questions already resolved by confirmed evidence or a compatible saved profile. Do not require the analyst to write an initial paragraph or answer a question for every column.

Persist answers against the draft/plan context and resume the ReAct loop with those answers. Keep confirmed facts distinguishable from unconfirmed suggestions. Use deterministic controls for collecting structured choices; invoke the planner when contextual interpretation or replanning is needed rather than on every frontend interaction.

## Confirmed: optional context inputs

Start with clearly identified built-in demo references and allow analyst-entered context, text/Markdown procedures, and historical CSV uploads. PDF and Word extraction are outside the initial context intake path.

Historical CSVs reuse the agreed CSV intake and inspection behavior, with an explicit historical-reference role distinct from the draft being submitted. Establish relevant field mappings, units, entities, and periods before using them for comparison. A historical file is optional and does not automatically constitute a trusted baseline or suitable forecasting series.

Keep reference sources and versions identifiable so the plan can cite the actual material used. Built-in demo procedures are team-created examples unless they come from an identified external authority. Scope source access to the current workspace and keep evaluation answers inaccessible to the planner's reference tools.

## Confirmed: reference retrieval

Use direct lookup plus keyword search for the initial procedure and reference set. Return bounded relevant excerpts with identifiable source and version references. No embedding model or vector database is required for this first iteration. Revisit semantic retrieval only if evaluation identifies missed matches that justify it.

The ReAct planner can refine a lookup or ask for clarification when retrieval is insufficient. A missing result does not establish that no relevant rule exists.

## Confirmed: consolidated approval with minimal friction

Present one concise profile summary with its purpose, important assumptions, selected checks, submission implications, and limitations. Allow optional expansion and editing of supported settings; do not require opening or approving every check individually.

Use one consolidated action to confirm and save the profile and begin the review. Routine reference lookups, sample retrieval, plan validation, and execution of the approved checks do not ask for separate approvals. Ask targeted clarification only for unresolved information that changes correctness or the applicable plan.

For compatible profile reuse, combine confirmation of unchanged meaning/units and starting the run into one action. Do not force a full setup or repeated plan approval. Material changes to assumptions, requirements, checks, or submission rules show a concise change summary for approval of the revised profile; cosmetic changes do not trigger additional approval.

Approval here authorizes the check configuration and starting the review. It does not automatically approve later data corrections or final submission, which remain part of Phases 5 and 6.

## Role of models and code

LLM-based planning interprets context, chooses evidence-gathering tools, asks questions, and recommends applicable checks. Ordinary code validates and persists the configuration. No new analytical ML training is required to configure a profile. Phase 3 uses the selected analytical capabilities when their prerequisites are satisfied.

Use one ReAct planning agent with deterministic plan validation for the first iteration. The agent gathers evidence, asks contextual questions, and proposes a profile. Ordinary code checks catalog membership, parameters, references, and prerequisites before analyst confirmation. Do not add a separate LLM reviewer or supervisor/specialist hierarchy initially. Specialization comes from supported tools and focused instructions. Revisit additional agents only if evaluation identifies a concrete need.

## Framework and development model policy

Use Google ADK for the single planning agent. Use an eligible Gemini Developer API free-tier model during development, authenticated through a backend-only API key obtained from Google AI Studio. This replaces the proposed organizer-funded Vertex model route for current development; cloud infrastructure may still use the provided credits.

Do not automatically upgrade billing, switch to a paid model, or use paid fallback inference. Free access is subject to available models, account eligibility, and rate limits; verify the active free tier and select a tool-capable model before running integration tests. If quota is exhausted, show a clear waiting/error state with bounded retries rather than claiming a plan was generated.

The user intends to provide an OpenAI key later. Keep provider/model selection configurable and analytical tools independent of the provider. The OpenAI model and adapter remain undecided; verify their tool-calling and structured-plan behavior before switching. No OpenAI credential is needed for this planning discussion.

Free-tier Gemini terms differ from paid service terms, including the stated use of submitted content to improve products. Use the public hackathon data and explicitly identified demo context for development; assess the applicable service terms before introducing confidential customer material.

## Confirmed profile reuse

Check structural compatibility in ordinary code, including required column mappings and supported inputs. Ask the analyst to confirm that business meaning and units are unchanged before reusing the approved profile. Same column names alone do not establish unchanged business meaning.

Reuse a compatible, confirmed plan without another planning loop by default. Changed meanings, requirements, mappings, or prerequisites require clarification and an updated plan/profile version. Always rerun the selected data checks on the new draft: reusing configuration does not reuse an earlier quality verdict.

## Output

A named, saved, versioned review profile and executable plan, including confirmed field meanings, units, business requirements, selected checks, parameters, available context references, unresolved limitations, and submission rules. Link the plan to the inspected draft version and apply the confirmed compatibility-and-confirmation behavior for future reuse.

## Implementation follow-through

Define the initial supported check catalog alongside Phase 3 so proposed capabilities match implemented tools. This does not reopen the confirmed planning behavior.

Set tool budgets, sampling bounds, exact pause/resume persistence, schemas, and profile-version rules during implementation planning while preserving the agreed ReAct, evidence, validation, approval, and reuse behavior.

Pin the exact eligible free Gemini model and dependency versions during implementation. Future OpenAI model selection is a separate decision once the user supplies access.

## Related documents

- [Phase overview](../phases.md)
- [Phase 1](phase-1.md)
- [First iteration journey](../problem/first-iteration-solution.md)
- [Ataccama planning and tool use](https://docs.ataccama.com/ataccama-one-agentic/latest/gen-ai/ai-agent.html)
- [Gemini Developer API free and paid tiers](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Google ADK model integrations](https://adk.dev/agents/models/)
