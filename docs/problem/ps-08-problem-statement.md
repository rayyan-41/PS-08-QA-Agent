# PROBLEM STATEMENT PS-08

## Predictive Data Quality & Error Prevention Agent

**Difficulty:** Hard    |    **Category:** Data Quality / QA Automation

### The Problem

Data analysts manually enter and process thousands of records. Human errors — range violations, logical inconsistencies, missing supporting documents, duplicate entries, conflicting dates — slip through existing validation checks. These errors cause rework, escalations, SLA misses, and quality score degradation. Current checks are rule-based and do not adapt to new error patterns.

### Your Challenge

Build a predictive QA agent that reviews data entries before submission, catching errors that static rules miss. The agent should use historical error patterns, cross-field logic, and anomaly detection to flag potential issues, suggest corrections, and provide severity-ranked feedback to the analyst — functioning like a "spell-check for data."

### Technical Requirements

- Pre-submission validation using LLM reasoning over data context
- Historical error pattern analysis to predict likely mistakes
- Cross-field and cross-record consistency checking
- Severity-ranked issue list with suggested corrections and linked procedures
- Feedback loop: analyst decisions on suggestions improve future predictions

### Suggested GCP Tech Stack

Vertex AI (Gemini), BigQuery ML, Cloud Run, Firestore, Cloud Tasks

### Sample Dataset

ps08_data_entries.csv — 300 data entries with error types, rejection reasons, and historical values

### Evaluation Criteria

Error catch rate (% of errors detected pre-submission), false alarm rate, analyst trust/adoption metric
