# Integration prompt: serve the Pokayoke console from the backend

For Ibtasaam (or a coding agent on his machine). Paste everything below the line into your agent after pulling `feat/platform`.

---

You are integrating the Pokayoke platform console (`frontend/apps/platform`, React + Vite, pnpm workspace in `frontend/`) with the FastAPI backend in `backend/`. Branch: `feat/platform` (already contains `master`'s backend). Read first: `AGENTS.md`, `docs/api.md`, `frontend/apps/platform/BACKEND_INTEGRATION.md`, `frontend/apps/platform/BACKEND_REQUESTS.md`. Hard rules: nothing faked, no secrets in the frontend, small commits.

## Goal

The deployed Cloud Run service (`ps08-quality-agent`, project `ps08-quality-agent-20261020-ib`, region `asia-south1`) serves:

- `/` and all console routes (`/jobs/...`, `/profiles`, `/login`): the console's `index.html` (SPA)
- `/assets/*`, `/config.json`, `/widget/v1/pokayoke-widget.js`, `/test-assets/*`: console build files
- `/fallback`: the existing review desk (`fallback/index.html`), unchanged in behaviour
- `/api/*`, `/procedures/*`, `/tools/*`, `/docs`, `/redoc`, `/openapi.json`: unchanged backend routes

The console calls `/api/...` on the same origin (`config.json` `"apiBaseUrl": ""`), so no CORS is needed for it.

## Steps

1. **Backend serving** (`backend/app.py`): replace the `@app.get("/")` placeholder with the snippet in `BACKEND_INTEGRATION.md` section 2. Move the fallback to `@app.get("/fallback")`. In `fallback/index.html`, `BASE` uses `location.origin`, so it keeps working at `/fallback`. The procedure page's "← Review desk" link points to `/`, which is now the console; change it to `/fallback` if you prefer. Register the console catch-all **after** `app.mount("/tools", mcp_app)`, and make it return 404 for the reserved prefixes `api, tools, procedures, docs, redoc, openapi.json, fallback, static`. Serve the console only if its directory exists, so local backend runs without a frontend build still work.
2. **Dockerfile** (repo root): make it two stages, following `BACKEND_INTEGRATION.md` section 4.
   - Stage 1 is `node:22-slim` with `npm i -g pnpm@11.25.0`. It copies `frontend/` and runs `pnpm install --frozen-lockfile && pnpm --filter @pokayoke/widget build && pnpm --filter @pokayoke/platform build && node scripts/copy-widget.mjs`.
   - Stage 2 is the current Python image, which also copies `frontend/apps/platform/dist` to the directory `CONSOLE_DIR` points at.
   - Add `frontend/node_modules`, `frontend/**/node_modules`, `frontend/**/dist`, `.pnpm-store`, `.claude` to `.dockerignore`.
3. **Lockfile check:** `pnpm install --frozen-lockfile` must pass on the committed `frontend/pnpm-lock.yaml`. If it fails because of marketing or client-portal dependency changes, run `pnpm install` once in `frontend/` and commit the lockfile with the matching `package.json` files.
4. **Local test:** run the backend on 8080. From `frontend/`, run `pnpm install && pnpm dev:platform` and open `http://127.0.0.1:5174`. Vite proxies `/api` to `POKAYOKE_BACKEND_URL` (default `http://localhost:8080`). You can also test the deployed backend this way: `POKAYOKE_BACKEND_URL=https://ps08-quality-agent-447065735152.asia-south1.run.app pnpm dev:platform`.
5. **Deploy:** `gcloud run deploy ps08-quality-agent --source . --project=ps08-quality-agent-20261020-ib --region=asia-south1`.
6. **Verify on the deployed URL:**
   - `/` loads the console;
   - the top-bar badge reads `same origin · ok · gcp`;
   - `/fallback` works;
   - `curl <url>/api/health` returns JSON;
   - `/docs` works;
   - `/jobs/anything` returns the console, not a 404.
7. **Run the backend tests in the console:** open **Inspector → Tests → Run all tests**. Expected:

   | Test | Expected result |
   |---|---|
   | 1 | 409 at submit while holds remain |
   | 2 | 409 for a stale version |
   | 3 | Same receipt id twice |
   | 4 | 413 |
   | 5 | 404 |
   | 6 | 409 "A confirmed required violation must be corrected and rechecked" |

   Then click through one full job by hand: New job → Intake → Profile (Launch ninjas) → Run → Review (correct a value, verify a suspicion with evidence, acknowledge an advisory) → Release → receipt → download.

## Known console behaviour to keep in mind (checked against `backend/app.py`)

- Types: `frontend/packages/api-client/src/hand-written/schema.ts` matches the backend's real response shapes. The live `/openapi.json` types request bodies only (routes return dicts), so `src/generated/schema.d.ts` is for reference. Returning Pydantic response models would let `pnpm api:generate` type responses too.
- **409 handling:**
  - A 409 whose detail mentions refresh, changed, stale or version is shown as "This job changed since you loaded it" with Reload.
  - Other 409s, such as the waiver refusal, "Acknowledgement does not clear a hold" and the release gate, are shown word for word.
  - If you change those messages, keep "Refresh" in the stale ones.
- **Planner:** the recommended profile is always computed by code. The console shows `planner_status`, `planner_note`, `planner_activity` and `planner_error` as returned, and says plainly when the agent did not run.
- **Not yet in the console:** these profile fields are accepted by the backend but have no controls in the UI yet: `require_supporting_doc`, `hold_suspicions`, `max_age_days`, `relationships`. The backend applies its defaults.
- **Run outcomes:** statuses `ineligible` and `not_selected` are not failures. The Run step currently colours every non-`completed` status red. Fix it in `workspace/RunStep.tsx`: `completed` green, `ineligible` amber, `not_selected` neutral.
- `review.agent` (status, note, reason, activity) should be shown on the Run step. Its activity is already appended to `review.activity`, and `agent.note` is not displayed yet.

## Requested UI restructure (not done yet)

Rayyan asked for the console to follow the fallback desk's structure, with the console's design:

- One page per job, top to bottom: **Upload, Inspect, Configure, Review, Release**. Use progress pills, not tab links.
- Inspect: a summary line, warnings, and the preview inside `<details>`.
- Configure:
  - the planner note (Markdown stripped; `readableNote` in `src/lib/format.ts`);
  - saved profile, questions, profile name and an optional historical CSV uploaded at approval;
  - recommended checks ticked, plus "Additional model checks" in `<details>`;
  - one action that saves the profile and runs the review.
- Review:
  - each finding shows code, row and field, evidence, action, strength, severity, hold or advisory, a procedure link and the `prior_valid_verifications` note;
  - each finding gets its own "Correct this cell" (value and reason, applied immediately) when `row > 0`;
  - and "Verify or acknowledge" when `evidence_strength === 'suspicion' && !resolved_by`. A held finding sends `verified_valid` with evidence; an advisory sends `acknowledge`.
- Release: the submit button, then the receipt and the download link.

The current components in `src/workspace/` (`JobWorkspace`, `IntakeStep`, `ProfileStep`, `RunStep`, `ReviewStep`, `ReleaseStep`) already contain every call and state you need. Restructuring means rearranging them, not adding new backend calls. Keep: the job ID and version on screen, sending `draft_version` on every write, the honest wait while the review runs (elapsed time only), and the release retry after a timeout.

## Commit and report

Make small commits: (1) backend serving and moving the fallback, (2) Dockerfile and `.dockerignore`, (3) any console fixes. Update `docs/api.md` to show the console at `/` and the fallback at `/fallback`. Record the deployed URL and the test results (expected vs actual) in `frontend/VERIFICATION.md`.
