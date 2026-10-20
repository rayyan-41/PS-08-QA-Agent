# Backend API and UI addresses

**Status:** The Cloud Run API is live in project `ps08-quality-agent-20261020-ib`, region `asia-south1`. The Pokayoke console is being integrated at `/`; the existing review desk remains at `/fallback`. Both call the same `/api/*` routes. The console uses same-origin `apiBaseUrl: ""` from `/config.json`; no client secret belongs in the frontend.

| Environment | Backend origin | Console | Fallback UI |
|---|---|---|---|
| Local without console build | `http://localhost:8080` | Build required | `http://localhost:8080/fallback` |
| GCP after console deployment | `https://ps08-quality-agent-447065735152.asia-south1.run.app` | `/` and `/jobs/*` | `/fallback` |

`/assets/*`, `/widget/*`, `/test-assets/*` and `/config.json` serve the console build. `/docs`, `/redoc`, `/openapi.json`, `/procedures/*`, `/tools/*` and `/api/*` retain backend behavior.

JSON errors use FastAPI's `{ "detail": "explanation" }`; HTTP 409 means stale state or a blocked release, 422 means invalid input, 413 means size limit, and 404 means unknown ID. Review may take several seconds and the UI should show a loading state. Calls are synchronous in this first version.

| Method/path | Purpose and request | Example success response |
|---|---|---|
| `GET /api/health` | Read health and storage mode | `{"status":"ok","storage":"local"}` |
| `POST /api/drafts` | Multipart `file` CSV, max 10 MB | `{"draft_id":"abc","version":1,"status":"uploaded"}` |
| `POST /api/drafts/{id}/inspect` | Parse and inspect all rows, no body | `{"draft_id":"abc","version":1,"inspection":{"row_count":2,"column_count":3,"columns":[{"name":"entry_id","candidate_type":"text","blank_count":0,"distinct_count":2}],"preview":[{"entry_id":"E1"}],"warnings":[]}}` |
| `GET /api/drafts/{id}` | Current draft metadata | `{"id":"abc","version":1,"status":"inspected","inspection":{...}}` |
| `GET /api/drafts/{id}/plan` | Recommended profile and questions | `{"draft_id":"abc","version":1,"recommended_profile":{"name":"Review file.csv","required_fields":["entry_id"],"unique_fields":["entry_id"],"checks":["iqr"]},"questions":[{"field":"meaning","label":"What does one row represent?","suggested":"One record"}],"available_checks":["iqr"],"planner_status":"deterministic recommendation; agent configuration pending"}` |
| `GET /api/profiles` | Saved profiles | `[{"id":"p1","name":"Financial entries","version":1,"checks":["iqr"]}]` |
| `POST /api/references` | Optional historical multipart `file` CSV, max 10 MB; uploaded labels remain unverified | `{"id":"h1","key":"references/h1/original.csv","filename":"history.csv","row_count":60,"columns":["entry_id"],"digest":"sha256","labels_verified":false,"role":"analyst-supplied history"}` |
| `POST /api/drafts/{id}/profile` | Approve a profile; JSON `{"draft_version":1,"name":"Financial entries","required_fields":["entry_id"],"unique_fields":["entry_id"],"checks":["range_violation"],"answers":{"meaning":"One entry"},"reference_id":"h1","required_checks":[]}`. Optional `reuse_profile_id` creates an immutable saved copy after reconfirmation. | `{"profile":{"id":"p1","version":1,...},"draft_id":"abc","version":1}` |
| `POST /api/drafts/{id}/review` | Run selected checks, no body | `{"id":"r1","draft_id":"abc","draft_version":1,"profile_id":"p1","findings":[{"id":"1:1:entered_value:range_violation","row":1,"field":"entered_value","code":"range_violation","severity":"high","evidence_strength":"confirmed","evidence":"...","action":"...","proposed_value":null,"hold":true,"source":"deterministic","procedure":"/procedures/range_violation","draft_version":1}],"outcomes":[{"model":"iqr","status":"completed"}],"total":1,"holds":1,"by_code":{"range_violation":1},"activity":[],"created_at":"..."}` |
| `GET /api/drafts/{id}/review` | Current review | Same shape as review run |
| `POST /api/drafts/{id}/corrections` | JSON `{"draft_version":1,"changes":[{"row":1,"field":"entered_value","value":"42"}],"reason":"Verified source"}`; makes new version and reruns checks | `{"draft_id":"abc","version":2,"review":{...}}` |
| `POST /api/drafts/{id}/decisions` | JSON `{"draft_version":1,"finding_id":"1:1:entered_value:statistical_anomaly","decision":"verified_valid","reason":"Reviewed source","evidence":"Cited report page 2"}`. `acknowledge` is valid for advisories. Confirmed required violations cannot be waived. | `{"draft_id":"abc","version":1,"review":{...}}` |
| `POST /api/drafts/{id}/submit` | Publish exact reviewed batch; no body; repeated request is idempotent | `{"id":"abc-2","draft_id":"abc","version":2,"profile_id":"p1","review_id":"r2","row_count":2,"digest":"sha256","snapshot_key":"accepted/...","accepted_at":"..."}` |
| `GET /api/accepted/{receipt}` | Read committed acceptance record | Same shape as submit |
| `GET /api/accepted/{receipt}/download` | Download accepted CSV | `text/csv` attachment |

The planner returns a validated schema recommendation plus `planner_status`, `planner_note`, `planner_activity`, and `planner_error`. With `GEMINI_API_KEY`, ADK calls MCP `inspect_draft` and `supported_checks`; review calls MCP `execute_review`, `get_review_evidence`, and procedures, recording `agent` status and activity. Without a key, the API says `unavailable` and deterministic evidence still works. MCP Streamable HTTP is mounted at `/tools/mcp`; it is an internal agent tool interface, not a primary UI route. The reviewed sample's supplied labels are provisional and should not be presented as measured ground truth.

## Deployed verification

On 2026-10-20, a synthetic two-row CSV completed upload, inspection, agent-assisted planning, profile approval, agent-assisted review, blocked release, correction, and accepted release on Cloud Run. The planner called MCP `inspect_draft` and `supported_checks`; the reviewer called `execute_review`, `get_review_evidence`, and `procedure_for`. The active model is `gemini-3.5-flash-lite` through Secret Manager. A repeated submit now returns the same receipt; accepted CSV download works, and post-acceptance edits are rejected. The fallback UI happy path was also verified in a browser on a separate synthetic two-row CSV.
