# Vision and Competitor Landscape

Working notes on where PS-08 fits in the market and how we position it. Started from a competitor analysis done with Gemini, then checked against sources. Claims that have been checked link to a source; claims that have not are marked **(unverified)**. Do not put an unverified claim on a slide.

## Vision

**Stop bad data at the moment an analyst types it, not after it lands in a table.**

Existing data observability tools watch tables and pipelines and alert when something looks off. Our agent sits one step earlier: at the data entry form, before the analyst presses submit. It reviews each entry against history, related fields, and other records, then gives the analyst a severity-ranked list of likely problems, each with a suggested fix and the procedure to follow. The analyst decides, and every decision teaches the agent. A spell-check for data.

### Who it is for

An analyst at a financial data provider entering company figures by hand. The sample dataset matches this: fields such as `revenue_ttm`, `net_income`, `eps`, `market_cap`, `debt_equity_ratio`, and `dividend_yield` across a set of companies, with a Draft, Submitted, Approved, Rejected workflow.

### Product principles

- **Prevent, then explain.** Catch the issue before submission and say why it was flagged, in the analyst's terms.
- **Suggest, do not silently change.** The agent proposes corrections; the analyst accepts or rejects. In financial data, an unexplained automatic edit is itself a quality risk, and the brief scores analyst trust and adoption.
- **Learn from the analyst.** Accept and reject decisions feed back into future predictions (brief requirement 5).
- **Low false alarms.** A checker that cries wolf gets ignored. False alarm rate is one of the three problem metrics.

## Why the problem matters: S&P Global as the reference case

S&P Global Market Intelligence (Capital IQ, SNL) is a clear real-world example of the cost of data errors, and a useful anchor for the pitch. The problem brief does not name a sponsor, so present this as an industry example, not as the client.

| Fact | Source |
|---|---|
| Runs **over 155,000 automated data quality checks** and collects billions of data points a year | [S&P Global Quality Program snapshot (2021)](https://www.spglobal.com/marketintelligence/en/documents/234057_quality-program-snapshot_a4_digital.pdf) |
| Pays clients a **$50 reward** (gift card or charity donation) for each data quality issue it validates | Same snapshot; also the [2017 launch announcement](https://www.biia.com/sp-global-market-intelligence-rolls-out-quality-program-for-capital-iq-and-snl-platforms) |
| The program launched in 2017 with over 145,000 checks | [2017 launch announcement](https://www.biia.com/sp-global-market-intelligence-rolls-out-quality-program-for-capital-iq-and-snl-platforms) |

The Gemini notes said 170,000 checks. The latest figure found in S&P's own material is 155,000 (2021). Use "over 155,000" unless a newer official source turns up.

**The pitch argument:** a company running more than 155,000 automated checks still pays customers to report the errors those checks missed. Rule-based checks miss context-based mistakes. That gap is what PS-08 targets.

General impact of a bad financial figure (mispriced assets, regulatory exposure, reputational damage) is a reasonable argument, but it has no specific source yet. Phrase it as a risk, not as a statistic.

## Competitor landscape

These tools work at the **table and pipeline layer**. None of them, as far as we found, sits at the point of manual entry and coaches the person entering data.

| Competitor | Focus | How they handle "predictive" quality | Gap we target |
|---|---|---|---|
| **Monte Carlo** | Data observability with lineage | ML monitors on freshness, volume, and schema changes. **Circuit Breakers** (2022) halt a pipeline job when a quality check fails, so bad data does not reach downstream tables and dashboards ([Monte Carlo](https://montecarlo.ai/blog-announcing-circuit-breakers-a-new-way-to-automatically-stop-broken-data-pipelines-and-avoid-backfilling-costs)) | Prevention happens at the pipeline, after entry. It does not explain an issue to the analyst or suggest the correct value |
| **Anomalo** | ML-driven data quality on tables | Unsupervised ML on table contents to find subtle missing or changed values **(unverified)** | Works on data at rest after it is stored **(unverified)** |
| **Acceldata** | Full-stack observability: data, pipelines, compute | Uses pipeline and system metrics to predict failures and SLA breaches **(unverified)** | Heavy setup and infrastructure integration; focused on systems, not entry-level correction **(unverified)** |
| **Soda** | Data validation as code (SodaCL), Soda Cloud | Checks written in SodaCL run in pipelines and CI/CD. Soda Cloud also has **ML anomaly detection** that learns patterns over about five days, without hand-written rules ([Soda docs](https://docs.soda.io/soda/quick-start-automate.html)) | Detects anomalies in datasets, not in a single entry as it is typed; no analyst-facing correction loop |

### Corrections to the Gemini notes

- Gemini said Monte Carlo "lacks preventive pipeline intervention". This is wrong: Circuit Breakers do exactly that. Our difference is the layer (entry form vs pipeline) and the analyst-facing explanation and fix, not prevention by itself.
- Gemini said Soda needs manual rules and has low autonomy. Partly out of date: Soda Cloud has ML anomaly detection. Its rule-as-code core still needs people to write checks.
- Gemini framed our differentiator as pipeline work ("predicted schema drift, quarantined the stream, auto-generated a patch"). That describes a pipeline tool and is not what PS-08 asks for. The brief is about **analyst entries before submission**, so keep the story at that level.

## Our differentiator, in one line

> Observability tools tell the data team a table went wrong. Our agent tells the analyst, before they submit, what is likely wrong with this entry, how serious it is, how to fix it, and it gets better every time the analyst answers.

| | Observability tools | PS-08 agent |
|---|---|---|
| When | After data lands, or at pipeline run time | Before the analyst submits |
| Unit | Table, column, pipeline | Single entry, with its related fields and records |
| Audience | Data engineers | The analyst entering the data |
| Output | Alert, incident, halted job | Severity-ranked issues, suggested correction, linked procedure |
| Learning | Baselines from data statistics | Historical error patterns plus analyst accept/reject feedback |

## Path from prototype to product

The judges score scalability as a path from prototype to MVP to market. This is the plan, not a claim about what the prototype does.

1. **Prototype (event day):** the agent reviews entries from the sample dataset through a web UI, returns ranked issues with fixes, and records analyst decisions. Deployed on GCP.
2. **MVP:** an API and embeddable widget that plugs into an existing entry form. History in BigQuery, feedback in Firestore, model retraining on the feedback. Per-client procedure library for the "linked procedures".
3. **Market-ready:** integrations with common data entry and data management tools, per-team dashboards for catch rate and false alarm rate, audit trail of every suggestion and decision for compliance review.

## Sources

- [S&P Global Market Intelligence, Quality Program snapshot (2021)](https://www.spglobal.com/marketintelligence/en/documents/234057_quality-program-snapshot_a4_digital.pdf)
- [BIIA, "S&P Global Market Intelligence Rolls Out Quality Program for Capital IQ and SNL Platforms" (2017)](https://www.biia.com/sp-global-market-intelligence-rolls-out-quality-program-for-capital-iq-and-snl-platforms)
- [Monte Carlo, "Announcing Circuit Breakers"](https://montecarlo.ai/blog-announcing-circuit-breakers-a-new-way-to-automatically-stop-broken-data-pipelines-and-avoid-backfilling-costs)
- [Soda docs, "Automate anomaly detection"](https://docs.soda.io/soda/quick-start-automate.html)
