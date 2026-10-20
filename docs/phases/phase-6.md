# Phase 6: Release and Record

**Status:** First-iteration design using the agreed whole-batch journey and existing storage services. Concrete routes and storage schemas are implementation work.

## Responsibility and inputs

Publish the exact reviewed batch to the accepted destination only after its configured holding conditions are resolved. Inputs are the draft/version, profile/version, latest complete review, decisions, and explicit analyst submission action.

The first journey releases the whole reviewed batch. Partial release and external customer-database connectors are later paths. A draft uploaded to staging is not an accepted batch.

## Technology and model scope

Use Python/FastAPI for release validation and orchestration, Firestore for authoritative acceptance records, and Cloud Storage for the immutable accepted data snapshot. This reuses the chosen services rather than adding a relational database solely for the demonstration.

No new ML prediction, model training, or LLM approval is required for release. Code enforces the approved gate. Reuse stored, version-matched analytical evidence; if the draft or plan changed, require the affected review to complete first.

## Submission gate

The backend verifies:

- The request refers to the current reviewed draft and approved profile versions.
- All required checks have current outcomes, and no unresolved holding condition remains.
- Required analyst decisions and supporting evidence are recorded according to the profile.
- The accepted payload is the exact reviewed content, identified by its immutable reference and content digest.

An advisory does not become a hold at submission merely because a model might phrase it differently. An unresolved required check does not become a pass because the frontend enables its button. The backend remains authoritative.

## Durable publication and retries

1. Prepare and store an immutable snapshot of the reviewed data in Cloud Storage with a versioned object reference and integrity information.
2. Use a Firestore transaction to recheck authoritative draft/review state and publish one acceptance record for that draft version, linked to the snapshot, profile, review, decisions, row count, and submission time.
3. Return a durable receipt only after the acceptance transaction succeeds. A repeated submission for the same accepted draft version returns the existing receipt rather than creating another accepted batch.

Cloud Storage and Firestore do not form one cross-service transaction. Uploading a candidate snapshot does not publish acceptance: the committed Firestore acceptance record is the visibility boundary. A failure before that commit leaves the candidate unaccepted and retryable. Do not put file uploads or other external side effects inside a Firestore transaction callback, which can be retried.

Use object-generation preconditions or an equivalent immutable-object strategy to prevent a reference from silently changing its content. All release and edit paths must participate in draft-version concurrency control. Verify simultaneous edit/submit and repeated-submit behavior.

This establishes idempotent acceptance of one reviewed batch. It does not claim universal exactly-once delivery to arbitrary external client databases.

## What the accepted destination contains

The prototype's accepted destination consists of an authoritative Firestore accepted-batch record and its immutable Cloud Storage data payload. Draft metadata and candidate files are separate from published accepted batches. Downstream reads must begin with committed acceptance records, not merely list uploaded files.

The database stores acceptance metadata and references; the bulk reviewed rows live in the accepted snapshot. Queryable per-row materialization or writing to a client's existing database is separate integration work, not a feature to imply in the first demonstration.

## Analyst outcome

Show submission confirmation, accepted row count, draft/profile/review versions, time, and a receipt identifier. Provide the reviewed data download and access to the change/decision history. A timeout must show recoverable status rather than invite a duplicate submission with a false failure claim.

Demonstrate the gate by showing that a held batch is absent from the accepted destination, then correcting and rechecking it, submitting, and retrieving its committed acceptance record and reviewed payload. An export alone is not the gate demonstration.

## Verification

Verify rejection of held/incomplete/stale drafts, successful release of a ready batch, content/version consistency, repeat-request idempotency, edit/submit races, and recovery when an upload succeeds but acceptance fails. Record measured outcomes; do not claim these protections before they run.

## Related documents

- [Phase overview](../phases.md)
- [Review and resolve](phase-5.md)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Cloud Storage request preconditions](https://docs.cloud.google.com/storage/docs/request-preconditions)
