# Platform integration handoff

20 October 2026. The first end-to-end console journey is deployed and ready for a user test.

## Where to test

- Main console: https://ps08-quality-agent-447065735152.asia-south1.run.app/
- Existing fallback review desk: https://ps08-quality-agent-447065735152.asia-south1.run.app/fallback
- API reference: https://ps08-quality-agent-447065735152.asia-south1.run.app/docs
- GCP: project `ps08-quality-agent-20261020-ib`, region `asia-south1`, Cloud Run service `ps08-quality-agent`, verified revision `ps08-quality-agent-00008-j6v`.

The console and fallback use the same backend. The console calls same-origin `/api/*`; the Gemini key stays in GCP Secret Manager. The service is public for the hackathon demo, as authorized by the team.

## Suggested end-to-end test

1. Open the main console and create a new job. Upload [`data/demo-review.csv`](../data/demo-review.csv). This is a **synthetic demonstration file**, not an accuracy benchmark. The provided 300-row problem dataset is [`data/ps08_data_entries.csv`](../data/ps08_data_entries.csv) and is better for a broad review, but its many holds make a quick release demonstration less convenient.
2. Check that inspection reports 2 rows and 7 columns. Review the suggested profile; keep the recommended checks and select **Launch ninjas**. Planning and investigation may take several seconds. The displayed activity shows actual tool calls.
3. Review the confirmed `range_violation` on row 1: value `110` exceeds the `0–100` range. Open its procedure. Release must be held at this point.
4. Choose **Correct value**, enter `90`, add a reason such as “Checked synthetic source value,” and accept the correction. The job advances to version 2 and the checks rerun. The hold should clear.
5. Release the reviewed batch. Confirm that a receipt for 2 accepted rows appears, then use **Download reviewed data**. A page reload should still show the saved job and receipt.

The product also supports saved profiles and optional historical references. Those are not needed for this test. The `/login` route is currently a console route, not an authentication barrier; use synthetic or otherwise non-sensitive data in the public demo.

## What was verified

- The production console, deep links, assets, widget, configuration, fallback, API health, and API docs load from one Cloud Run origin.
- Inspector's six backend contract tests all passed on the deployed service: held release, stale version, repeat submission, upload size, unknown ID, and refusal to waive a confirmed required violation.
- A live browser run of the synthetic file completed upload, inspection, Gemini-assisted planning, profile approval, Gemini-assisted investigation, held finding, correction, recheck, release, and receipt. The accepted record was `a76f60e4c5244cf98e402a3aa1db6a02-2` for two rows.
- Local backend journey tests passed (2/2). The platform TypeScript check and production build passed. See [`frontend/VERIFICATION.md`](../frontend/VERIFICATION.md) for detailed results.

## Current limits

- The provided dataset's labels are provisional and internally inconsistent; the app does not claim measured precision, recall, or F1 from them.
- Statistical and ML checks report `ineligible` when there are too few comparable values or `not_selected` when they were not chosen. These statuses are shown as such, not as successful predictions.
- After a correction, deterministic and selected checks rerun, but the investigation agent's text is marked “not rerun after an edit.” The refreshed findings and release gate govern the decision.
- The first iteration accepts CSV files up to 10 MB and 10,000 rows. Authentication and tenant isolation are not implemented for this public demo.

## Ownership and next step

The user can now run one independent end-to-end test using the steps above. Record any issue with the job ID, step, expected result, and observed result so the team can reproduce it. Keep changes small during finalization; the current deployed revision is the known working baseline.
