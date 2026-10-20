# Halden Research sample client portal

The fictional client portal imports CSV company financials into a real backend draft. It never displays canned review results or inserts unreviewed rows into an accepted database.

From `frontend/`:

```sh
pnpm dev:portal
pnpm dev:platform
pnpm exec playwright test -c playwright.demo.config.ts
```

Open `http://127.0.0.1:5175`. Choose **Import figures**, upload a CSV or choose **Use sample file**, then **Send for review**. The sample is an unchanged copy of `data/ps08_data_entries.csv`.

The portal uploads with `POST /api/drafts`, retains the returned draft ID, then inspects that draft with `POST /api/drafts/{id}/inspect`. Failed inspection can be retried without uploading again. A successful inspection shows the backend's column summaries, row count, preview, and warnings. **Open in Pokayoke** leads to `/jobs/{id}/profile` so the reviewer can approve the profile and launch checks. Uploading does not approve a profile or run a review automatically.

In development, Vite proxies `/api` to `http://localhost:8080`; override the server destination with `POKAYOKE_BACKEND_URL`. The browser uses one public `VITE_API_BASE_URL` configuration point, with same-origin requests by default during development. `VITE_PLATFORM_URL` defaults to `http://127.0.0.1:5174` in development. For production, configure `VITE_API_BASE_URL` and `VITE_PLATFORM_URL`. Use `/` for an explicitly configured same-origin backend. For separate origins, the backend must allow the portal origin through CORS. Never put secrets in public variables.

Recent-import metadata is stored in this browser. Status, inspection, review, and acceptance remain backend-authoritative. Acceptance is displayed only after retrieving a matching receipt from the API; the current draft contract does not promise a receipt ID, so the portal cannot discover every acceptance automatically. The separate widget SDK remains a scaffold; this portal uses the typed API client directly.

Browser response fixtures live only in `e2e/portal.spec.ts`; they validate upload, inspection retry, handoff, error recovery, and accessibility. They do not demonstrate a deployed or locally running backend.
