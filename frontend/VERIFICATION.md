# Scaffold verification

Recorded on 20 October 2026 for the local deployment scaffold, not the completed product or a cloud deployment.

## Passed

- Frozen offline dependency install; no peer dependency issues.
- Strict type checking across all apps and TypeScript packages.
- ESLint and Prettier checks.
- Vitest: 21 tests in 3 files covering health transport/query behavior and configuration safety.
- Production builds for marketing, platform, client portal, and the widget IIFE.
- Widget copied to the platform build at `widget/v1/pokayoke-widget.js`.
- Production build deliberately rejected with `VITE_USE_MOCKS=true`.
- Both Dockerfiles match; the container entrypoint passes shell syntax and LF/no-BOM checks.
- Chromium 1248 setup-page browser checks: all 3 apps passed keyboard-focus, 360px overflow, and axe WCAG checks with zero reported violations.

## Conditions and limits

Local commands ran with the installed Node 24.19.0 runtime and pnpm 11.25.0. The declared deployment target is Node 22 LTS; Docker execution on Node 22 was not verified because the Docker engine is not running.

No real backend URL was supplied. Browser health-response fixtures are isolated test responses, not a live backend or product demo. Authentication, intake, jobs, findings, gated release, and a deployed end-to-end journey remain later implementation work.

Cloud Run/Vercel deployment, runtime container behavior, backend CORS, Firebase authorization, and real backend health connectivity remain unverified. No backend files were created or modified.
