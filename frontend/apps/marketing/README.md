# Pokayoke marketing site

Nine sections from `MASTER_UI.md`: hero, problem, context beyond rules, poka-yoke, six-phase workflow, agent architecture, trust, roadmap, and demo handoff.

From the `frontend/` workspace:

```sh
pnpm dev:marketing
pnpm --filter @pokayoke/marketing build
pnpm exec playwright test -c playwright.marketing.config.ts
pnpm exec playwright test -c playwright.demo.config.ts
```

The development URL is `http://127.0.0.1:5173`. The local demo link opens the client portal on port 5175. For Vercel, set `VITE_PORTAL_URL` to the deployed portal. Without that value, the page explains that the demo destination is not available yet. The marketing site needs no backend URL.

Presenter controls: **P** enters or exits; **arrows**, **Page Up/Down**, and **Space** change sections; **Home/End** jump to the first/last section; **Esc** exits. The footer also has a presenter toggle and the presentation has visible navigation controls. Section hashes support direct links.

The data spine uses original sample values and is explicitly labelled as an illustration. Research facts link to their sources and identify the publication year. The architecture is labelled planned while backend integration is in progress; roadmap capabilities are not presented as implemented.

Lenis handles wheel scrolling through the GSAP ticker. GSAP ScrollTrigger reveals the spine's six checkpoint popups as sections and workflow phases enter view. Links preserve section hashes and keyboard focus. Presenter mode and reduced-motion preferences use native scrolling and a static explanation. Begin demo opens the [sample client portal](../client-portal/README.md) for CSV import and a real draft handoff to Pokayoke.

Desktop is the current priority. Reduced-motion mode keeps all content readable and removes scroll-dependent movement. The six workflow phases remain available together in the presenter view.

Verified on 20 October 2026: production build, TypeScript, ESLint, formatting, 25 workspace unit tests, and six marketing browser scenarios passed. Desktop widths 1280, 1440, and 1920 were checked; all nine presenter slides fit 1280×720 with 20px body text. Automated accessibility checks reported zero violations. Browser checks also verified the scroll-driven record and all six workflow phases.

Checks used the installed Node 24 runtime. Node 22 remains the declared deployment target. This result verifies the marketing site; it does not claim the backend workflow is deployed.
