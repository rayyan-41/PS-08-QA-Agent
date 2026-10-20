# Console integration verification

20 October 2026. These are observed results, not mocks.

## Local console on FastAPI

- Built the widget and platform with the frozen pnpm lockfile. Platform TypeScript check passed; ESLint had one existing TanStack Table compiler warning and no errors.
- With `PS08_CONSOLE_DIR` pointing to the Vite build, FastAPI served `/`, `/jobs/anything`, `/login`, `/assets/*`, `/config.json`, `/widget/v1/pokayoke-widget.js`, `/test-assets/*` and `/fallback`. `/api/health`, `/docs`, `/redoc`, `/openapi.json`, `/procedures/range_violation` retained backend responses; unknown `/api/*` returned JSON 404.
- Browser journey on a synthetic two-row CSV: upload and inspection → one-page configuration → review with a confirmed range hold → correction from 110 to 90 and recheck → accepted receipt and download link. Local planner and investigation agent correctly reported unavailable because no local Gemini key was configured.
- Inspector → Tests → Run all tests: 6 PASS. Held release returned 409 with 72 holds on the provided sample; stale version 409; repeated submit returned the same receipt; over-10-MB upload 413; unknown ID 404; confirmed violation waiver 409.
- Existing backend pytest journey suite: 2 passed, 1 experimental ADK warning.

## Cloud Run

- Revision `ps08-quality-agent-00008-j6v` serves the integrated console at `https://ps08-quality-agent-447065735152.asia-south1.run.app/`.
- Public route checks passed: `/`, `/jobs/anything`, `/fallback`, `/config.json`, `/widget/v1/pokayoke-widget.js`, `/test-assets/ps08_data_entries.csv`, `/api/health`, and `/docs` returned 200. Unknown `/api/*` returned JSON 404. The console badge read `same origin · ok · gcp`.
- Inspector → Tests → Run all tests: 6 PASS. The sample held release with 72 holds and HTTP 409; stale version returned 409; repeated submit returned the same receipt; oversize upload returned 413; unknown ID returned 404; confirmed violation waiver returned 409.
- Live browser journey on a synthetic two-row CSV: upload and inspection → Gemini-assisted plan → approved profile → Gemini-assisted review with one confirmed range hold → correction from 110 to 90 and recheck → released version 2 with 2 rows accepted. Receipt `a76f60e4c5244cf98e402a3aa1db6a02-2` and its download link appeared in the console.
