# National AI Hackathon Finale — Team Plan

**Event:** Tuesday, 20 October 2026, NIC Islamabad  
**Team:** You, Rayyan, Abdullah  
**Working principle:** Build one complete, working solution first. Then make it faster, clearer, more accessible, and more compelling to use.

## The mission

- Deliver a live, deployed Agentic AI product for the problem statement selected on the day.
- Show a real user completing a meaningful task from input to outcome.
- Make the agent workflow visible and defensible: agents should plan, use tools, take actions, and produce a verifiable result.
- Pair strong technical execution with a polished user experience and a persuasive problem story.
- Submit every required artifact before **3:45 PM**. Treat **3:00 PM** as the switch to finalization and risk reduction, not as a development estimate.

## Ownership

- **You — backend and reliable fallback**
  - Own the agent workflow, backend, integration, and GCP deployment.
  - Build a secondary, presentable website connected to the real backend. It is the fallback if the main website is not ready or does not fit the final workflow.
  - Keep the team informed about what the system actually does, its limits, and deployment status.
- **Rayyan — main product experience**
  - Own the primary website, UI, visual quality, and the user's path through the product.
  - Make domain tasks easy to understand and complete, including accessibility where it matters for the chosen users.
  - Integrate against the same real backend as the fallback website.
- **Abdullah — story and critical review**
  - Own the problem narrative, pitch, presentation, and speaking plan, with input from everyone.
  - Test the product as an uncoached outside user and challenge confusing flows, weak claims, and demo risks.
  - Track the submission checklist and keep the team aware of the clock.
- **Everyone**
  - Understand the complete product and be ready to answer technical and product questions.
  - Raise blockers and scope concerns early. Help outside your primary area when that is the best use of time.

## The 30-minute report-and-plan cycle

- Work in approximately **30-minute cycles** throughout the build.
- At each checkpoint, each member gives a short report:
  - What works now? Show evidence where possible.
  - What is blocked or at risk?
  - What will I complete in the next cycle?
- As a team, update the plan for the next cycle:
  - What is the highest-value unfinished work?
  - What should be dropped, simplified, or deferred?
  - Is a new feature worth its integration and demo risk?
  - Is the deployed end-to-end path still healthy?
- End each checkpoint with named owners and a clear next action. Keep it brief so the cycle supports building rather than consuming it.
- Abdullah tests what has been completed during the cycle and brings an outside perspective to the next checkpoint.

## Choosing and scoping the problem

- The problem statements are revealed and selected on the day. Each team gets a unique statement; pick order comes from a draw and also sets presentation order.
- Choose for a combination of:
  - Clear user pain and a measurable outcome.
  - An agent workflow that can visibly plan, use tools, and act.
  - Inputs and dependencies the team can obtain and use on the day.
  - A strong live demonstration within the presentation time.
  - Room for useful UX improvements and a credible path to a larger product.
- Once selected, define the **exact first end-to-end journey**: who the user is, what they provide, what the agents do, and what result they receive.
- Anchor the demo in one specific user and task. Explain how the same approach can expand to other users in the domain after that task works.

## Build order and product standard

- **First: complete the exact solution.** Make the selected user journey work end to end on real inputs with the real agent workflow.
- **Second: make it dependable.** Connect the UI to the backend, deploy on GCP, handle obvious failures, and test the deployed link.
- **Third: add high-value polish.** Improve speed, clarity, accessibility, and ease of use. Consider voice, gestures, one-click exports, or visualizations only when they help the chosen user accomplish the core task.
- **Fourth: add supporting evidence.** Show useful tests and scalability findings that explain what the system can handle and where its limits are.
- Keep the primary and fallback websites compatible with the same backend behavior. A fallback only counts if it can demonstrate the real workflow independently of the main UI.
- Do not claim a feature, test result, or level of production readiness that the running product cannot support.

## Testing and scalability evidence

- Run meaningful checks for the chosen workflow, such as unit tests for important logic, end-to-end tests for the user journey, and API concurrency tests where relevant.
- Record what was tested, the conditions, the observed result, and any bottleneck. Distinguish tested capacity from a future scaling plan.
- A dedicated testing/scalability page can help judges inspect this evidence, provided the results are real and the core demo remains the priority.
- Explain how the prototype could become an MVP and then a market-ready product, including the next engineering steps rather than an unsupported claim that it is instantly production ready.

## Presentation and brand

- Abdullah leads a **7-minute presentation** followed by **3 minutes of judges' Q&A**. Keep the live product central to the presentation.
- **Pitch philosophy: sell the problem before revealing the solution.**
  - Begin with a concrete scenario the judges can imagine themselves or someone they care about facing.
  - Make the human cost, frustration, or missed opportunity vivid enough that the need for a solution feels urgent.
  - Build toward the moment the audience wants an answer; then reveal the product as the emotional release and demonstrate that it actually resolves the scenario.
  - Lead with emotion and empathy. Use the live demo and credible evidence to earn the judges' logical confidence after they understand why the problem matters.
  - Keep the story truthful to the chosen users and problem. The emotional weight should come from a real need, not an exaggerated claim.
- Tell a simple story: the user and problem, the agent-driven solution, the live journey, technical execution and GCP deployment, then impact and growth potential.
- Create the name, logo, theme, slides, and any motion-graphics video after the problem is selected, in line with the event's on-day creation rules.
- A short marketing-style video may establish the product and brand. Label any recorded footage honestly; never present a recording or hardcoded output as a live result.
- Rehearse against the **deployed** product. Abdullah should interrupt with the skeptical questions a judge might ask.

## Finalization: begin at 3:00 PM

- Shift the team's question from “What else can we add?” to “What could fail in front of the judges?”
- Stabilize the deployed workflow and stop changes that put the live demo at risk.
- Let Abdullah run an uncoached test, check the pitch against the actual product, and verify every claim.
- Check both the main and fallback websites, the demo inputs, API access, and the deployed URL from a fresh browser session.
- Confirm the GitHub repository and short README explain how the product works.
- Finalize slides, a short agent architecture diagram, and team details.
- Submit and verify the required links and files **before 3:45 PM**. Do not use the deadline itself as the target finish time.

## Required submission checklist

- [ ] Live deployed GCP link
- [ ] GitHub repository link, public or shared with organizers, with a short README
- [ ] Presentation slides, as a PDF or link
- [ ] Short diagram showing the agents and how they interact
- [ ] Team name and all members' names
- [ ] Submitted links opened and checked after submission

## Rules to keep visible

- Project code, designs, and data pipelines must be created on the event day after the problem statement is revealed. The agenda says development starts after selection is complete at **11:00 AM**; follow that stricter start.
- Learning, account readiness, and tool setup beforehand are allowed. Do not bring a ready-made project or template into the submission.
- Develop using Google Antigravity and deploy on GCP.
- Use a Git repository and commit regularly. Keep provided API keys and cloud credentials out of the repository.
- Only registered team members may work on the project. Everyone must be able to explain the code and architecture.
- The demo must be live. A screen recording made on the day is a backup for an internet failure, not a substitute presented as live.

## Source documents

- [Participant Guide](../atomcamp%20National%20AI%20Hackathon%20Finale%20-%20Participant%20Guide.pdf)
- [Event Agenda](../atomcamp%20National%20AI%20Hackathon%20Finale%20-%20Event%20Agenda.pdf)
