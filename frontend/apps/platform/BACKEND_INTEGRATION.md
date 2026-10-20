# Serving the platform console from the FastAPI backend

For Ibtasaam. The console is a static build in `frontend/apps/platform/dist`. The backend serves it at `/`, on the same origin as the API, so the console calls `/api/...` and needs no CORS. The existing fallback UI moves to `/fallback`.

## 1. Build output

From `frontend/`:

```sh
pnpm install --frozen-lockfile
pnpm --filter @pokayoke/widget build && pnpm --filter @pokayoke/platform build && node scripts/copy-widget.mjs
```

`apps/platform/dist/` then contains `index.html`, `assets/`, `config.json` and `widget/v1/pokayoke-widget.js`.

`config.json` defaults: `{"apiBaseUrl": "", "auth": "none", "devtools": true, "backendPresets": {...}}`. Edit it in the image (or overwrite at startup) to change runtime settings. Set `"devtools": false` to hide the developer inspector. `dist/test-assets/ps08_data_entries.csv` is the public sample used by the inspector's backend tests.

## 2. FastAPI snippet

Register this **after** all API, MCP (`/tools/mcp`), procedures, docs and fallback routes. The catch-all returns `index.html` only for console paths; reserved prefixes keep returning the backend's own 404.

```python
from pathlib import Path
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

CONSOLE_DIR = Path(__file__).parent / "static" / "console"  # where the Dockerfile copies dist/
RESERVED = ("api", "tools", "procedures", "docs", "redoc", "openapi.json", "fallback", "static")

if CONSOLE_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=CONSOLE_DIR / "assets"), name="console-assets")
    app.mount("/widget", StaticFiles(directory=CONSOLE_DIR / "widget"), name="console-widget")

    @app.get("/config.json", include_in_schema=False)
    def console_config():
        return FileResponse(CONSOLE_DIR / "config.json", headers={"Cache-Control": "no-store"})

    @app.get("/{path:path}", include_in_schema=False)
    def console(path: str):
        if path.split("/", 1)[0] in RESERVED:
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(CONSOLE_DIR / "index.html", headers={"Cache-Control": "no-cache"})
```

The widget is loaded cross-origin by the client portal; if you need that now, add `Access-Control-Allow-Origin: *` for `/widget/` only.

## 3. Move the fallback UI to `/fallback`

Change the route that serves the fallback page from `@app.get("/")` to `@app.get("/fallback")` (and mount its static files under `/fallback/...` or `/static/...`). Update any relative links inside the fallback page that assume `/`. Remove the old `/` handler so the console catch-all owns `/`.

## 4. Dockerfile (build context: repo root)

```dockerfile
# Stage 1: build the console
FROM node:22-slim AS console
WORKDIR /src/frontend
RUN npm install --global pnpm@11.25.0
COPY frontend/ ./
RUN pnpm install --frozen-lockfile \
 && pnpm --filter @pokayoke/widget build \
 && pnpm --filter @pokayoke/platform build \
 && node scripts/copy-widget.mjs

# Stage 2: your existing Python image (adjust to match it)
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=console /src/frontend/apps/platform/dist ./app/static/console
ENV PORT=8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
```

Adjust `backend/` paths, the module path and `CONSOLE_DIR` so they agree. Add `frontend/node_modules`, `frontend/**/dist` and `frontend/.pnpm-store` to `.dockerignore`.

## 5. Deploy

```sh
gcloud run deploy pokayoke-api --source . --project ps08-quality-agent-20261020-ib --region asia-south1 --allow-unauthenticated
```

`--source .` uses the root `Dockerfile`. If it lives elsewhere, build with `gcloud builds submit --tag ...` and deploy with `--image`.

## 6. CORS

Same origin needs none for the console. Later, allow only the two Vercel origins (marketing and client portal) once their URLs exist.

## 7. Five-step check after deploy

1. Open `/`: the Pokayoke console loads.
2. The console's health panel shows `ok` and the storage mode.
3. `/fallback` still shows the fallback UI.
4. `curl <url>/api/health` returns JSON, not `index.html`.
5. `/docs` still shows the FastAPI docs.

## 8. Using the console to test the backend

- Open the **Inspector** (top bar). **Target** switches between this backend (same origin), `local` (`http://localhost:8080`) and a custom URL, and shows `GET /api/health` every 15s with latency. A cross-origin target needs CORS for the console's origin; same origin needs none.
- **Requests** logs every call with method, path, status, duration, request and response bodies, and **Copy as cURL**. Filter by job ID.
- **Raw state** shows the latest draft, plan, review and receipt JSON for the open job.
- **Tests** runs six real checks with expected vs actual: full journey (expects 409 at submit while holds remain), stale version (409), idempotent release (same receipt twice), size limit (413), unknown ID (404), waiver refusal on a confirmed required violation.
- Local without Docker: run the backend on 8080, then from `frontend/` run `pnpm dev:platform` and open `http://127.0.0.1:5174`. Vite proxies `/api` to the backend.
