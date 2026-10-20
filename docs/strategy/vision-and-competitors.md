# Vision and Competitor Landscape

Where PS-08 fits in the market, what already exists, where the open space is, and what we build to stand out. Read with [problem-scoping.md](../problem/problem-scoping.md), which defines the user journey, metric definitions, and evaluation process; where the two differ, the scoping doc wins. Every factual claim about a company links to a source in the [Sources](#sources) list. Vendor figures (acceptance rates, "X% faster") are the vendor's own claims with no published method; quote them as such or not at all.

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

**Stop bad data at the moment an analyst types it, and explain why, before it is submitted.**

Almost every data quality product on the market watches tables and pipelines and alerts a data engineer after something lands. Our agent works one step earlier, at the entry form. It reviews each entry against the analyst's history, related fields, related records, and the organization's procedures, then returns a short, severity-ranked list of likely problems. Each finding has its evidence, a severity, a proposed action, and the procedure to follow. The analyst decides, and every decision teaches the agent. A spell-check for data.

### Who it is for

An analyst at a financial data provider entering company figures by hand. The sample dataset matches this: `revenue_ttm`, `net_income`, `eps`, `market_cap`, `total_assets`, `operating_margin`, `debt_equity_ratio`, `dividend_yield`, `acquisition_date`, `completion_status`, across a set of companies, with a Draft, Submitted, Approved, Rejected workflow.

Secondary user: the **QA reviewer or team lead** who today checks analysts' work by hand (the "checker" in a maker-checker process) and owns the error and SLA numbers.

### Product principles

- **Prevent, then explain.** Catch the issue before submission and say why, in the analyst's terms.
- **Suggest, do not silently change.** The agent proposes; the analyst accepts or rejects. An unexplained automatic edit to a financial figure is itself a quality risk, and the brief scores analyst trust.
- **Show the evidence.** Every flag points to what triggered it: a range, a past value, a related field, a similar past rejection, a duplicate record.
- **Learn from the analyst.** Accept and reject decisions change future predictions (brief requirement 5).
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
- An "autonomous data worker" agent that profiles data, creates and applies quality rules in bulk, detects duplicates and inconsistencies, and "doesn't just find problems; it acts on them". Steps are documented for review; no formal approval step is described. Vendor claim: AI-ready data "83% faster", no method published ([source](https://www.globenewswire.com/news-release/2025/11/06/3182705/0/en/Ataccama-launches-Agentic-data-trust-platform-powered-by-an-autonomous-AI-agent-that-delivers-AI-ready-data-83-faster.html)).
- **Gap for us:** acts autonomously on data at rest. Our stance is the opposite for financial entries: suggest, explain, let the analyst decide.

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
- ML column mapping trained on over 1.8 billion rows (vendor claim: predicts over 90% of mappings). A final review step shows the data in the target format **before the import completes**: yellow cells are warnings, red cells are errors that must be fixed, hover shows the message. Fixes are manual (cell edits, bulk find-and-replace) ([source](https://support.flatfile.com/articles/7763163677-importing-data-with-flatfile-overview)).

**OneSchema**
- Automatic format conversion (dates, numbers, country codes, phone numbers), format inference, inline correction with bulk find-and-replace and undo ([source](https://www.oneschema.co/blog/advanced-csv-import-features)).

**Gap for us:** these prove that **pre-submission review in the UI** is a pattern users already accept. But they check against a static destination schema. They do not use history, cross-record logic, error patterns, or learn from the user's decisions.

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
| Proposes an action or corrected value to the user | ✗ | ✗ | ✗ | ✗ | ◐ acts itself | ✗ | ✗ | ✗ | ◐ auto-formats | **✓** |
| Links to the procedure to follow | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| Uses history | ✗ | ◐ metric baselines | ◐ table ML | ✓ | ? | ✓ behavior model | ◐ profile | ◐ | ◐ mapping history | **✓ error patterns** |
| Cross-field logic | ◐ hand-coded | ? | ? | ? | ✓ inconsistencies | ? | ✓ SQL rules | ? | ◐ schema | **✓** |
| Cross-record checks (duplicates, conflicts) | ✗ | ? | ? | ✓ duplicates | ✓ duplicates | ? | ✓ uniqueness | ? | ? | **✓** |
| Ranks issues by importance | ✗ | ✓ alerts | ? | ? | ? | ? | ✗ | ? | ◐ warning / error | **✓ severity + confidence** |
| Learns from user decisions | ✗ | ◐ accepted monitors | ? | ◐ approvals | ✗ | ✓ pass / suppress | ✗ | ◐ survey | ◐ mapping choices | **✓ per entry** |
| AI agents | ✗ | ✓ | ✓ | ✓ | ✓ | ? | ◐ via Antigravity codelab | ◐ ExpectAI | ✗ | **✓** |
| Data changed only with human approval | n/a | ✓ read-only | ? | ✓ | ✗ not described | n/a | n/a | n/a | ◐ auto-formats | **✓** |

**Reading the matrix:** the top four rows are empty for everyone except the static status quo and import tools. That row block is our position.

---

## 6. The open space

1. **No one coaches the person entering the data.** Observability and governance tools serve engineers and stewards after the fact. Import tools serve the uploader but only against a fixed schema.
2. **No one links an issue to the procedure.** The brief asks for "linked procedures". None of the tools above document this.
3. **Feedback loops exist, but at the wrong grain.** Collibra, Metaplane, and GX learn from engineers' responses to table-level alerts. Nobody learns from an analyst's accept or dismiss decision, with a reason, on a single finding.
4. **Autonomy is the industry trend, and it is the wrong default for financial entries.** Ataccama and Acceldata emphasize agents that act. For figures that feed ratings and prices, an agent that changes values silently creates a new risk. "Agent investigates, human decides, agent learns" is a defensible differentiator, and it matches the brief's trust metric.
5. **Vendor metrics are unaudited.** "83% faster", "80% faster", "60% acceptance" come with no method. An honest evaluation panel (catch rate, false alarm rate, precision, set size, method, and real vs synthetic results shown separately) stands out in front of technical judges.

---

## 7. How we stand out: features mapped to gaps

Ordered by value for the demo. **Must** = needed for the core journey. **Should** = strong differentiator if time allows. **Could** = only if everything else works.

| # | Feature | Gap it fills | Brief req. | Judging criterion | Priority |
|---|---|---|---|---|---|
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
| 11 | **Audit trail**: every suggestion, decision, and reason stored with time and analyst | Compliance story for finance | 5 | Scalability (market-ready) | Could |

### The demo story in one paragraph

Based on the journey in [problem-scoping.md](../problem/problem-scoping.md). An analyst enters a company's revenue as 100 million; the previous value was 10 million. A static range rule may pass it. Before submission, the agent shows its plan, pulls the history and supporting context, and flags the tenfold jump as **High: verify**, noting that an extra zero is one possible cause but that the increase may be legitimate. It also finds an acquisition date later than the reporting cutoff, checks the procedure, and raises that as a separate **Date Conflict** finding with the procedure linked. The analyst confirms the extra zero and corrects it, and dismisses another low-severity flag with the reason "value is correct". On the next similar entry, that flag is down-ranked and the reason is shown. The evaluation panel shows measured results on the reviewed set.

---

## 8. What we must not claim

- **Do not claim "first" or "only".** We found no entry-time analyst-facing competitor; that does not prove there is none. Say "we found no tool that does this at the point of entry".
- **Do not quote a catch rate we have not measured.** The sample labels are inconsistent with the columns (see [data/README.md](../../data/README.md)). Report measured numbers with the counting unit, set size, split, and method from the scoping doc, keep real and synthetic results separate, and do not call the labels synthetic as fact; say they disagree with the visible fields.
- **Do not present S&P Global as our client or sponsor.**
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
| What stops the agent from changing data wrongly? | It never writes. It suggests; the analyst accepts. Every decision is logged. |
| How does it scale? | Stateless check service on Cloud Run, history and patterns in BigQuery, feedback in Firestore. Show measured latency and concurrency results if we have them; otherwise state the plan as a plan. |
| Who pays? | Data providers, banks, and back-office teams with manual entry and maker-checker review. Saving is fewer rejections, less rework, fewer second-person reviews. Pricing hypothesis: per analyst seat or per thousand checks. |

---

## 10. Path from prototype to product

This is a plan, not a description of the prototype.

1. **Prototype (event day):** web UI over the sample dataset; agent reviews an entry, returns ranked findings with evidence, proposed actions, and procedures; analyst decisions recorded and used; deployed on GCP; evaluation panel with measured numbers on the reviewed set.
2. **MVP:** check API and an embeddable widget for existing entry forms; history and error patterns in BigQuery; feedback in Firestore; scheduled re-learning from decisions; per-client procedure library; batch pre-flight for reviewers.
3. **Market-ready:** connectors for common entry and data management tools; export learned rules to Dataplex and other DQ tools; per-team dashboards (catch rate, false alarm rate, acceptance rate, time saved); full audit trail for compliance review; private model hosting per client.

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
- [Collibra Data Quality, Behaviors](https://productresources.collibra.com/docs/collibra/latest/Content/DataQuality/DQCoreComponents/co_behavior.htm)
- [SiliconANGLE, Qualytics Series A (2025)](https://siliconangle.com/2025/06/23/qualytics-gets-10m-use-ai-monitor-data-ai/)
- [Soda, Automate anomaly detection](https://docs.soda.io/soda/quick-start-automate.html)
- [Great Expectations, ExpectAI (2025)](https://greatexpectations.io/blog/gx-expectAI/)
- [Google Cloud, Dataplex auto data quality](https://docs.cloud.google.com/dataplex/docs/use-auto-data-quality)
- [Google Codelab, Programmatic Data Quality with Dataplex and Generative AI](https://codelabs.developers.google.com/programmatic-dq)
- [Flatfile, Importing data overview](https://support.flatfile.com/articles/7763163677-importing-data-with-flatfile-overview)
- [OneSchema, Advanced CSV import features](https://www.oneschema.co/blog/advanced-csv-import-features)
