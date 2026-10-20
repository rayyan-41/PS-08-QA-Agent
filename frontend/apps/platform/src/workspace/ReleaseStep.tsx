import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, ShieldCheck } from '@pokayoke/ui';
import type { Draft, Receipt, Review } from '@pokayoke/api-client';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { isApiError, isNoResponse, isStatus } from '../api/errors';
import { Empty, ErrorPanel } from '../components/states';
import { formatTime } from '../lib/format';
import { readJson, writeJson } from '../lib/storage';

const receiptKey = (target: string, draftId: string) => `pokayoke.receipt:${target}:${draftId}`;

/** Phase 6: submit the exact reviewed version through the backend's gate. */
export function ReleaseStep({
  draft,
  review,
  onReload,
}: {
  draft: Draft;
  review: Review | null;
  onReload: () => void;
}) {
  const { backend, target } = useBackend();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | undefined>(() =>
    readJson<Receipt | undefined>(receiptKey(target, draft.id), undefined),
  );

  const submit = useMutation({
    mutationFn: () => backend.submit(draft.id),
    onSuccess: (receipt) => {
      writeJson(receiptKey(target, draft.id), receipt);
      setSavedReceipt(receipt);
      setConfirming(false);
      void queryClient.invalidateQueries({ queryKey: keys.draft(target, draft.id) });
    },
    onError: (error) => {
      // Outcome unknown: refresh state before offering a retry (the route is idempotent).
      if (isNoResponse(error)) onReload();
    },
  });

  if (!review) {
    return (
      <Empty title="Nothing to release yet">
        <p>A review must run before release.</p>
      </Empty>
    );
  }

  const receipt =
    submit.data ?? (savedReceipt?.version === draft.version ? savedReceipt : undefined);
  if (receipt) return <ReceiptView receipt={receipt} />;

  const held = review.findings.filter((f) => f.hold);
  const heldRows = new Set(held.map((f) => f.row));
  const rowCount = draft.inspection?.row_count;

  return (
    <div className="stack-lg">
      <section className="panel stack" aria-labelledby="gate-heading">
        <h2 id="gate-heading" className="h2">
          Gate summary
        </h2>
        <dl className="facts facts--inline">
          <dt>Job version</dt>
          <dd className="mono">{draft.version}</dd>
          <dt>Review for version</dt>
          <dd className="mono">{review.draft_version}</dd>
          <dt>Rows</dt>
          <dd className="mono">{rowCount ?? 'unknown'}</dd>
          <dt>Findings holding release</dt>
          <dd className="mono text-hold">{review.holds}</dd>
          <dt>Rows with a hold</dt>
          <dd className="mono">{heldRows.size}</dd>
        </dl>
        <p className="muted">
          The whole reviewed batch is released or none of it is. The backend enforces the gate;
          while any finding holds release it refuses the submission.
        </p>
      </section>

      {held.length > 0 ? (
        <section className="stack">
          <h2 className="h3">Holding release</h2>
          <ul className="list">
            {held.map((finding) => (
              <li key={finding.id}>
                <span className="mono">Row {finding.row}</span> ·{' '}
                <span className="mono">{finding.field}</span> · <code>{finding.code}</code> —{' '}
                {finding.action}
              </li>
            ))}
          </ul>
          <p>
            <Link to="../review" relative="path">
              Resolve these findings
            </Link>
          </p>
        </section>
      ) : null}

      {submit.error ? (
        isStatus(submit.error, 409) && isApiError(submit.error) ? (
          <div className="state state--error" role="alert">
            <div>
              <p className="state__title">The gate blocked this release</p>
              <p className="state__detail">{submit.error.detail}</p>
              <p className="state__route mono">POST /api/drafts/{draft.id}/submit → HTTP 409</p>
            </div>
          </div>
        ) : isNoResponse(submit.error) ? (
          <div className="state state--warn" role="alert">
            <div>
              <p className="state__title">The release outcome is not known</p>
              <p className="state__detail">
                No response arrived, so the batch may or may not have been accepted. The job has
                been re-checked. Submitting again is safe: the backend returns the same receipt if
                it was already accepted.
              </p>
              <button type="button" className="btn btn--secondary" onClick={() => submit.mutate()}>
                Check and retry release
              </button>
            </div>
          </div>
        ) : (
          <ErrorPanel error={submit.error} onRetry={() => submit.mutate()} />
        )
      ) : null}

      {confirming ? (
        <div className="panel panel--feature stack" role="dialog" aria-labelledby="confirm-heading">
          <h2 id="confirm-heading" className="h3">
            Release job version {draft.version}?
          </h2>
          <p>
            This writes {rowCount ?? 'all'} reviewed rows as one accepted batch.
            {review.holds > 0
              ? ` ${review.holds} finding${review.holds === 1 ? '' : 's'} still hold release, so the backend is expected to refuse.`
              : ''}
          </p>
          <div className="row">
            <button
              type="button"
              className="btn btn--primary"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
            >
              <ShieldCheck aria-hidden size={16} />
              {submit.isPending ? 'Releasing…' : 'Release reviewed batch'}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          <button
            type="button"
            className="btn btn--primary btn--large"
            onClick={() => setConfirming(true)}
          >
            <ShieldCheck aria-hidden size={16} /> Release reviewed batch
          </button>
        </div>
      )}
    </div>
  );
}

function ReceiptView({ receipt }: { receipt: Receipt }) {
  const { backend, target } = useBackend();
  // Confirm the committed acceptance record exists (GET /api/accepted/{receipt}).
  const committed = useQuery({
    queryKey: keys.receipt(target, receipt.id),
    queryFn: () => backend.accepted(receipt.id),
    retry: false,
  });
  return (
    <section className="panel panel--feature stack" aria-labelledby="receipt-heading">
      <h2 id="receipt-heading" className="h2">
        Batch released
      </h2>
      <dl className="facts">
        <dt>Receipt ID</dt>
        <dd className="mono">{receipt.id}</dd>
        <dt>Job version</dt>
        <dd className="mono">{receipt.version}</dd>
        <dt>Profile</dt>
        <dd className="mono">{receipt.profile_id}</dd>
        <dt>Review</dt>
        <dd className="mono">{receipt.review_id}</dd>
        <dt>Rows accepted</dt>
        <dd className="mono">{receipt.row_count}</dd>
        <dt>Digest</dt>
        <dd className="mono small">{receipt.digest}</dd>
        <dt>Accepted at</dt>
        <dd>{formatTime(receipt.accepted_at)}</dd>
        <dt>Acceptance record</dt>
        <dd>
          {committed.isPending ? (
            'Checking…'
          ) : committed.error ? (
            <ErrorPanel error={committed.error} onRetry={() => void committed.refetch()} />
          ) : (
            <span className="chip chip--pass">Committed (GET /api/accepted/{receipt.id})</span>
          )}
        </dd>
      </dl>
      <div className="row">
        <a className="btn btn--primary" href={backend.downloadUrl(receipt.id)}>
          <Download aria-hidden size={16} /> Download reviewed data
        </a>
      </div>
    </section>
  );
}
