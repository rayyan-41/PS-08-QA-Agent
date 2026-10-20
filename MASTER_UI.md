# MASTER_UI.md: Pokayoke frontend build spec

This is the single source of truth for building the Pokayoke frontends. Read it fully before writing code. When this file and an older doc disagree on the frontend, this file wins. For backend behaviour, the phase docs win (`docs/phases.md`, `docs/phases/phase-*.md`).

---

## 0. Goal

Build three web apps and one embeddable widget that together demonstrate Pokayoke end to end:

1. **Marketing site** that explains the whole workflow and doubles as the presentation the team uses on stage. It ends with a **Begin demo** button.
2. **Sample client portal** for a fictional company, **Halden Research**, where an analyst ingests a CSV of company financials. Ingesting starts a Pokayoke job and the **Pokayoke widget** pops up inside the portal.
3. **Pokayoke platform** (the SaaS product), behind a login, where a **QA expert** opens the job from the widget, sees exactly which **job profile** was selected and why, verifies it, presses **Launch ninjas**, follows the agents' work live, resolves findings, and releases the reviewed batch. Released records then appear in the client portal's database.

The demo journey, which must work start to finish on the deployed GCP stack:

```
Marketing site  --Begin demo-->  Halden Research portal
  analyst ingests CSV  -->  Pokayoke widget appears ("Checking 300 records")
  widget: "Ready for QA review"  --Open in Pokayoke-->  Platform login
  QA expert sees job + selected profile  --Launch ninjas-->  live agent activity
  findings reviewed and resolved  -->  Release reviewed batch
  --Return to Halden Research-->  portal database shows accepted records, held ones stay out
```

### Definition of done

- [ ] The platform and widget run on Cloud Run (GCP), the marketing site and client portal on Vercel, and all of them talk to the real Cloud Run backend through one configured base URL each. The platform's Cloud Run URL is the "live deployed link on GCP" submitted to the organizers.
- [ ] The full demo journey above runs on real backend responses, with no mock data in the production build.
- [ ] The QA expert must log in; unauthenticated users cannot see job data.
- [ ] The platform shows the selected profile, its match reason, its checks, assumptions and limitations, and only starts the run when **Launch ninjas** is pressed.
- [ ] Agent activity shown in the platform comes from the backend's recorded events. No invented progress.
- [ ] Held records never appear in the portal database before release; released records do.
- [ ] Every screen has loading, empty, error and success states.
- [ ] WCAG 2.2 AA: contrast, keyboard access, visible focus, labels, reduced motion.
- [ ] Marketing site works as a keyboard-driven presentation (Presenter mode, section 6.3).
- [ ] Playwright end-to-end test of the demo journey passes in mock mode and against the deployed backend.

---

## 1. Ground rules (non-negotiable)

These come from the event rules (`docs/event/participant-guide.pdf`) and `AGENTS.md`. Breaking them can disqualify the team.

1. **Nothing faked in the live demo.** No hardcoded findings, canned agent output, or fake progress shown as live. Mock data is allowed only in development (section 9) and must be visibly labelled and excluded from production builds.
2. **No secrets in frontend code.** API keys, service accounts and model keys live in the backend. Firebase web config and the client portal's publishable key are public identifiers, not secrets, and are fine in env vars.
3. **Show only what exists.** If the backend does not report something (for example the number of agents), the UI does not display it. Roadmap features appear only on the marketing site and are labelled as roadmap.
4. **One configuration point per app** for the API base URL and other origins. No hardcoded URLs or ports in components.
5. **Commit small and often.** Judges may read the history.
6. **Everyone must be able to explain the code.** Prefer plain, readable components over clever abstractions.

---

## 2. Tech stack

### 2.1 Decisions

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) everywhere | Typed API contract across four frontends |
| Package management | **pnpm workspaces**, Node **22 LTS** | One install, shared packages, fast CI |
| Build tool | **Vite** (latest stable major) | Fast dev server, simple static builds for Vercel and nginx, library mode for the widget |
| UI framework | **React** (latest stable major, 18.3+ or 19) | Team familiarity, component reuse across apps |
| Styling | **Tailwind CSS v4** reading the brand CSS variables via `@theme` | Tokens stay in one place (`packages/brand/tokens.css`) |
| Components | **shadcn/ui** (copied into `packages/ui`, built on **Radix** primitives) | Accessible dialogs, menus, tabs, tooltips without a heavy library |
| Icons | **lucide-react** | Outline icons matching the brand line style |
| Routing | **React Router v7** (library mode) | Common, well known, nested routes for the job workspace |
| Server state | **TanStack Query v5** | Caching, retries, polling (`refetchInterval`) for live job status |
| Forms | **react-hook-form** + **zod** | Profile questions and decisions with validation |
| Tables | **TanStack Table v8** + **TanStack Virtual** | Preview grid up to 50 rows x 100 columns, findings lists |
| Motion | **Motion** (`motion` package, formerly Framer Motion) | One animation library for all apps, scroll-linked marketing sequences |
| Toasts | **sonner** | Small, accessible |
| Auth | **Firebase Authentication** (email and password) | GCP-native; backend verifies ID tokens with `firebase-admin` |
| API client | **openapi-typescript** + **openapi-fetch** generated from FastAPI's `/openapi.json` | Types follow the backend automatically |
| Dev mocks | **MSW** (Mock Service Worker) with fixtures from the real CSV | Build UI before endpoints exist, never shipped |
| Unit tests | **Vitest** + **Testing Library** | Fast, Vite-native |
| E2E and a11y | **Playwright** + **@axe-core/playwright** | Tests the full cross-app journey |
| Lint and format | **ESLint** (typescript-eslint, jsx-a11y) + **Prettier** | Consistent code |
| Hosting | **Cloud Run** for the platform (static build served by nginx) and the API; **Vercel** for the marketing site and client portal | The product lives on GCP as the rules require; supporting sites deploy fastest on Vercel |

Pin exact versions in `package.json` once installed; the lockfile is the record.

### 2.2 Backend (owned by the backend lead, listed for context)

Python, **FastAPI**, **Pandas**, one **Google ADK** ReAct planning agent with deterministic validation, **Gemini Developer API** (free tier in development), **Cloud Storage** for files, **Firestore** for drafts, profiles, status and decisions, deployed on **Cloud Run**. The frontend consumes its OpenAPI schema. See `docs/phases/phase-1.md` and `phase-2.md`.

### 2.3 Deployment

The event rules require deployment on GCP and a "live deployed link on GCP" in the submission. The product (platform and API) therefore runs on Cloud Run; the supporting sites run on Vercel.

| Service | Where | Serves |
|---|---|---|
| `pokayoke-api` | Cloud Run (GCP) | FastAPI backend (owned by the backend lead) |
| `pokayoke-platform` | Cloud Run (GCP) | Platform SPA from `apps/platform`, served by nginx, plus the widget bundle at `/widget/v1/pokayoke-widget.js`. This URL is the submitted GCP link |
| Marketing | Vercel project, Root Directory `frontend/apps/marketing` | Marketing site and presentation |
| Halden Research | Vercel project, Root Directory `frontend/apps/client-portal` | Fictional client portal |
| Data and identity | GCP: Firestore, Cloud Storage, Firebase Authentication, Secret Manager | Drafts, profiles, files, QA expert login, the Gemini key (backend only) |

Rules:

- **One region for every GCP resource** (proposed `asia-south1`; confirm with the backend lead before creating anything).
- **Separate origins are intentional**: moving from the Vercel-hosted portal to the Cloud Run platform is the real redirect the demo shows.
- **SPA fallback**: nginx serves `index.html` for unknown paths (`try_files $uri /index.html;`). On Vercel, add a rewrite of all paths to `/index.html` in each app's `vercel.json`.
- **Runtime config for the platform container**: do not bake environment-specific values into the image. nginx serves `/config.json` generated at container start from Cloud Run environment variables (a small `envsubst` entrypoint); the platform fetches it before rendering. The same image then works in every environment. Vercel apps use normal `VITE_*` build-time variables set in each Vercel project.
- **CORS**: the API allows exactly the platform's Cloud Run URL, the two Vercel production URLs, and localhost ports in development. Vercel preview URLs are either excluded or matched by an explicit pattern for this project only.
- **Firebase Authentication authorized domains** must include the platform's Cloud Run domain (and localhost).
- **Deploy commands** (manual is fine for the hackathon):
  - Platform: `gcloud run deploy pokayoke-platform --source frontend --region <region> --allow-unauthenticated` using `frontend/apps/platform/Dockerfile` (multi-stage: pnpm build, then nginx).
  - Vercel: Git integration on the main branch; pnpm workspaces are detected from the repo root.

### 2.4 Ownership

| Area | Owner | Notes |
|---|---|---|
| `pokayoke-api` on Cloud Run, agents, Firestore, Cloud Storage, Secret Manager, OpenAPI schema | **Ibtasaam** (backend) | Publishes `/openapi.json`; owns the API's CORS allowlist and Firebase token verification |
| GCP project and region setup | **Ibtasaam**, shared access for Rayyan | Rayyan needs permission to deploy `pokayoke-platform` and to edit Firebase Authentication settings |
| Marketing site and client portal on Vercel | **Rayyan** (frontend) | Owns both Vercel projects and their env vars |
| Platform and widget on Cloud Run (`pokayoke-platform`) | **Rayyan** | Owns the Dockerfile, nginx config and `/config.json` |
| Frontend code in `frontend/` | **Rayyan** | Coding agents working on the frontend do not edit `backend/` |

**Handoff points (agree these, do not assume them):**

1. The API contract in section 10: the backend's `/openapi.json` is the final word; the frontend regenerates types from it.
2. The exact frontend origins for CORS, sent to Ibtasaam once each URL exists.
3. The platform's Cloud Run domain added to Firebase Authentication authorized domains.
4. The publishable key for the Halden Research demo workspace.
5. The region (proposed `asia-south1`).

If the frontend needs an endpoint or field that does not exist yet, add it to section 10 marked "requested", build against a clearly labelled mock, and tell Ibtasaam. Do not implement backend changes from the frontend side.

### 2.5 Deploy first

Before building features, prove the path with placeholder apps:

1. GCP project with Cloud Run, Cloud Build, Artifact Registry, Firestore, Cloud Storage, Secret Manager and Firebase Authentication enabled; organizer credits confirmed.
2. `pokayoke-api` deployed with `GET /health`.
3. `pokayoke-platform` deployed as a placeholder page with SPA fallback and `/config.json`.
4. Both Vercel projects deployed as placeholder pages.
5. CORS and Firebase authorized domains configured.
6. Each of the three frontends calls `GET /health` and shows the result on its placeholder page.

Only start feature work when all six pass.

---

## 3. Repository layout

The frontend lives in `frontend/`, beside `backend/`.

```
frontend/
  package.json            pnpm workspace root, shared scripts
  pnpm-workspace.yaml
  apps/
    marketing/            Vite + React, presentation site (vercel.json)
    platform/             Vite + React, the SaaS product (Dockerfile, nginx.conf, docker-entrypoint.sh for /config.json)
    client-portal/        Vite + React, Halden Research (vercel.json)
  packages/
    brand/                tokens.css, Tailwind theme, logo SVGs, fonts setup
    ui/                   shared React components (Logo, StatusChip, SeverityBadge, FindingCard, RedPenValue, DataTable, ...)
    api-client/           generated OpenAPI types, typed fetch client, query keys, MSW handlers and fixtures
    widget/               framework-free embeddable widget (TypeScript, Shadow DOM, Vite library build)
  e2e/                    Playwright tests for the cross-app journey
```

Copy `docs/brand/tokens.css` and `docs/brand/logo/*.svg` into `packages/brand` at scaffold time. `docs/brand/README.md` stays the human reference.

### Environment variables (per app, `.env.example` committed, `.env.local` ignored)

| Variable | Apps | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | all | Cloud Run URL |
| `VITE_PLATFORM_URL` | marketing, portal, widget | Where "Open in Pokayoke" goes |
| `VITE_PORTAL_URL` | marketing, platform | Begin demo target, return target |
| `VITE_PUBLISHABLE_KEY` | portal | Public demo key identifying the Halden workspace |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | platform | Public Firebase web config |
| `VITE_USE_MOCKS` | all | `true` only in local development |

Each app reads these in one file, `src/config.ts`, validated with zod at startup. The platform reads the same keys from `/config.json` at runtime instead of `import.meta.env` (section 2.3); `src/config.ts` hides that difference from the rest of the app. A production build fails if `VITE_USE_MOCKS=true` (Vite plugin or a `prebuild` check).

---

## 4. Brand foundation

Full guide: `docs/brand/README.md` and `docs/brand/brand-sheet.html`. Summary for implementation:

| Token | Value | Rule |
|---|---|---|
| Navy | `#102248` | Text, headings, primary buttons, platform sidebar |
| Coral | `#FB5A5B` | Attention only: held records, the red-pen underline on a suspect value, counts awaiting action, the logo Y. Never a button fill, never decoration. Under 5% of any screen |
| Cream | `#F6F2E4` | Light page background |
| Slate | `#5A6378` | Secondary text, labels, timestamps |
| Status | pass `#0F7B6C`, held `#C23B3C`, verify `#9A5B00`, auto-fix `#2F5FD0` | Always colour + icon + word |

| Type | Family | Use |
|---|---|---|
| Display | Plus Jakarta Sans 600/700 | Wordmark, headings, marketing headlines |
| UI | Inter 400/500/600 | Everything else |
| Data | JetBrains Mono 400/500 | Record values, IDs, field names, timings |

Spacing on a 4px grid. Radii: 6px controls, 10px cards, 16px modals. Hairline borders, shadows only on floating layers. Dark theme exists via `data-theme="dark"`.

Wire Tailwind to the tokens in `packages/brand/theme.css`:

```css
@import "tailwindcss";
@import "./tokens.css";
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-line: var(--line);
  --color-mark: var(--mark);
  --color-pass: var(--pass);
  --color-hold: var(--hold);
  --color-ask: var(--ask);
  --color-fix: var(--fix);
  --font-display: var(--font-display);
  --font-sans: var(--font-ui);
  --font-mono: var(--font-mono);
}
```

Never write raw hex values in components. Use the tokens.

---

## 5. Design principles

### 5.1 Product principles (all apps)

1. **Visibility of system status.** The user always knows what Pokayoke is doing, what it decided and why. Status reflects real backend state.
2. **Evidence before verdict.** Every finding shows the record, field, entered value, evidence and its source before any action button.
3. **Severity and confidence are different.** Severity is consequence if real. Confidence is evidence strength. Show both, in words, not invented percentages.
4. **One primary action per view**, in navy. Everything else is secondary.
5. **Humans approve; the gate enforces.** Launching the run, accepting a correction and releasing the batch are explicit human actions. The UI never implies the agent bypassed a rule.
6. **Few, accurate flags.** Collapse low-severity advisories by default. Alert fatigue destroys trust.
7. **Domain language.** "Revenue (TTM)", "reporting period", "supporting document", not `check_range` (internal names appear only in the activity trace, in mono).
8. **Recoverable.** Dismiss has a reason; corrections preview a diff; nothing destructive without a confirmation that names what changes.

### 5.2 Visual principles

- **Spend boldness in one place per app.** Marketing: the data spine (6.2). Platform: the red-pen value inside findings. Portal: nothing, it is deliberately plain.
- **Quiet structure.** Borders and spacing carry hierarchy. No gradient washes, glows, glassmorphism or drop shadows on in-flow cards.
- **Not a card kit.** Do not chop content into rows of identical rounded cards. Use lists, tables and panels of different weights according to importance.
- **Avoid template chrome:** no ALL-CAPS tracked labels above headings, no "A · B · C" meta strings, no "→" appended to buttons, no decorative numbering unless the content is a real sequence (the six phases are one; numbering them is correct).
- **Type does the work.** Jakarta headings with tight tracking and generous size steps; Inter body at 15px (app) or 17px (marketing); line length under 75 characters.
- **Alignment:** left-aligned everywhere except single-line hero statements. Numbers right-aligned in tables using tabular figures.

### 5.3 Motion

- One orchestrated moment per page (marketing hero, platform run start). Otherwise motion only responds to user actions.
- 150 to 220ms, `--ease-out`, no bounce or spin.
- Live updates insert new rows with a short slide and highlight, then settle.
- `prefers-reduced-motion`: replace movement with instant state changes.

### 5.4 Accessibility and quality floor

- WCAG 2.2 AA contrast (the tokens already pass; do not invent new pairs).
- Every interactive element reachable and operable by keyboard, with visible focus (`--focus`).
- Live regions: job status changes announced with `aria-live="polite"`; errors with `role="alert"`.
- Forms: visible labels, inline errors next to the field, errors say what happened and how to fix it.
- Responsive down to 360px wide. The platform is optimised for laptop and projector (1280 to 1920px) and remains usable on tablet.
- Avoid disabled buttons; keep them enabled and explain what is missing when pressed, or show the blocker next to them.

### 5.5 Copy

- Sentence case. Active voice. Buttons say exactly what happens: "Release reviewed batch", "Accept correction", "Dismiss with reason".
- The same action keeps the same name through the flow: "Launch ninjas" produces "Ninjas launched".
- Errors: what happened, then what to do. No apologies, no exclamation marks, no "please", "simply", "magic".
- Numbers state their basis: "Catch rate 0.82 on 60 reviewed records", never an unmeasured claim.

### 5.6 States checklist (every data view)

| State | Requirement |
|---|---|
| Loading | Skeleton that matches the final layout; no spinner-only pages |
| Empty | Says what this space is for and the action that fills it |
| Error | Plain cause, the action to retry or fix, request ID when available |
| Partial | Data shown with a clear note about what is still running or missing |
| Stale | "Updated 12s ago" with a refresh affordance when polling stops |

---

## 6. App 1: Marketing site (`apps/marketing`)

### 6.1 Job

Explain Pokayoke so clearly that the site *is* the presentation: problem, solution, the six-phase workflow, the agents, trust and the vision, then hand off to the live demo.

### 6.2 Signature: the data spine

A single navy line, drawn in the stroke style of the logo's P, runs down the page as the scroll spine. Sample records (real rows from `data/ps08_data_entries.csv`, e.g. GlobalTech Inc, revenue_ttm) travel along it through the six phase stations. At the checkpoint one record's suspect value receives the coral red-pen underline and is held off the line, while the others continue to the "accepted" destination at the bottom. This is the one bold element. Everything around it is quiet typography and white space.

Implementation: SVG path with `pathLength`, Motion `useScroll` + `useTransform` for scroll-linked drawing; records are small mono-text tags positioned along the path. Reduced motion: static diagram with all stations visible.

Label it as an illustration ("Illustration with sample records"). The live product is the demo.

### 6.3 Presenter mode

The team presents from this site.

- Toggle with **P** or a small control in the footer. In presenter mode each section fills the viewport, chrome hides, and a quiet section counter shows "4 of 9".
- **Arrow keys / Page Up / Page Down / Space** move between sections; **Home/End** jump to start and end; **Esc** exits.
- URL hash updates per section (`#workflow`) so a section can be opened directly.
- Works with a clicker (they send Page Up/Down).
- Large type: minimum 20px body in presenter mode, readable from the back of a room.

### 6.4 Sections (in order)

| # | Section | Content |
|---|---|---|
| 1 | **Hero** | Headline (draft): "Catch the wrong number before it is saved." One-sentence subhead on the write-path QA layer. The spine starts here: a stream of records enters, one is marked and held. Primary button: "See how it works" (scrolls). |
| 2 | **The problem** | Plausible-but-wrong values. Facts with visible source links: S&P Global runs over 155,000 automated checks and still pays $50 per validated error reported by clients; manual single entry produces about 1% errors, most inside allowed ranges (Barchard and Pace, 2011). Sources from `docs/strategy/vision-and-competitors.md`. |
| 3 | **Why rules miss it** | One record shown twice: a static range rule passes it; Pokayoke's context (previous value, related fields, history) flags it. Use the scoping doc's example: revenue entered as 100 million when the previous value was 10 million, flagged for verification, not assumed wrong. |
| 4 | **Poka-yoke** | Shingo and the Toyota Production System. Warning poka-yoke (alert before the mistake completes) and control poka-yoke (prevent it). Pokayoke does both: findings for the analyst, a gate for the database. |
| 5 | **The workflow** | The six phases, pinned while scrolling, one at a time, each showing what ordinary code, statistics and the agent do (from `docs/phases.md`): Receive and inspect, Understand and configure, Execute checks, Investigate and explain, Review and resolve, Release and record. The spine passes through each station. |
| 6 | **The ninjas** | The agent architecture diagram the judges require: one ReAct planning agent, its tools (inspection, references, check catalog, history), deterministic validation, the human approval point (Launch ninjas), and the gate. Draw it as clean SVG in brand style. Must match what the backend actually implements; update it when the architecture changes. |
| 7 | **Trust** | Evidence on every finding, human approval for launch, corrections and release, full audit trail, no secrets in the browser, held records cannot reach the database. |
| 8 | **Where it goes next** | The vision, labelled "Roadmap": automatic pass for clean records, authorised auto-fixes, autonomy that grows with measured precision, live intake via the widget and API. |
| 9 | **Begin demo** | Short line on what the audience will see, then the primary button **Begin demo**, linking to `VITE_PORTAL_URL`. |

Footer: logo lockup, "Built at the atomcamp National AI Hackathon, 20 October 2026", team names, GitHub link.

### 6.5 Layout

```
desktop, 12 columns, max 1200px, left aligned
+------------------------------------------------------------+
| logo lockup                               Begin demo (btn) |
|                                                            |
| HEADLINE, 2 lines, Jakarta 700, ~72px          |  spine    |
| subhead, 1 line, Inter 19px, slate             |  path     |
| See how it works                               |  records  |
|                                                |  travel   |
+------------------------------------------------+-----------+
| section text (cols 1-6)                        | spine     |
|                                                | station   |
```

The spine sits in the right third on desktop and becomes a thin left rail on mobile.

---

## 7. App 2: Halden Research client portal (`apps/client-portal`)

### 7.1 Job

Look like an ordinary internal tool of a mid-size equity research firm, so that the Pokayoke widget and the redirect clearly come from a different product.

### 7.2 Look

- Not Pokayoke's brand. System font stack, white and light grey surfaces, one muted green accent (`#2F6B4F`), a plain "HR" text logo. No navy, no coral, no cream.
- Fictional company. Do not imitate any real company's name, logo or branding.
- Small persistent note in the footer: "Halden Research is a fictional company used to demonstrate Pokayoke."

### 7.3 Screens

| Route | Screen | Content |
|---|---|---|
| `/` | **Company financials** | The firm's "database": a table of accepted records (entity, field, value, period, analyst, accepted at). Empty state on first visit: "No records yet. Import this quarter's figures to get started." Primary action: **Import figures**. |
| `/import` | **Import figures** | Drop zone for a CSV, or **Use sample file** (the PS-08 dataset, bundled as a static asset). Shows file name, size and row count from a quick client-side read for display only; the backend is authoritative. Primary action: **Submit to database**. A line under it: "Submissions are checked by Pokayoke before they are saved." with the small Pokayoke badge. |
| `/import/:jobId` | **Submission status** | The portal's own view of the pending submission: "Waiting for quality review". When the job is released, shows accepted and held counts and a link back to the table. |

### 7.4 Integration

On **Submit to database** the portal calls `Pokayoke.submit(file, { returnUrl })` from the widget (section 9). The portal never receives findings; it only learns status and, after release, the accepted records. When the user returns from the platform (`?job=…&status=released`), the portal refetches its table.

---

## 8. App 3: Pokayoke platform (`apps/platform`)

### 8.1 Job

The product. A QA expert verifies the selected profile, launches the agents, resolves findings, and releases a reviewed batch. It must be robust: correct under slow networks, refreshes, lost responses, concurrent tabs and backend errors.

### 8.2 Authentication

- Firebase Authentication, email and password. Demo account provisioned in the Firebase console (no public sign-up; the login page says "Access is set up by your workspace admin").
- `/login` with email, password, inline errors, "Show password" toggle.
- After login, redirect to the `next` parameter (the job link from the widget) or `/`.
- All API calls send `Authorization: Bearer <Firebase ID token>`; refresh tokens via the SDK; on 401, sign out and return to `/login?next=…`.
- Role shown in the top bar: "QA expert". Sign out in the user menu.

### 8.3 Shell

```
+----------+-------------------------------------------------------+
| Pokayoke |  Halden Research workspace        QA expert  (menu)   |
| (navy    +-------------------------------------------------------+
| sidebar) |                                                       |
| Jobs     |   page content, max 1440px, 24px padding              |
| Profiles |                                                       |
| Checks   |                                                       |
| Activity |                                                       |
+----------+-------------------------------------------------------+
```

Navy sidebar with the reversed logo; light content area by default; theme switch in the user menu (dark tokens exist).

### 8.4 Routes and screens

| Route | Screen |
|---|---|
| `/login` | Sign in |
| `/` | **Jobs**: queue grouped by state (Needs your launch, Running, Needs review, Ready to release, Released, Failed). Each row: client, file, records, profile, state chip, updated time. Clicking opens the job. |
| `/jobs/:jobId` | **Job workspace** (8.5), the core of the product |
| `/profiles` | Saved profiles: name, version, used by N jobs, last updated |
| `/profiles/:profileId` | Profile detail: field meanings and units, required information, checks with parameters, submission rules, version history |
| `/checks` | Read-only supported-check catalog: purpose, inputs, prerequisites, procedure link |
| `/activity` | Audit log across jobs: who did what, when, on which record |

### 8.5 Job workspace

A stepper across the top shows the real job stage. Steps are links once reached:

**Intake → Profile → Run → Review → Release**

**Intake** (Phase 1 output)
- File name, row and column counts, received time, source ("Halden Research portal").
- Preview grid of the first 50 rows (TanStack Table, sticky header, horizontal scroll, mono values).
- Column summary: candidate type, empty count, distinct count, mixed-format count with examples linked to rows.
- Structural warnings with affected rows.

**Profile** (Phase 2 output). This is where the QA expert verifies before launch.
- **Selected profile card**, the most prominent element: profile name and version, how it was selected ("Matched saved profile *Company financial updates* v3: same 14 columns, units unchanged" or "New profile proposed by the planner"), compatibility result.
- **Field meanings and units**: table of column, meaning, unit, reporting period, confirmed or suggested (suggestions visibly different from confirmed facts).
- **Checks to run**: list from the catalog with plain purpose, columns, parameters, prerequisites met or missing, procedure link. Missing prerequisites shown as "Will not run: no history supplied", never as a completed check.
- **Submission rules**: what holds a record.
- **Assumptions and limitations**: short list.
- **Questions** (if the planner needs answers): a batch of 3 to 5, each with suggested answers as radio options plus optional text; **Save answers** re-plans and refreshes this view.
- **Primary action: Launch ninjas.** One consolidated approval: confirms the profile (saving a new version if changed) and starts the run. If unanswered required questions remain, pressing it scrolls to them and explains what is missing. After success: toast "Ninjas launched", stage moves to Run.
- Optional: **Edit settings** opens a drawer for supported parameter edits; material changes show a change summary before launch.

**Run** (Phases 3 and 4, live)
- **Activity timeline** from backend events: plan, each tool call (name in mono, plain description, result summary, duration), investigation steps, completion. New events slide in. "Updated 2s ago".
- Counts that update as results arrive: records checked, ready, held, needs verification.
- Show agent count, model name and tool list only if the backend reports them.
- If the run fails or the model quota is exhausted: clear error state with what was completed, what was not, and **Retry run**.

**Review** (Phase 5)
- Summary chips: Ready, Held, Needs verification.
- **Findings list** sorted by severity, grouped High, Medium, Low (Low collapsed). Each finding row: record ID, entity, field, entered value with red-pen underline, finding title, severity badge, confidence in words (Strong / Moderate / Limited evidence).
- **Finding drawer** (opens beside the list, keeps context): affected record with its fields; evidence with source; why it matters; proposed action; proposed correction with a before/after diff when supported; linked procedure; source checks in mono. Actions: **Accept correction**, **Dismiss with reason** (required reason select + text), **Escalate**. 
- After decisions, **Recheck affected records** runs the affected checks again and shows the new result. A changed value never silently clears related findings.
- Feedback effect: when a decision changes later ranking, show "Ranked lower: you dismissed 2 similar findings" on the affected finding.

**Release** (Phase 6)
- Gate summary: N ready to release, M held (cannot be released), changes made, decisions recorded.
- Held records listed with their blocking finding.
- **Primary action: Release reviewed batch.** Confirmation dialog states exactly what is written: "Release 296 records to Halden Research. 4 held records stay out."
- After release: confirmation with release ID and time, link to the audit trail, **Download reviewed data**, and **Return to Halden Research** (to the `returnUrl` captured at intake).

### 8.6 Robustness requirements

- **Server state only through TanStack Query.** Query keys from `packages/api-client`. No duplicated server data in local state.
- **Polling** with `refetchInterval` while a job is in an active state (1.5s for Run, 5s otherwise), stopped when terminal or the tab is hidden. Abstract it so SSE can replace polling later without UI changes.
- **Mutations are idempotent from the UI's side:** buttons show pending state, double submits are blocked by the mutation state, and the backend's job state is refetched after every mutation.
- **Optimistic updates** only for reversible, low-risk actions (dismiss, ranking); never for release.
- **Lost responses:** after a network error on launch or release, refetch the job before offering retry, so a run is not launched twice.
- **Stale tabs:** if the job's version changed elsewhere, show "This job changed. Refresh to see the latest" instead of acting on old data.
- **Error boundary** per route with a useful fallback; global handler for 401 and 403.
- **URL is state:** selected step, selected finding and filters live in the URL so refresh and sharing work.
- **Performance:** route-level code splitting; virtualised lists over 100 rows; initial JS under 250 KB gzipped for the platform shell.

---

## 9. The widget (`packages/widget`)

### 9.1 Job

The visible proof that Pokayoke plugs into a client's site. It must look and behave like a real third-party SDK.

### 9.2 Build and API

- Framework-free TypeScript, rendered inside a **Shadow DOM** so host styles cannot leak in or out. Built with Vite library mode as one IIFE file, `pokayoke-widget.js`, hosted on the platform site at `/widget/v1/`.
- Loaded in the portal with a script tag; initialised once:

```html
<script src="https://<platform-host>/widget/v1/pokayoke-widget.js" defer></script>
<script>
  window.addEventListener("load", () => {
    Pokayoke.init({ publishableKey: "pk_demo_halden", apiBaseUrl: "…", platformUrl: "…" });
  });
</script>
```

```ts
Pokayoke.init(options: { publishableKey: string; apiBaseUrl: string; platformUrl: string }): void
Pokayoke.submit(file: File, options: { returnUrl: string; clientRef?: string }): Promise<{ jobId: string }>
Pokayoke.watch(jobId: string, statusToken: string): void        // resume after page reload
Pokayoke.on(event: "status" | "released" | "error", handler): () => void
```

- The portal app wraps this in a tiny typed hook for React.

### 9.3 Behaviour

A panel docked bottom-right, 360px wide, Pokayoke-branded (logo, navy text on white, coral only for held counts).

| Job state | Widget shows |
|---|---|
| Uploading | "Sending 300 records to Pokayoke" with real upload progress |
| Inspecting | "Reading the file", indeterminate (no fake percentage) |
| Awaiting QA | "Ready for QA review. A Pokayoke expert will verify and launch the checks." Button: **Open in Pokayoke** |
| Running | "Checks running" with live counts |
| Needs review | "4 records need review" with **Open in Pokayoke** |
| Released | "296 records saved. 4 held." Button: **View records** (refreshes the portal table) |
| Failed | Plain cause and **Try again** |

- **Open in Pokayoke** navigates to `${platformUrl}/jobs/${jobId}?return=${encodeURIComponent(returnUrl)}` (same tab, a real redirect; login intercepts if needed).
- Status comes from the public status endpoint, polled every 2s while active; it carries counts and stage only, never record contents.
- The panel can minimise to a small badge; it persists `jobId` and `statusToken` in `sessionStorage` (wrapped in try/catch) so a reload resumes watching.
- Accessible: `role="status"` and `aria-live="polite"` for updates, focusable controls, Escape minimises.

---

## 10. API contract (frontend proposal, confirm with the backend lead)

These shapes are what the frontend needs. They are a **proposal**: agree them with the backend lead, then generate types from the real `/openapi.json` and delete anything that differs. The UI must follow the generated types, not this table.

**Public (publishable key in `X-Pokayoke-Key`; used by the widget)**

| Method and path | Purpose |
|---|---|
| `POST /v1/intake` (multipart: `file`, `return_url`, `client_ref`) | Store the draft, run Phase 1 inspection, create a job. Returns `{ job_id, status_token }` |
| `GET /v1/public/jobs/{job_id}/status?token=` | `{ stage, state, counts: { total, ready, held, verify }, updated_at, error? }` |
| `GET /v1/public/jobs/{job_id}/accepted?token=` | Accepted records after release, for the portal table |

**Authenticated (Firebase ID token; used by the platform)**

| Method and path | Purpose |
|---|---|
| `GET /v1/jobs?state=` | Jobs queue |
| `GET /v1/jobs/{id}` | Job summary: state, stage, version, client, file, profile reference, return URL |
| `GET /v1/jobs/{id}/inspection` | Preview rows (max 50), columns, per-column stats, warnings |
| `GET /v1/jobs/{id}/plan` | Selected profile and match reason, field meanings, checks, prerequisites, rules, assumptions, limitations, open questions |
| `POST /v1/jobs/{id}/answers` | Save question answers; triggers re-planning |
| `POST /v1/jobs/{id}/launch` | **Launch ninjas**: confirm profile version and start the run |
| `GET /v1/jobs/{id}/events?after=` | Activity events for the timeline |
| `GET /v1/jobs/{id}/findings` | Findings with severity, confidence category, evidence, proposed action, correction, procedure, source checks |
| `POST /v1/findings/{id}/decision` | `{ decision: "accept" \| "dismiss" \| "escalate", reason?, correction? }` |
| `POST /v1/jobs/{id}/recheck` | Re-run affected checks |
| `POST /v1/jobs/{id}/release` | Release ready records; returns counts and release ID |
| `GET /v1/jobs/{id}/audit` | Decisions and changes |
| `GET /v1/profiles`, `GET /v1/profiles/{id}` | Profiles |
| `GET /v1/checks` | Supported-check catalog |

**Job state machine** the UI maps to the stepper:

```
received -> inspecting -> inspected -> planning -> awaiting_answers -> awaiting_launch
  -> running -> awaiting_review <-> rechecking -> ready_to_release -> released
any state -> failed (with reason and the last completed step)
```

---

## 11. Development mocks

- `packages/api-client/mocks`: MSW handlers implementing the contract with fixtures built from `data/ps08_data_entries.csv`, including a job that walks through every state on a timer so the Run view can be built.
- Enabled only when `VITE_USE_MOCKS=true` in development. When on, every app shows a fixed corner badge "Mock data".
- Production builds fail if mocks are enabled. MSW must not be imported in production code paths.
- Remove each mock handler as the real endpoint is confirmed working.

---

## 12. Testing

| Level | What |
|---|---|
| Unit (Vitest) | Status and severity mapping, config validation, widget state machine, query key helpers |
| Component (Testing Library) | FindingCard actions, question form validation, Launch ninjas blocked-state explanation, release confirmation text |
| E2E (Playwright) | Full journey across three origins: marketing Begin demo, portal import sample, widget appears, Open in Pokayoke, login, profile visible, Launch ninjas, review a finding, release, return, portal shows accepted rows and excludes held ones |
| Accessibility | axe scan on every route in the E2E run; zero serious or critical violations |

Run E2E in mock mode in CI and against the deployed stack before submission.

---

## 13. Build order

Work in this order. Each milestone ends deployed and demoable. Commit at every working step.

1. **Scaffold and deploy**: workspace, three Vite apps, shared `brand`, `ui`, `api-client`, `widget` packages, Tailwind wired to tokens, the platform Dockerfile and nginx config, two Vercel projects. Complete every step of section 2.5.
2. **Platform core with mocks**: login, shell, Jobs list, Job workspace with Profile, Launch ninjas, Run timeline, Review with finding drawer, Release.
3. **Widget and portal with mocks**: portal screens, widget states, redirect to the platform and the return flow.
4. **Real API**: generate types from the backend's OpenAPI, replace mocks endpoint by endpoint, connect Firebase Auth token verification.
5. **Marketing site**: sections, data spine, presenter mode, architecture diagram matching the real backend.
6. **Hardening**: states checklist, a11y pass, E2E green against deployed stack, remove all mocks from production.

**Cut list if time runs short (cut from the top):** profile detail and version history pages, `/checks` and `/activity` pages, dark theme switch, marketing scroll-linked spine animation (keep the static diagram), widget minimise badge. **Never cut:** login, selected-profile verification, Launch ninjas, real activity events, findings with evidence, release gate, the return to the portal.

---

## 14. Reference docs

- `docs/brand/README.md`, `docs/brand/brand-sheet.html`: brand identity
- `docs/phases.md`, `docs/phases/phase-1.md`, `docs/phases/phase-2.md`: backend behaviour per phase
- `docs/problem/first-iteration-solution.md`: the agreed first journey
- `docs/problem/problem-scoping.md`: evaluation definitions
- `docs/strategy/vision-and-competitors.md`: market, claims and sources for the marketing site
- `data/README.md`: dataset quirks (load with `keep_default_na=False`)
- `AGENTS.md`: rules for all coding agents
