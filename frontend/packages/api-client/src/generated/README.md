# Backend-generated contract

No generated endpoint types are checked in yet. The backend lead must publish the real FastAPI `/openapi.json` before generation can run. `MASTER_UI.md` section 10 is an unconfirmed proposal, not a schema.

From `frontend/`, set `POKAYOKE_OPENAPI_URL` to that real schema URL and run `pnpm api:generate`. This writes `schema.d.ts` here. Then use `openapi-fetch` with the generated paths. Do not handwrite or generate speculative job, finding, release, or authentication response types.

The deployment scaffold checks `GET /health` using HTTP success and status only. It makes no assumptions about that endpoint's response body.
