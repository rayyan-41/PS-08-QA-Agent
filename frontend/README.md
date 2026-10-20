# Pokayoke frontend scaffold

Deployment-first foundations from `../MASTER_UI.md`. These are setup pages, not the finished product. They display actual connectivity to the configured backend's `GET /health`; they do not fabricate jobs, sign-in, findings, uploads, or release results.

## Local setup

Use Node 22 LTS and pnpm 11.25.0. Install from this directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The marketing app runs on port 5173, platform on 5174, and client portal on 5175. Each app has an `.env.example` with public variable names only. Copy it to `.env.local` and set `VITE_API_BASE_URL` to the real backend origin or proxy base path. Restart the development server after changing environment values. Missing configuration shows setup instructions and makes no API request.

All browser configuration is public. Never put model keys or service-account credentials in `VITE_*` variables. Firebase web configuration is public, but authentication itself is not connected in this scaffold.

## Workspace

| Path                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `apps/marketing`      | Pokayoke-branded setup page; Vercel target                     |
| `apps/platform`       | Platform setup page; Cloud Run/nginx target                    |
| `apps/client-portal`  | Fictional Halden Research integration setup; Vercel target     |
| `packages/brand`      | Copied approved tokens, Tailwind theme, and SVG marks          |
| `packages/ui`         | Shared accessible button, logo, and health status presentation |
| `packages/api-client` | Health transport, query keys, and TanStack Query hook          |
| `packages/widget`     | Framework-free Shadow DOM IIFE scaffold                        |
| `config`              | Public configuration validation and production mock guard      |
| `e2e`                 | Setup-page smoke and accessibility checks                      |

The widget supports initialization and cleanup. `submit` and `watch` explicitly reject as unimplemented until the backend contract is agreed. It has no fake job state. The production build copies its bundle to the platform's `/widget/v1/pokayoke-widget.js`.

## Verification commands

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm test:e2e
```

Install the Playwright Chromium browser with `pnpm exec playwright install chromium` if absent. An installed Chrome can be used by setting `PLAYWRIGHT_CHANNEL=chrome` for the test command. The smoke tests check the scaffold, not the complete demo journey. The full cross-app product test belongs to later feature milestones.

For isolated browser tests of loading, HTTP errors, retry, and success, set `E2E_BACKEND_TEST_URL=https://backend.example` and rerun `pnpm test:e2e`. These tests intercept responses inside the browser only; their fixture results are not evidence of a live backend deployment.

## OpenAPI handoff

No product request/response schema has been invented from the proposal in MASTER_UI.md. After the backend publishes its authoritative schema, set `POKAYOKE_OPENAPI_URL` to that document and run `pnpm api:generate`. This generates `packages/api-client/src/generated/schema.d.ts`; connect `openapi-fetch` to those types when actual feature routes are integrated.

## Platform container

From the repository root, the build context is `frontend/`:

```sh
docker build -f frontend/apps/platform/Dockerfile -t pokayoke-platform frontend
docker run --rm -p 8080:8080 -e VITE_API_BASE_URL=https://your-backend.example pokayoke-platform
```

`frontend/Dockerfile` contains the same build for `gcloud run deploy --source frontend`; keep both Dockerfiles identical. nginx listens on 8080 and falls back to `index.html` for SPA routes. Missing assets/widget files return 404. `/config.json` is generated at startup with JSON escaping and no-store caching. Only explicitly listed public environment values are included. Runtime mock mode is rejected as well as build-time mock mode.

Once the backend owner confirms project, region, credentials, and backend deployment:

```sh
gcloud run deploy pokayoke-platform --source frontend --region <agreed-region> --allow-unauthenticated
```

Set `VITE_API_BASE_URL` and the public platform/Firebase configuration on that service. Do not bake environment-specific configuration into the image.

## Vercel

Create separate projects with Root Directory `frontend/apps/marketing` and `frontend/apps/client-portal`. Enable access to files outside the Root Directory so the shared workspace packages can build. Each app's `vercel.json` supplies workspace install/build commands, `dist` output, and SPA fallback. Set public `VITE_*` values per project. Vercel supports these Vite apps; Next.js is not required.

## Remaining deployment handoff

- Confirm GCP project, region, organizer credits, and frontend deployment access with Ibtasaam.
- Deploy the real backend with `GET /health`, then configure API CORS for the three exact frontend origins.
- Create the two Vercel projects and deploy the platform/widget to Cloud Run.
- Configure Firebase authorized domains and provision the demo account before authentication work.
- Obtain the Halden workspace publishable key and agreed OpenAPI contract.
- Verify every deployed page reaches the real backend before starting feature milestones.

Backend phase documents govern whole-batch release and separate upload/inspection requests where the frontend proposal differs. Cloud deployment and the full demo are not completed by this local scaffold.
