# Vision and Competitor Landscape

Where PS-08 fits in the market, what already exists, where the open space is, and what we build to stand out. The [initial problem scope](../problem/initial-problem-scope.md) and [first iteration journey](../problem/first-iteration-solution.md) define the current build boundary; [problem-scoping.md](../problem/problem-scoping.md) retains evaluation definitions and earlier discussion. This document also describes longer-term capabilities. Every factual claim about a company links to a source in the [Sources](#sources) list. Vendor figures (acceptance rates, "X% faster") are the vendor's own claims with no published method; quote them as such or not at all.

**Research interpretation:** This is desk research, not a hands-on usability study or an exhaustive market survey. Unverified absence is not a competitive advantage we can claim as fact. The current documentation corrections for Flatfile and Ataccama below supersede older comparisons.

**Contents**

1. [Vision](#1-vision)
2. [Why the problem matters](#2-why-the-problem-matters)
3. [The market in five groups](#3-the-market-in-five-groups)
4. [Competitor profiles](#4-competitor-profiles)
5. [Capability matrix](#5-capability-matrix)
6. [The open space](#6-the-open-space)
7. [How we stand out: features mapped to gaps](#7-how-we-stand-out-features-mapped-to-gaps)
8. [What we must not claim](#8-what-we-must-not-claim)
9. [Judge Q&A preparation](#9-judge-qa-preparation)
10. [Path from prototype to product](#10-path-from-prototype-to-product)

---

## 1. Vision

**An automated data QA layer, delivered as SaaS, that sits in front of the client's database and stops bad data before it is written.**

Many reviewed observability products focus on stored tables and pipelines. Import tools also validate before submission, so early validation alone is not unique. Our proposed focus is an analyst-facing quality gate with contextual evidence, linked procedures, saved review profiles, and feedback before records enter the accepted destination. Forms, feeds, and imports are part of the broader vision; the first journey uses a file upload.

After an initial setup (connect the entry points, load history, procedures, and business rules), the platform learns the client's data: normal ranges per field and entity, how values move over time, which errors each team tends to make, and which flags analysts confirm or dismiss. From then on it runs on its own:

- **Pass:** clean entries go straight through to the database.
- **Hold:** likely errors are stopped before they are written, with the evidence, a severity, a proposed fix, and the linked procedure.
- **Auto-fix:** where the client allows it and confidence is proven, routine errors (formats, units, obvious duplicates) are corrected automatically and logged.
- **Ask:** only the uncertain cases go to an analyst. Their decision becomes training signal.

**Autonomy grows with confidence.** On day one, more cases go to people. As the platform proves its precision on a field or error type, it takes over that slice. Over time, human review shrinks to the genuinely hard cases. A spell-check for data that turns into an autopilot for data quality.

**The first proof of concept** follows the current journey: upload a draft file, confirm and save a review profile, run checks, hold issues, accept a supported correction, recheck, and submit reviewed records. It demonstrates a recorded, bounded feedback effect. Autonomous corrections and other entry methods remain later capabilities unless separately agreed.

### Who it is for

An analyst at a financial data provider entering company figures by hand. The sample dataset matches this: `revenue_ttm`, `net_income`, `eps`, `market_cap`, `total_assets`, `operating_margin`, `debt_equity_ratio`, `dividend_yield`, `acquisition_date`, `completion_status`, across a set of companies, with a Draft, Submitted, Approved, Rejected workflow.

Secondary user: the **QA reviewer or team lead** who today checks analysts' work by hand (the "checker" in a maker-checker process) and owns the error and SLA numbers.

### Product principles

- **Prevent, then explain.** Catch the issue before submission and say why, in the analyst's terms.
- **Automated checks, accountable actions.** The gate determines ready or held status. The first journey uses analyst-approved corrections and batch release; the longer-term vision includes explicitly authorized automatic fixes. Decisions are explained and recorded.
- **Show the evidence.** Every flag points to what triggered it: a range, a past value, a related field, a similar past rejection, a duplicate record.
- **Use feedback within clear limits.** Analyst decisions can improve advisory ranking or later evaluated models. Feedback alone does not prove correctness, waive required checks, or authorize greater autonomy (brief requirement 5).
- **Few, accurate flags.** A checker that cries wolf gets ignored. False alarm rate is a scored metric.

---

## 2. Why the problem matters

### Human entry error is real and hard to see

- Single manual data entry produces error rates of **around 1%**, and most of those errors **fall inside allowable ranges**, so range checks, histograms, and frequency tables do not reveal them. Visual checking by a person was no better than single entry, with roughly 30 times the errors of double entry ([Barchard & Pace, 2011](https://doi.org/10.1016/j.chb.2011.04.004), summarized by the [UNLV lab](https://img.faculty.unlv.edu/lab/newsletter/issue3/data-checking/)).
- This is the core argument for PS-08: **range rules catch the errors that are easy to catch. The plausible-but-wrong value needs context**: the previous value, related fields, peer records, and the patterns of past mistakes.

### The cost

- Gartner estimates poor data quality costs organizations **at least $12.9 million a year on average** (Gartner research from 2020, cited on [Gartner's data quality page](https://www.gartner.com/en/data-analytics/topics/data-quality)). This is a cross-industry average; use it as context, not as a figure for one firm.

### The reference case: S&P Global

S&P Global Market Intelligence (Capital IQ, SNL) shows the problem at its sharpest. The PS-08 brief does not name a sponsor, so present this as an industry example, not as the client.

| Fact | Source |
|---|---|
| Runs **over 155,000 automated data quality checks** and collects billions of data points a year | [Quality Program snapshot, 2021](https://www.spglobal.com/marketintelligence/en/documents/234057_quality-program-snapshot_a4_digital.pdf) |
| Pays clients **$50** (gift card or charity donation) for each data quality issue it validates | Same snapshot; [2017 launch announcement](https://www.biia.com/sp-global-market-intelligence-rolls-out-quality-program-for-capital-iq-and-snl-platforms) |
| Program launched in 2017 with over 145,000 checks | [2017 launch announcement](https://www.biia.com/sp-global-market-intelligence-rolls-out-quality-program-for-capital-iq-and-snl-platforms) |

**Pitch line:** a market leader with more than 155,000 automated checks still pays customers to find the errors those checks missed. That gap, between rules and context, is what PS-08 closes.

Earlier notes said 170,000 checks. No source for that was found; use "over 155,000".

---

## 3. The market in five groups

| Group | Examples | Works on | Main user | Closest to PS-08 because |
|---|---|---|---|---|
| **A. Status quo** | Form validation rules, spreadsheet data validation, maker-checker review by a second person | The entry form, at entry time | Analyst and reviewer | It sits at the same point in the workflow. It is static and manual |
| **B. Data observability** | Monte Carlo, Anomalo, Bigeye, Sifflet, Metaplane (Datadog), Acceldata | Warehouse tables and pipelines, after data lands | Data engineer | Most mature "predictive" quality tools; now adding AI agents |
| **C. Data quality and governance suites** | Informatica (CLAIRE agents), Ataccama ONE, Collibra Data Quality, Qualytics | Enterprise data estates, master data | Data steward | Learn rules from data history, some have agent-led remediation |
| **D. Test-as-code and cloud-native** | Soda, Great Expectations (GX Cloud), Google Dataplex / Knowledge Catalog | Tables in a warehouse, run in pipelines or on a schedule | Data engineer | Free or cheap, on GCP; a judge may ask "why not Dataplex?" |
| **E. Data import and onboarding** | Flatfile, OneSchema | A file being uploaded into an app | End user uploading data | They validate **before** data is committed, with an in-UI review step. Closest UX pattern to ours |

---

## 4. Competitor profiles

### B. Data observability

**Monte Carlo**
- ML monitors on freshness, volume, schema, and quality, with lineage.
- **Circuit Breakers** (2022) stop a pipeline job when a quality check fails, so bad data does not reach downstream tables ([source](https://montecarlo.ai/blog-announcing-circuit-breakers-a-new-way-to-automatically-stop-broken-data-pipelines-and-avoid-backfilling-costs)).
- **Observability Agents** (April 2025): a Monitoring Agent that recommends monitors and thresholds (vendor claim: 60% of recommendations accepted) and a Troubleshooting Agent that uses parallel subagents to test root-cause hypotheses (vendor claim: 80% faster incident resolution). The agents are read-only ([source](https://montecarlo.ai/blog-monte-carlo-observability-agents)).
- **Gap for us:** prevention happens in the pipeline, after entry. Nothing faces the analyst who made the entry, and no correct value is suggested.

**Anomalo**
- Unsupervised ML checks "inside your tables", plus no-code validation rules and key metric checks; hourly queries across millions of tables; root-cause analysis with lineage; automatic secondary checks to reduce false positives. Now markets itself as "the autonomous data system for the agentic enterprise", with Data Quality, Table Observability, and other agents, and a chat interface (AIDA) ([source](https://www.anomalo.com/product-overview/)).
- **Gap for us:** works on data already stored. Its product page describes no pre-ingestion blocking and no entry-time review.

**Bigeye, Sifflet, Metaplane**
- Bigeye: freshness, volume, and schema monitors via templates and SQL; "bigAI" root-cause and remediation suggestions. Sifflet: monitoring, lineage, trust scores, with agents for prioritization, root cause, and fix recommendations. (Both from a [Sifflet-written comparison](https://www.siffletdata.com/blog/bigeye-alternatives), so treat as one-sided.)
- Metaplane: anomaly detection trained on historical metadata, alerts through Slack or PagerDuty, **learns from users' responses to alerts**; acquired by Datadog in April 2025 ([TechCrunch](https://techcrunch.com/2025/04/23/datadog-acquires-ai-powered-observability-startup-metaplane)).
- **Gap for us:** same layer as Monte Carlo. Metaplane's feedback learning is the nearest thing to our feedback loop, but it learns from engineers' alert responses at table level, not analysts' decisions on single entries.

**Acceldata**
- Agentic Data Management platform on its "xLake Reasoning Engine". Its Data Quality Agent scans batch jobs, pipelines, and tables; traces root causes via lineage; can auto-reprocess impacted data and flag unresolved records; recommends guardrails from historical patterns. Humans approve remediation, override false positives, and approve guardrails ([source](https://www.acceldata.io/agentic-data-management/use-cases/data-quality-agent)).
- **Gap for us:** strongest "agentic remediation" story in the market, but on pipelines and tables, aimed at platform teams.

### C. Data quality and governance suites

**Informatica (CLAIRE Agents, May 2025)**
- Eight agents including a **Data Quality Agent** that "continuously monitors and remediates data quality across cloud warehouses", MDM systems, and third-party repositories ([source](https://www.businesswire.com/news/home/20250514956132/en/Informatica-Unveils-Agentic-AI-Offerings-on-Its-AI-Powered-Cloud-Data-Management-Platform)).
- **Gap for us:** enterprise estate level, heavy platform, steward-facing.

**Ataccama ONE (November 2025)**
- The launch announcement describes an autonomous worker for profiling, rules, duplicates, and inconsistencies. Its "83% faster" figure is a vendor claim, not an independently established result ([announcement](https://www.globenewswire.com/news-release/2025/11/06/3182705/0/en/Ataccama-launches-Agentic-data-trust-platform-powered-by-an-autonomous-AI-agent-that-delivers-AI-ready-data-83-faster.html)).
- Current official documentation explicitly describes a planning agent that calls tools, requests approval before applying changes, and supports undo. Approval is therefore not a defensible differentiator for us ([AI Agent documentation](https://docs.ataccama.com/ataccama-one-agentic/latest/gen-ai/ai-agent.html)).
- **Positioning hypothesis:** focus our demonstration on the analyst's incoming records and pre-submission workflow, without claiming that contextual agents or approval controls are unique.

**Collibra Data Quality**
- Builds a behavioral model per dataset from column profiles (nulls, cardinality, type shifts, row counts, min, max, mean) over a lookback window. Users can **Pass, validate, or Suppress** findings, which resets scores and keeps breaking runs out of the baseline ([source](https://productresources.collibra.com/docs/collibra/latest/Content/DataQuality/DQCoreComponents/co_behavior.htm)).
- **Gap for us:** feedback exists but at column and dataset level, by a steward, after the fact.

**Qualytics**
- Profiles data and **infers and evolves rules automatically**, with anomaly detection and no-code workflows; $10M Series A in June 2025; signed one of the top three US financial services institutions ([SiliconANGLE](https://siliconangle.com/2025/06/23/qualytics-gets-10m-use-ai-monitor-data-ai/)).
- **Gap for us:** proof that inferred rules sell in finance, but it still runs on data stores, not at entry.

### D. Test-as-code and cloud-native

**Soda**
- Checks written in SodaCL run in pipelines and CI/CD. Soda Cloud adds ML anomaly detection that learns patterns over about five days without written rules ([source](https://docs.soda.io/soda/quick-start-automate.html)).

**Great Expectations (GX Cloud)**
- **ExpectAI** (May 2025) analyzes data in the background and recommends Expectations; humans approve the ones that fit; a feedback survey refines future suggestions ([source](https://greatexpectations.io/blog/gx-expectAI/)).

**Google Dataplex auto data quality (Knowledge Catalog)**
- Built-in rules (null, uniqueness, regex, value set, range) plus custom SQL row and table conditions, run as scans on BigQuery tables hourly, daily, or on demand. Rules can be **recommended from a data profile scan** ([docs](https://docs.cloud.google.com/dataplex/docs/use-auto-data-quality)). Google's own codelab uses the Antigravity agent to draft a rule plan from a profile, which a human approves before deployment ([codelab](https://codelabs.developers.google.com/programmatic-dq)).
- **Why it matters for us:** it is on GCP, free to start, and judges may know it. It runs on rows already in a table and does not cover checking a record before it is written. Position it as **complementary**: Dataplex guards the warehouse, our agent guards the front door, and both can share the same rules in BigQuery.

### E. Data import and onboarding

**Flatfile**
- Provides column mapping and pre-import review ([import overview](https://support.flatfile.com/articles/7763163677-importing-data-with-flatfile-overview)). Its Transform add-on also offers agentic cleanup suggestions based on schema, rules, and historic account transformation patterns. Users can edit suggestions, preview, and apply changes. Suggestions depend on available context and currently target columns with validation errors ([Analyze and Suggestions](https://support.flatfile.com/articles/7462518044-How%20to%20use%20Analyze%20and%20Suggestions%C2%A0in%20Flatfile)). Mapping history is scoped by schema and environment ([mapping history](https://support.flatfile.com/articles/8421984657-how-does-flatfile-ensure-mapping-is-as-accurate-as-possible)).

**OneSchema**
- Automatic format conversion (dates, numbers, country codes, phone numbers), format inference, inline correction with bulk find-and-replace and undo ([source](https://www.oneschema.co/blog/advanced-csv-import-features)).

**Implication for us:** pre-submission review is an established product pattern, though these sources do not independently establish user acceptance. Flatfile also documents history and agentic suggestions. Treat guided questions, procedure-linked findings, and a reusable review profile as design hypotheses to test; do not claim import competitors universally lack history, learning, agents, or cross-record checks.

### A. The status quo (the real competitor)

What an analyst has today:

- **Static form rules**: required fields, type and format checks, fixed min and max. Cheap, predictable, blind to context.
- **Maker-checker review**: a second person checks entries after submission. Slow, expensive, and visual checking is about as error-prone as no checking ([Barchard & Pace, 2011](https://doi.org/10.1016/j.chb.2011.04.004)).
- **Rejections after the fact**: errors are found downstream, sent back, and fixed later, which is the rework, escalation, and SLA cost the brief describes.

This is what we replace first. In the pitch, compare against this, not against Monte Carlo.

---

## 5. Capability matrix

✓ = documented in the cited sources. ◐ = partial or at a different layer. ✗ = looked for and not found. ? = not checked. "Not found" means we found no evidence, not proof that it is absent.

| Capability | Status quo | Monte Carlo | Anomalo | Acceldata | Ataccama | Collibra DQ | Dataplex | GX Cloud | Flatfile | **PS-08 agent** |
|---|---|---|---|---|---|---|---|---|---|---|
| Checks a record **before** it is submitted | ✓ static | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ static | **✓** |
| Analyst-facing explanation per issue | ◐ error text | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ error text | **✓** |
| Proposes an action or corrected value to the user | ✗ | ✗ | ✗ | ✗ | ✓ agent proposals | ✗ | ✗ | ✗ | ✓ Transform suggestions | **Planned** |
| Links to the procedure to follow | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| Uses history | ✗ | ◐ metric baselines | ◐ table ML | ✓ | ? | ✓ behavior model | ◐ profile | ◐ | ✓ mapping and transformation history | **Planned error patterns** |
| Cross-field logic | ◐ hand-coded | ? | ? | ? | ✓ inconsistencies | ? | ✓ SQL rules | ? | ◐ schema | **✓** |
| Cross-record checks (duplicates, conflicts) | ✗ | ? | ? | ✓ duplicates | ✓ duplicates | ? | ✓ uniqueness | ? | ? | **✓** |
| Ranks issues by importance | ✗ | ✓ alerts | ? | ? | ? | ? | ✗ | ? | ◐ warning / error | **✓ severity + confidence** |
| Learns from user decisions | ✗ | ◐ accepted monitors | ? | ◐ approvals | ✗ | ✓ pass / suppress | ✗ | ◐ survey | ◐ mapping choices | **✓ per entry** |
| AI agents | ✗ | ✓ | ✓ | ✓ | ✓ | ? | ◐ via Antigravity codelab | ◐ ExpectAI | ✓ Transform agent | **Planned** |
| Human approval controls | n/a | ✓ read-only | ? | ✓ | ✓ approval and undo | n/a | n/a | n/a | ✓ preview and apply | **Planned approval and recorded decisions** |
| Gates writes before the database, automatically | ◐ static rules | ✗ (pipeline jobs) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ import step | **✓** |

**Reading the matrix:** feature availability can depend on product version and add-ons. Remaining absence marks describe what the cited review found, not proof that a feature is unavailable. Every mark in the PS-08 column is a proposed capability, not an implemented or measured result.

---

## 6. The open space

These are opportunities to investigate, not established market absences:

1. **Reduce setup work.** Inspect the file first, ask targeted questions about unresolved business meaning, and save the resulting review profile.
2. **Make findings actionable.** Show record-level evidence, a relevant procedure, and the next action in the same review. The brief requires linked procedures; the research does not prove competitors cannot provide them.
3. **Make feedback specific.** Record a reason on each finding and demonstrate a bounded effect on later advisory results. Evaluate whether it reduces unnecessary review without hiding real errors.
4. **Make the submission boundary visible.** Show held drafts staying out of the accepted destination and corrected records reaching it. Pre-import checks, agents, and approval controls already exist in reviewed products; our combined workflow needs evaluation.
5. **Publish defensible evidence.** Report catch rate, false alarm rate, precision, set size, method, and reviewed versus generated results. Do not repeat unverified vendor performance claims as facts.

---

## 7. How we stand out: features mapped to gaps

Ordered by value for the demo. **Must** = needed for the core journey. **Should** = strong differentiator if time allows. **Could** = only if everything else works.

**Build boundary update:** The table below records the broader feature backlog. The current [first iteration journey](../problem/first-iteration-solution.md) is the controlling scope: one file upload, a saved profile, automatic ready/held decisions, evidence-linked review, analyst-approved correction, recheck, and release. A separate entry form, simulated live feed, autonomous fixes, and an autonomy dial are later paths. Procedure links and recorded decisions are required for the supported first-iteration findings regardless of their older priorities below. Confidence percentages require validation; severity and confidence remain separate.

| # | Feature | Gap it fills | Brief req. | Judging criterion | Priority |
|---|---|---|---|---|---|
| 0 | **Automated gate**: entries arrive (from the form, or a simulated feed replaying the CSV) and the agents pass, hold, or auto-fix each one before it is written; a live view shows the stream and every decision | Open space 4, the vision itself | 1, 3, 4 | Innovation, Scalability, Functionality | Must |
| 1 | **Pre-submit review**: analyst fills an entry, clicks "Check", gets ranked issues before "Submit" is enabled | Open space 1 | 1, 4 | Functionality, Real-world impact | Must |
| 2 | **Visible agent plan**: show the agent choosing tools (range check, history lookup, duplicate search, cross-field check, pattern lookup, LLM reasoning) and what each returned | Agentic requirement, Q&A defence | 1, 2, 3 | Technical execution, Innovation | Must |
| 3 | **Evidence on every flag**, for example: "Entered 31,158; expected -57 to 25,161; last value 35,343; 3 similar entries were rejected for Range Violation" | Status quo error text says nothing useful | 2, 3, 4 | Real-world impact (trust) | Must |
| 4 | **Severity and confidence**: Critical / High / Medium / Low, plus a confidence score; low-confidence items collapsed under "worth a look" | False alarms, alert fatigue | 4 | Functionality | Must |
| 5 | **Proposed action with one-click accept**: verify, correct, attach document, or merge duplicate; a corrected value only when the evidence supports one. Dismiss button with a short reason ("value is correct", "doc attached later") | Open space 1 and 3 | 4, 5 | Real-world impact | Must |
| 6 | **Feedback that visibly changes the next result**: dismiss a flag with a reason, re-check a similar entry, the flag is down-ranked with the reason shown. Feedback adjusts ranking; it is not treated as proof that a suggestion was right or wrong | Open space 3 | 5 | Innovation | Must |
| 7 | **Linked procedure** per error type: short SOP text for each of the 7 error types, retrieved and attached to the issue | Open space 2 | 4 | Real-world impact | Should |
| 8 | **Evaluation panel**: catch rate, false alarm rate, and precision on the frozen, human-reviewed evaluation set (see the scoping doc), with real and synthetic results separate; acceptance rate from real clicks shown as an adoption signal | Open space 5, brief metrics | Eval criteria | Technical execution, Scalability | Should |
| 9 | **Batch pre-flight**: run the agent over all `Draft` entries and show a ranked queue for the reviewer | Secondary user (checker) | 1, 3 | Scalability, Impact | Should |
| 10 | **Analyst pattern hints**: "on `dividend_yield`, Stale Data is your most common rejection" | Historical patterns per person | 2 | Innovation | Could. Frame as coaching, not blame |
| 11 | **Audit trail**: every gate decision, suggestion, analyst decision, and reason stored with time | Compliance story for finance | 5 | Scalability (market-ready) | Should |
| 12 | **Autonomy dial**: per field or error type, show whether the platform handles it on its own or asks a person, based on measured precision; a confirmed decision moves the dial | Open space 4 | 5 | Innovation | Could |

### The demo story in one paragraph

Based on the journey in [problem-scoping.md](../problem/problem-scoping.md). An analyst enters a company's revenue as 100 million; the previous value was 10 million. A static range rule may pass it. Before submission, the agent shows its plan, pulls the history and supporting context, and flags the tenfold jump as **High: verify**, noting that an extra zero is one possible cause but that the increase may be legitimate. It also finds an acquisition date later than the reporting cutoff, checks the procedure, and raises that as a separate **Date Conflict** finding with the procedure linked. The analyst confirms the extra zero and corrects it, and dismisses another low-severity flag with the reason "value is correct". On the next similar entry, that flag is down-ranked and the reason is shown. Then switch to the automated view: a feed of entries flows through the gate, clean ones pass to the database, errors are held with their findings, and the analyst queue contains only the uncertain cases. The evaluation panel shows measured results on the reviewed set.

---

## 8. What we must not claim

- **Do not claim "first", "only", or market absence.** Import products document pre-submission review and agentic suggestions. Describe our particular proposed workflow and measured results; the review does not establish that no competitor offers the same combination.
- **Do not quote a catch rate we have not measured.** The sample labels are inconsistent with the columns (see [data/README.md](../../data/README.md)). Report measured numbers with the counting unit, set size, split, and method from the scoping doc, keep real and synthetic results separate, and do not call the labels synthetic as fact; say they disagree with the visible fields.
- **Do not present S&P Global as our client or sponsor.**
- **Pitch the full vision, demo only what runs.** The participant guide disqualifies "features shown that do not exist". Slides can show the whole SaaS platform; mark roadmap items as roadmap, and keep the live demo to the working proof of concept.
- **Do not compare against competitor features we have not checked.** Use only rows from the matrix above.
- **Do not repeat vendor claims as facts.** If used, say "Monte Carlo reports...".

---

## 9. Judge Q&A preparation

Answers assume the planned work is done by demo time. Drop any part that the running product cannot back up.

| Likely question | Answer |
|---|---|
| Why not just use Dataplex or Great Expectations? | They run scans on tables already in BigQuery. We check one entry before it is written, explain it to the analyst, propose the next action, and learn from the decision. We can export our learned rules to Dataplex so the warehouse gets the same protection. |
| Monte Carlo already blocks bad data with Circuit Breakers. | Circuit Breakers stop a pipeline after the data exists. They do not tell the analyst what is wrong or how to fix it. We stop the error at the person who made it, which is where rework starts. |
| Is this just rules plus an LLM? | Rules are one tool. The agent plans which checks to run for this field and entity, pulls history and similar past rejections, checks other records, then reasons over the combined evidence and ranks it. The feedback loop changes future rankings. Show the plan on screen. |
| How do you keep false alarms down? | Confidence scores, severity thresholds, low-confidence items collapsed, and analyst rejections that down-rank similar flags. We measure false alarm rate on the frozen, human-reviewed evaluation set and show it. |
| Your dataset labels look noisy. How do you know it works? | Yes, and we say so. We kept the raw CSV, built a human-reviewed evaluation set with reasons for each label, froze it before tuning, and kept its answers away from the agent. We report results on it separately from synthetic challenge cases, with set size and method. Acceptance rate tracks adoption, but acceptance alone does not prove a suggestion was correct. |
| Isn't sending financial data to an LLM a risk? | Prototype: only the single entry and its derived evidence go to the model, through the backend; keys stay server-side. Product: a private model endpoint on Vertex AI within the client's GCP project, plus redaction of identifiers. |
| What stops the agent from changing data wrongly? | The client decides which actions run automatically. By default the platform passes or holds; auto-fix is switched on per error type only after its precision is proven. Every decision is logged and reversible, and uncertain cases always go to a person. |
| Why would a bank trust an automated gate? | It earns autonomy the same way a new analyst does: starts supervised, takes over the slices where it has proven accurate, and keeps a full audit trail. The client can see the measured precision behind every automated decision. |
| How does it scale? | The stack is still under discussion. This document proposes Cloud Run, BigQuery, and Firestore as options, not selected components. Show latency and concurrency results only after measuring the chosen implementation. |
| Who pays? | Data providers, banks, and back-office teams with manual entry and maker-checker review. Saving is fewer rejections, less rework, fewer second-person reviews. Pricing hypothesis: per analyst seat or per thousand checks. |

---

## 10. Path from proof of concept to platform

1. **First proof of concept:** upload a draft file, confirm and save a profile, run checks, hold a supported mistake, review and approve its correction, recheck, and release the batch to the accepted destination. Record a bounded feedback effect, deploy on GCP, and report measured evaluation results. Autonomous fixes and separate input paths are later scope.
2. **MVP:** multi-tenant SaaS. Connectors for entry forms, file imports, and API feeds placed in front of the client database; setup wizard that loads history, rules, and procedures; per-client learning from history and decisions in BigQuery and Firestore; autonomy dial per field and error type.
3. **Platform:** the QA layer for every write into the client's data estate. Self-tuning thresholds, cross-client pattern models (privacy-preserving) so new clients start smarter, export of learned rules to Dataplex and other DQ tools, compliance-grade audit trail, private model hosting per client.

---

## Sources

**Problem and impact**
- Barchard, K. A., & Pace, L. A. (2011). Preventing human error: The impact of data entry methods on data accuracy and statistical results. *Computers in Human Behavior, 27*(5), 1834–1839. https://doi.org/10.1016/j.chb.2011.04.004
- [UNLV Interpersonal Research Lab, "Data Checking" newsletter](https://img.faculty.unlv.edu/lab/newsletter/issue3/data-checking/)
- [Gartner, Data Quality topic page](https://www.gartner.com/en/data-analytics/topics/data-quality)
- [S&P Global Market Intelligence, Quality Program snapshot (2021)](https://www.spglobal.com/marketintelligence/en/documents/234057_quality-program-snapshot_a4_digital.pdf)
- [BIIA, S&P Global Quality Program launch (2017)](https://www.biia.com/sp-global-market-intelligence-rolls-out-quality-program-for-capital-iq-and-snl-platforms)

**Competitors**
- [Monte Carlo, Circuit Breakers](https://montecarlo.ai/blog-announcing-circuit-breakers-a-new-way-to-automatically-stop-broken-data-pipelines-and-avoid-backfilling-costs)
- [Monte Carlo, Observability Agents](https://montecarlo.ai/blog-monte-carlo-observability-agents)
- [Anomalo, product overview](https://www.anomalo.com/product-overview/)
- [Acceldata, Data Quality Agent](https://www.acceldata.io/agentic-data-management/use-cases/data-quality-agent)
- [Sifflet, "5 Best Bigeye Alternatives" (vendor-written)](https://www.siffletdata.com/blog/bigeye-alternatives)
- [TechCrunch, Datadog acquires Metaplane (2025)](https://techcrunch.com/2025/04/23/datadog-acquires-ai-powered-observability-startup-metaplane)
- [Informatica, CLAIRE Agents announcement (2025)](https://www.businesswire.com/news/home/20250514956132/en/Informatica-Unveils-Agentic-AI-Offerings-on-Its-AI-Powered-Cloud-Data-Management-Platform)
- [Ataccama, Agentic data trust platform (2025)](https://www.globenewswire.com/news-release/2025/11/06/3182705/0/en/Ataccama-launches-Agentic-data-trust-platform-powered-by-an-autonomous-AI-agent-that-delivers-AI-ready-data-83-faster.html)
- [Ataccama, current AI Agent documentation and approval controls](https://docs.ataccama.com/ataccama-one-agentic/latest/gen-ai/ai-agent.html)
- [Collibra Data Quality, Behaviors](https://productresources.collibra.com/docs/collibra/latest/Content/DataQuality/DQCoreComponents/co_behavior.htm)
- [SiliconANGLE, Qualytics Series A (2025)](https://siliconangle.com/2025/06/23/qualytics-gets-10m-use-ai-monitor-data-ai/)
- [Soda, Automate anomaly detection](https://docs.soda.io/soda/quick-start-automate.html)
- [Great Expectations, ExpectAI (2025)](https://greatexpectations.io/blog/gx-expectAI/)
- [Google Cloud, Dataplex auto data quality](https://docs.cloud.google.com/dataplex/docs/use-auto-data-quality)
- [Google Codelab, Programmatic Data Quality with Dataplex and Generative AI](https://codelabs.developers.google.com/programmatic-dq)
- [Flatfile, Importing data overview](https://support.flatfile.com/articles/7763163677-importing-data-with-flatfile-overview)
- [Flatfile, Analyze and Suggestions](https://support.flatfile.com/articles/7462518044-How%20to%20use%20Analyze%20and%20Suggestions%C2%A0in%20Flatfile)
- [Flatfile, Mapping history and accuracy](https://support.flatfile.com/articles/8421984657-how-does-flatfile-ensure-mapping-is-as-accurate-as-possible)
- [OneSchema, Advanced CSV import features](https://www.oneschema.co/blog/advanced-csv-import-features)
