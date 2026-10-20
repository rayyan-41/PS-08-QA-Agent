# PS-08 QA Agent

An automated data QA layer that sits in front of a database and stops bad data before it is written, built as a proof of concept at the atomcamp National AI Hackathon Finale (20 October 2026, NIC Islamabad). Agents check each entry against history, related fields, and other records, then pass it, hold it with severity-ranked findings and suggested corrections, or send uncertain cases to an analyst, whose decisions teach the system. A spell-check for data.

Problem statement: [docs/problem/ps-08-problem-statement.md](docs/problem/ps-08-problem-statement.md)

## Repository layout

```
.
├── AGENTS.md            Instructions for AI coding agents
├── CLAUDE.md            Claude Code entry point (imports AGENTS.md)
├── data/                Sample dataset and data notes
├── backend/             FastAPI, ADK agent, MCP tools, analytics, storage
├── fallback/            Test UI using the same backend as the main UI
├── tests/               Release-gate integration tests
├── Dockerfile           Cloud Run image
└── docs/
    ├── api.md           Route contract and deployed links
    ├── problem/         PS-08 brief
    ├── strategy/        Vision and competitor landscape
    ├── event/           Participant guide and agenda (PDF)
    └── team/            Team plan and frontend handoff
```

## Status

The six-phase API and test UI are implemented locally. See [docs/api.md](docs/api.md) for the route contract and deployment status. A Gemini key is needed for the ADK planner and investigator; without it the response explicitly reports agent unavailability. Historical model methods report ineligible when their reference data is insufficient. Supplied sample labels remain provisional.

## Run locally

```bash
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -r backend/requirements.txt
.venv/bin/uvicorn backend.app:app --host 127.0.0.1 --port 8080
```

Open `http://127.0.0.1:8080/`. For real agent calls, set `GEMINI_API_KEY` in the backend process environment. Local file storage defaults to `/tmp/ps08-store`; deployed storage uses `GOOGLE_CLOUD_PROJECT` and `PS08_BUCKET`. Run integration tests with `.venv/bin/python -m pytest -q tests` after installing pytest and httpx.

## Deploy

The container serves both the API and fallback UI. The backend team owns GCP deployment and keeps the origin in [docs/api.md](docs/api.md). The primary UI uses that one origin through `VITE_API_BASE_URL`.

## Team

Rayyan, Abdullah, and the backend lead. See [docs/team/team-plan.md](docs/team/team-plan.md).
