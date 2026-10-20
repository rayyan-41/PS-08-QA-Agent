# AGENTS.md

Instructions for AI coding agents (Antigravity, Claude Code, Codex, Cursor, and others) working in this repository. Read this file before making changes.

## Project

**PS-08: Predictive Data Quality and Error Prevention Agent**, built at the atomcamp National AI Hackathon Finale, Tuesday 20 October 2026, NIC Islamabad.

The product is a QA agent that reviews a data entry **before** an analyst submits it and returns a severity-ranked list of likely problems, each with a suggested correction and a linked procedure. Think of it as a spell-check for data. It must catch errors that static rules miss by combining historical error patterns, cross-field logic, cross-record checks, and anomaly detection, with LLM reasoning over the context.

Full brief: [docs/problem/ps-08-problem-statement.md](docs/problem/ps-08-problem-statement.md)

### Vision and positioning

Full notes: [docs/strategy/vision-and-competitors.md](docs/strategy/vision-and-competitors.md)

Current build boundary: [initial problem scope](docs/problem/initial-problem-scope.md) and [first iteration journey](docs/problem/first-iteration-solution.md). These describe the single upload-to-submission path and saved profiles; the vision includes later capabilities. Technology remains undecided. `docs/team/PlanWRTJudges(notFinal).md` is an unapproved proposal.

- Data observability tools (Monte Carlo, Anomalo, Acceldata, Soda) work on tables and pipelines after data is stored. This product works **in the write path, before the database**. Monitoring stored tables is out of scope.
- **Vision: an automated QA layer (SaaS) in front of the client database.** After setup, agents pass, hold, or auto-fix each entry before it is written, and send only uncertain cases to an analyst. Autonomy grows as precision is proven. The event build is the proof of concept of this loop.
- Every gate decision (pass, hold, auto-fix, ask) is explained and logged. Auto-fix runs only for action types the configuration allows.
- Every suggestion must say why it was flagged, how severe it is, and what to do. Keep false alarms low; it is a scored metric.
- Target user: an analyst entering company financials at a data provider. Use their domain language in UI text and issue messages.
- Every flag shows its evidence (range, previous value, related field, similar past rejection, duplicate record). Use the current scope documents to bound the first journey; section 7 of the vision doc records broader feature priorities.
- Only make competitor or market claims that appear, with a source, in the vision doc.

### Required capabilities (from the brief)

1. Pre-submission validation using LLM reasoning over data context
2. Historical error pattern analysis to predict likely mistakes
3. Cross-field and cross-record consistency checking
4. Severity-ranked issue list with suggested corrections and linked procedures
5. Feedback loop: analyst accept/reject decisions on suggestions improve future predictions

### How it is judged

- Problem-specific metrics: **error catch rate** (% of errors detected before submission), **false alarm rate**, and **analyst trust/adoption**.
- Event criteria: Innovation, Functionality (works end to end live), Scalability (prototype to MVP to market), Real-world impact, Technical execution (agent design, code quality, GCP deployment).

## Hard rules

Breaking these can disqualify the team. Never work around them.

- **Agentic, not a chatbot.** The system must plan, call tools, and take actions. A single prompt-response call does not qualify.
- **Nothing faked.** No hardcoded outputs, canned agent responses presented as live, or UI for features that do not exist. Contract-shaped mock responses are allowed during development only, must be clearly marked (for example a `MOCK` flag or a `mocks/` folder), and must be removed from the demo path.
- **No secrets in the repo.** OpenAI keys, GCP service account files, and any credentials go in environment variables. Commit a `.env.example` with variable names only. Secrets stay on the backend; anything in frontend env vars or bundled JS is public.
- **Deploy on GCP.** Cloud Run is the expected backend target. The frontend may be hosted on Vercel.
- **All project code is written on the event day.** Do not paste in a template project or code from a previous project. Open-source libraries and frameworks (LangGraph, CrewAI, Google ADK, shadcn/ui, and so on) are fine.
- **Explainable code.** Every team member must be able to explain the code. Prefer small, readable modules over clever abstractions. Add short comments where intent is not obvious.
- **Commit small and often** with clear messages. Judges may read the commit history. Never force-push over a teammate's work.

## Repository layout

```
.
├── AGENTS.md                 This file
├── CLAUDE.md                 Claude Code entry point, imports this file
├── README.md                 Short public README (required for submission)
├── data/
│   ├── README.md             Data dictionary and data quirks (read before using the CSV)
│   └── ps08_data_entries.csv Sample dataset, 300 entries
└── docs/
    ├── README.md             Index of docs
    ├── problem/              PS-08 brief
    ├── strategy/             Vision and competitor landscape
    ├── event/                Participant guide and agenda (PDF)
    └── team/                 Team plan and frontend handoff
```

When code is added, use this layout unless the team agrees otherwise, and update this section:

- `backend/` : agent workflow and API (deployed to Cloud Run)
- `frontend/` : main website
- `fallback/` : backup website, built against the same backend
- `docs/api.md` : the endpoint contract (see below)

## Data

Read [data/README.md](data/README.md) before touching the CSV. Key points:

- Load with `pd.read_csv(path, keep_default_na=False)`. The label `None` is a string and pandas otherwise turns it into `NaN`.
- `error_type` is the label: `None` or one of `Range Violation`, `Logical Inconsistency`, `Missing Document`, `Duplicate Entry`, `Date Conflict`, `Format Error`, `Stale Data`. These map directly to the error categories in the brief, so use the same names in issue output.
- `was_rejected` and `rejection_reason` are derived from `error_type`. Never use them as features when predicting errors.
- The labels are largely inconsistent with the columns (for example many `None` rows are out of range, and most `Missing Document` rows have a supporting doc). Do not tune checks to match the labels row by row, and do not claim a catch rate you have not measured. When reporting metrics, state the method and the data split.

## Backend and frontend contract

- The backend owner keeps `docs/api.md` current. Each endpoint lists: method and path, purpose, status (`planned`, `working`, `changed`), required inputs with an example request, an example success response with every field the UI shows, error responses, and loading/progress behavior.
- If you change a request or response shape, update `docs/api.md` in the same commit.
- The frontend reads the backend base URL from **one** configuration point (for example a single env var such as `VITE_API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL`). Never hardcode ports or full URLs in components.
- The main website and the fallback website must call the same backend and show the same real workflow.

## Working style for agents

- Build in this order: (1) one complete end-to-end journey on real input, (2) connect UI to backend and deploy, (3) polish speed, clarity, accessibility, (4) tests and scalability evidence.
- Keep the deployed end-to-end path working. Do not land a change that breaks the live demo path without saying so.
- After 3:00 PM on the event day the focus is stability. Avoid risky refactors, dependency upgrades, or new features unless asked.
- Record real test results (what was tested, under what conditions, observed result). Do not write a test page or README claim that the running system cannot back up.
- When a decision is the team's to make (stack, scope, API shape), ask rather than guess.

## Key times (20 October 2026)

| Time | Event |
|---|---|
| 11:00 AM | Build starts |
| 3:00 PM | Switch to finalization and risk reduction |
| 3:45 PM | Submission deadline: GCP link, GitHub repo with README, slides, agent architecture diagram, team names |
| 4:00 PM | Presentations: 7 min talk and live demo, 3 min Q&A |

## Commands

No application code exists yet. Add the install, run, test, and deploy commands here as soon as they exist, for example:

```bash
# backend
# cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
# frontend
# cd frontend && npm install && npm run dev
# deploy
# gcloud run deploy ...
```
