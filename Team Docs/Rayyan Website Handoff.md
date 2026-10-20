# Rayyan — Website Handoff

**Event:** National AI Hackathon Finale, 20 October 2026  
**Your ownership:** The primary website, its visual identity, and the user's experience from first action to useful result.  
**Team rhythm:** Work in 30-minute cycles, then report, test, and plan together.

## What we are building toward

- A visually distinctive, genuinely usable website that demonstrates the selected problem's complete Agentic AI solution.
- A site that feels designed for its real users and domain, rather than a generic AI-generated dashboard.
- A live journey that makes the user's input, agent work, and final outcome easy for judges to follow.
- A main website connected to the same real backend as the presentable backup website being built by the backend lead.

## Your working relationship with the team

- **Backend lead:** Builds the agents, API, deployment, and backup website. You both agree on the API contract after problem selection. Either of you can propose changes when the user journey needs them; announce and agree on changes before relying on them.
- **Abdullah:** Owns the problem story, pitch, and critical outside testing. Give him working screens early. Ask him to try the site without coaching and tell you what is confusing, slow, or unconvincing.
- **You:** Own the primary experience and visual decisions. You can build independently against documented API responses, then replace development responses with real calls as endpoints become available.

## Start after the problem is selected

- Define the specific first user and the task they must complete. Agree on the exact end-to-end journey with the team.
- Identify the screens or states needed for that journey: starting point, input, agent activity, result, next action, and relevant errors.
- Choose a visual direction from the chosen users and problem: three brand qualities, type style, primary and accent colors, neutral surfaces, and a consistent icon style.
- Make the core user action obvious immediately. Let the result screen prove the value of the product.
- Create the project's UI, brand assets, and code on the event day. The guide prohibits building project code or designs before the problem reveal; the agenda says development starts after selection at 11:00 AM.

## Frontend–backend contract

- The backend lead keeps an up-to-date endpoint document in the shared repository. It is the working reference for the UI.
- Each endpoint entry should include:
  - Method and path, purpose, and current status: planned, working, or changed.
  - Required inputs, field descriptions, and an example request.
  - Example success response, including every field the UI needs to display.
  - Error responses, loading/progress behavior, and any authentication or upload requirements.
- Ask for a contract decision as soon as the user experience exposes a missing field, state, or action. Do not silently guess the response shape.
- Keep the backend address in **one frontend configuration point**. Do not hardcode ports or full URLs throughout components.
- A port identifies a local server; an endpoint is a route under that server. New product features usually add or change routes, not ports.
- If you work on separate laptops, `localhost` on your laptop cannot reach a server on the backend lead's laptop. Use a reachable development address or the deployed backend URL, as agreed at the checkpoint.
- The frontend may use temporary, contract-shaped development responses while the backend is being built. Replace them with real API calls for integration and the live demo. Never present mocked or hardcoded results as live agent output.
- Keep API keys and other secrets in the backend. Frontend environment variables and bundled JavaScript are visible to users.

## Repository and 30-minute integration cycle

- Work in the same GitHub repository as the backend lead, primarily in your frontend area. Make small, clear commits.
- Branch from the agreed shared base. Merge completed work through the normal Git workflow; do not force-push over another member's work.
- At each 30-minute checkpoint:
  - Report what works, what is blocked, and what you intend to complete next.
  - Pull the latest API document and backend changes; review what changed.
  - Tell the team about any UI-driven contract changes you need.
  - Run one real UI-to-backend action together. A clean Git merge alone does not prove the app is integrated.
  - Let Abdullah test the newest usable flow without instructions.
  - Decide whether the next feature adds enough user value to justify its integration and demo risk.
- Keep the main website and backup website aligned on backend behavior. The main UI can be much more polished, but both must demonstrate the same genuine solution.

## Make the website feel crafted

- Design around the user's task and domain language. Give each screen a clear visual hierarchy and one obvious next action.
- Prefer consistent typography, spacing, color roles, and components over a large collection of effects.
- Make the agent's work legible: show meaningful progress, what action was taken, and what outcome was produced without exposing distracting internal noise.
- Give the result screen special attention. Help the user interpret, verify, and act on the output.
- Design loading, empty, success, and error states. A polished hero section cannot rescue a confusing or broken task flow.
- Add accessibility features that matter to the selected users: readable contrast, keyboard use, clear labels, sensible focus, and reduced motion where appropriate.
- Treat voice, gestures, downloads, and visualizations as product features only when they make the chosen task faster or easier.

## Assets and animation choices

- Use [Awwwards](https://www.awwwards.com/) for inspiration in composition, type, and motion. Adapt ideas to this product; do not copy a complete site, asset set, or presentation.
- Use an accessible component foundation if useful: [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) for unstyled controls or [shadcn/ui](https://ui.shadcn.com/docs) for customizable components. A component library is different from submitting a ready-made project template.
- A consistent icon set such as [Lucide](https://lucide.dev/guide/react/) can save time. Prefer a few purposeful icons to icon-heavy decoration.
- Choose **one** animation library based on your stack and fluency:
  - [Motion](https://motion.dev/docs/react) is a strong default for React state changes, layout transitions, and interaction feedback.
  - [GSAP](https://gsap.com/docs/v3/Installation/) is a strong choice if you are faster with it or need a carefully choreographed brand moment.
  - [Anime.js](https://animejs.com/documentation/) is another option for timelines and SVG or text effects if it is the tool you know best.
- Use CSS for simple transitions. Use WebGL only if the selected problem needs an interactive 3D view; visual novelty alone does not justify the extra work.
- Keep motion tied to meaning: orient the user, indicate progress, confirm actions, or reveal results. Respect reduced-motion preferences.

## Finalization begins at 3:00 PM

- Shift from adding features to protecting the live experience.
- Test the deployed website in a fresh browser session, including the main journey and relevant error states.
- Confirm the main UI calls the real deployed backend and that the backup website can demonstrate the same workflow if needed.
- Give Abdullah a full, uncoached run-through and resolve the issues most likely to hurt the judges' understanding or trust.
- Freeze risky visual or animation changes before the **3:45 PM** submission deadline. Help verify the submitted link opens and works.

**PRE HACKATHON NOTES**

- Frontend can be on vercel with backend on GCP
- 

## References

- [Team plan](Hackathon%20Team%20Plan.md)
- [Participant Guide](../atomcamp%20National%20AI%20Hackathon%20Finale%20-%20Participant%20Guide.pdf)
- [Event Agenda](../atomcamp%20National%20AI%20Hackathon%20Finale%20-%20Event%20Agenda.pdf)
