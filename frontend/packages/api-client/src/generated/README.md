# Backend-generated contract

`pnpm api:generate` (from `frontend/`) reads the backend's FastAPI schema and writes `schema.d.ts` here. The default source is `http://localhost:8080/openapi.json`; set `POKAYOKE_OPENAPI_URL` to use another backend.

Until that succeeds, the app uses the hand-written types in `../hand-written/schema.ts`, written from `docs/api.md`. `../schema.ts` is the single switch point: after generating, point it at `./generated/schema`, fix the type errors that surface, and delete the hand-written file.
