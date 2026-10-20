# Frontend Scaffold Implementation Plan

> **For agentic workers:** Use subagent-driven-development for the independent UI and API package work. Preserve concurrent changes.

**Goal:** Set up the deploy-first frontend scaffolding specified by MASTER_UI.md.

**Architecture:** Three Vite React apps share brand, UI, and API packages in a pnpm workspace. A framework-free widget builds independently. Placeholder pages report actual backend connectivity; product features follow only after deployment prerequisites pass.

**Tech Stack:** Node 22 LTS target, pnpm 11.25.0, strict TypeScript, React, Vite, Tailwind 4, TanStack Query, React Router, Zod, Vitest, Playwright, nginx.

**Spec:** MASTER_UI.md, especially sections 2.5, 3, and milestone 1 in section 13.

## Global Constraints

- Keep original brand assets and existing documents intact.
- No backend implementation, invented API types, fake job output, cloud resource creation, or commits in this task.
- Platform configuration is supplied at runtime; Vercel apps use build-time configuration.
- Production must reject mock mode. No development mock module is imported into production.
- Backend phase documents govern whole-batch release and separate upload/inspection; no speculative feature endpoints are implemented.

## Review Focus

- Missing or malformed configuration must show actionable setup feedback.
- Health failures and malformed response bodies must never imply successful quality review.
- Platform runtime config must survive JSON-special characters and remain public-only.
- Static SPA routes and the widget bundle must remain deployable from the documented build context.
- Production mock guards and workspace commands must be exercised, not only documented.

## Tasks

- [ ] Create workspace manifests, strict TypeScript, Vite/Tailwind, lint/format, Vitest, and Playwright configuration.
- [ ] Copy approved brand tokens and SVG assets; build three honest health-check pages and shared UI primitives.
- [ ] Implement shared GET /health transport and query hook; leave generated API types pending the real OpenAPI schema.
- [ ] Create standalone Shadow DOM widget scaffold without claiming intake/watch integration exists.
- [ ] Add platform Docker/nginx/runtime-config files and both Vercel SPA configurations.
- [ ] Install and pin dependencies; verify typecheck, lint, format, unit tests, production builds, and browser smoke/accessibility checks.
- [ ] Update setup/run/deploy documentation with observed results and remaining cloud handoff requirements.
