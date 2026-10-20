# PS-08 QA Agent

An automated data QA layer that sits in front of a database and stops bad data before it is written, built as a proof of concept at the atomcamp National AI Hackathon Finale (20 October 2026, NIC Islamabad). Agents check each entry against history, related fields, and other records, then pass it, hold it with severity-ranked findings and suggested corrections, or send uncertain cases to an analyst, whose decisions teach the system. A spell-check for data.

Problem statement: [docs/problem/ps-08-problem-statement.md](docs/problem/ps-08-problem-statement.md)

## Repository layout

```
.
├── AGENTS.md            Instructions for AI coding agents
├── CLAUDE.md            Claude Code entry point (imports AGENTS.md)
├── data/                Sample dataset and data notes
└── docs/
    ├── problem/         PS-08 brief
    ├── strategy/        Vision and competitor landscape
    ├── event/           Participant guide and agenda (PDF)
    └── team/            Team plan and frontend handoff
```

## Status

Frontend deployment scaffolding is in [`frontend/`](frontend/README.md): three Vite/React apps, shared packages, and the standalone widget build. Setup pages check the configured backend's real health endpoint. The agent workflow, authentication, data intake, and release flow are not implemented yet; no deployment link is claimed.

## Team

Rayyan, Abdullah, and the backend lead. See [docs/team/team-plan.md](docs/team/team-plan.md).
