import { useId, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, X } from '@pokayoke/ui';
import type { DecisionKind, Draft, DraftReviewed, Finding, Review } from '@pokayoke/api-client';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { Empty, ErrorPanel } from '../components/states';

interface PendingChange {
  findingId: string;
  row: number;
  field: string;
  value: string;
  before?: string | null;
}

/** Phase 5: resolve findings with corrections and decisions. */
export function ReviewStep({
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
  const [pending, setPending] = useState<PendingChange[]>([]);
  const [reason, setReason] = useState('');
  const reasonId = useId();

  const applyResult = (result: DraftReviewed) => {
    queryClient.setQueryData(keys.review(target, draft.id), result.review);
    void queryClient.invalidateQueries({ queryKey: keys.draft(target, draft.id) });
  };

  const correct = useMutation({
    mutationFn: () =>
      backend.correct(draft.id, {
        draft_version: draft.version,
        changes: pending.map(({ row, field, value }) => ({ row, field, value })),
        reason: reason.trim(),
      }),
    onSuccess: (result) => {
      applyResult(result);
      setPending([]);
      setReason('');
      toast.success(`Corrections applied. Job is now version ${result.version}; checks reran.`);
    },
  });

  if (!review) {
    return (
      <Empty title="No review yet">
        <p>
          Launch ninjas on the{' '}
          <Link to="../profile" relative="path">
            Profile
          </Link>{' '}
          step to produce findings.
        </p>
      </Empty>
    );
  }

  const stale = review.draft_version !== draft.version;
  const held = review.findings.filter((f) => f.hold);
  const advisories = review.findings.filter((f) => !f.hold);

  function queue(change: PendingChange) {
    setPending((list) => [
      ...list.filter((c) => !(c.row === change.row && c.field === change.field)),
      change,
    ]);
  }

  return (
    <div className="stack-lg">
      <div className="summary-chips" aria-label="Review summary">
        <span className="chip chip--hold">{review.holds} holding release</span>
        <span className="chip chip--ask">{review.total - review.holds} advisories</span>
        <span className="chip">{review.total} findings</span>
        <span className="muted mono">
          Review {review.id} · job version {review.draft_version}
        </span>
      </div>

      {stale ? (
        <div className="state state--warn" role="alert">
          <div>
            <p className="state__title">This review is for version {review.draft_version}</p>
            <p className="state__detail">
              The job is now version {draft.version}. Reload to see the current review.
            </p>
            <button type="button" className="btn btn--secondary" onClick={onReload}>
              Reload
            </button>
          </div>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <section className="panel panel--feature stack" aria-labelledby="batch-heading">
          <h2 id="batch-heading" className="h3">
            Corrections to apply ({pending.length})
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Row</th>
                <th scope="col">Field</th>
                <th scope="col">Before</th>
                <th scope="col">After</th>
                <th scope="col">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.map((change) => (
                <tr key={`${change.row}:${change.field}`}>
                  <td className="mono">{change.row}</td>
                  <td className="mono">{change.field}</td>
                  <td className="mono">
                    {change.before === undefined ? (
                      <span className="muted">not in preview</span>
                    ) : (
                      <span className="redpen">{change.before ?? '(empty)'}</span>
                    )}
                  </td>
                  <td className="mono">{change.value}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      aria-label={`Remove correction for row ${change.row} ${change.field}`}
                      onClick={() => setPending((list) => list.filter((c) => c !== change))}
                    >
                      <X aria-hidden size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">
            &ldquo;Before&rdquo; comes from the intake preview and assumes finding rows are numbered
            from 1 like the preview.
          </p>
          <div className="field">
            <label htmlFor={reasonId}>Reason for these corrections</label>
            <input
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified against the filed annual report"
            />
          </div>
          {correct.error ? <ErrorPanel error={correct.error} onRetry={onReload} /> : null}
          <div className="row">
            <button
              type="button"
              className="btn btn--primary"
              disabled={correct.isPending}
              onClick={() => {
                if (!reason.trim()) {
                  toast.error('Add a reason before applying corrections.');
                  return;
                }
                correct.mutate();
              }}
            >
              {correct.isPending
                ? 'Applying and rechecking…'
                : `Accept ${pending.length} correction${pending.length === 1 ? '' : 's'}`}
            </button>
            <span className="muted">
              Sent for job version <code>{draft.version}</code>. Creates a new version and reruns
              the checks.
            </span>
          </div>
        </section>
      ) : null}

      <FindingGroup
        title="Holding release"
        findings={held}
        empty="No findings hold this release."
        draft={draft}
        onQueue={queue}
        onDecided={applyResult}
        onReload={onReload}
      />
      <FindingGroup
        title="Advisories"
        findings={advisories}
        empty="No advisories."
        draft={draft}
        onQueue={queue}
        onDecided={applyResult}
        onReload={onReload}
        collapsed={held.length > 0}
      />

      <div className="row">
        <Link className="btn btn--secondary" to="../release" relative="path">
          Go to release
        </Link>
      </div>
    </div>
  );
}

function groupByCode(findings: Finding[]) {
  const groups = new Map<string, Finding[]>();
  for (const finding of findings) {
    groups.set(finding.code, [...(groups.get(finding.code) ?? []), finding]);
  }
  return [...groups.entries()];
}

function FindingGroup({
  title,
  findings,
  empty,
  collapsed,
  ...rest
}: {
  title: string;
  findings: Finding[];
  empty: string;
  collapsed?: boolean;
  draft: Draft;
  onQueue: (change: PendingChange) => void;
  onDecided: (result: DraftReviewed) => void;
  onReload: () => void;
}) {
  return (
    <section className="stack">
      <h2 className="h2">
        {title} <span className="muted">({findings.length})</span>
      </h2>
      {findings.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        groupByCode(findings).map(([code, items]) => (
          <details key={code} className="group" open={!collapsed}>
            <summary>
              <code>{code}</code> <span className="muted">{items.length}</span>
            </summary>
            <ul className="findings">
              {items.map((finding) => (
                <FindingRow key={finding.id} finding={finding} {...rest} />
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}

function FindingRow({
  finding,
  draft,
  onQueue,
  onDecided,
  onReload,
}: {
  finding: Finding;
  draft: Draft;
  onQueue: (change: PendingChange) => void;
  onDecided: (result: DraftReviewed) => void;
  onReload: () => void;
}) {
  const { backend, target } = useBackend();
  const ids = useId();
  const [value, setValue] = useState(finding.proposed_value ?? '');
  const [decision, setDecision] = useState<DecisionKind>(
    finding.hold ? 'verified_valid' : 'acknowledge',
  );
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [mode, setMode] = useState<'none' | 'correct' | 'decide'>('none');
  const before = draft.inspection?.preview[finding.row - 1]?.[finding.field];
  const procedureHref = finding.procedure
    ? `${target.replace(/\/+$/, '')}${finding.procedure.startsWith('/') ? '' : '/'}${finding.procedure}`
    : undefined;

  const decide = useMutation({
    mutationFn: () =>
      backend.decide(draft.id, {
        draft_version: draft.version,
        finding_id: finding.id,
        decision,
        reason: reason.trim(),
        ...(evidence.trim() ? { evidence: evidence.trim() } : {}),
      }),
    onSuccess: (result) => {
      onDecided(result);
      toast.success(`Decision recorded for row ${finding.row}.`);
    },
  });

  return (
    <li className={`finding${finding.hold ? ' finding--hold' : ''}`}>
      <div className="finding__head">
        <span className="mono">Row {finding.row}</span>
        <span className="mono">{finding.field}</span>
        <span className={`chip chip--sev-${finding.severity}`}>Severity: {finding.severity}</span>
        <span className="chip">Evidence: {finding.evidence_strength}</span>
        {finding.hold ? <span className="chip chip--hold">Holds release</span> : null}
        <span className="muted mono small">source {finding.source}</span>
      </div>
      <dl className="facts">
        <dt>Evidence</dt>
        <dd>{finding.evidence}</dd>
        <dt>Action</dt>
        <dd>{finding.action}</dd>
        {before !== undefined ? (
          <>
            <dt>Entered value</dt>
            <dd className="mono">
              <span className="redpen">{before ?? '(empty)'}</span>{' '}
              <span className="muted small">(intake preview)</span>
            </dd>
          </>
        ) : null}
        <dt>Proposed value</dt>
        <dd className="mono">{finding.proposed_value ?? <span className="muted">none</span>}</dd>
        <dt>Procedure</dt>
        <dd>
          {procedureHref ? (
            // Backend page, not a console route: open as a normal link.
            <a href={procedureHref} target="_blank" rel="noreferrer">
              {finding.procedure} <ExternalLink aria-hidden size={12} />
            </a>
          ) : (
            <span className="muted">none</span>
          )}
        </dd>
        <dt>Finding ID</dt>
        <dd className="mono small">{finding.id}</dd>
      </dl>

      <div className="row">
        <button
          type="button"
          className="btn btn--secondary btn--small"
          aria-expanded={mode === 'correct'}
          onClick={() => setMode(mode === 'correct' ? 'none' : 'correct')}
        >
          Correct value
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--small"
          aria-expanded={mode === 'decide'}
          onClick={() => setMode(mode === 'decide' ? 'none' : 'decide')}
        >
          {finding.hold ? 'Verify as valid' : 'Verify or acknowledge'}
        </button>
      </div>

      {mode === 'correct' ? (
        <form
          className="subform"
          onSubmit={(event) => {
            event.preventDefault();
            if (!value.trim()) return;
            onQueue({
              findingId: finding.id,
              row: finding.row,
              field: finding.field,
              value,
              before,
            });
            setMode('none');
          }}
        >
          <div className="field">
            <label htmlFor={`${ids}-value`}>
              New value for row {finding.row}, {finding.field}
            </label>
            <input
              id={`${ids}-value`}
              className="mono"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <p className="muted small">
            Before <span className="mono redpen">{before ?? '(not in preview)'}</span> → after{' '}
            <span className="mono">{value || '…'}</span>
          </p>
          <button type="submit" className="btn btn--secondary btn--small">
            Add to corrections
          </button>
        </form>
      ) : null}

      {mode === 'decide' ? (
        <form
          className="subform"
          onSubmit={(event) => {
            event.preventDefault();
            if (!reason.trim()) return;
            decide.mutate();
          }}
        >
          <fieldset className="field">
            <legend>Decision</legend>
            <label>
              <input
                type="radio"
                name={`${ids}-decision`}
                checked={decision === 'verified_valid'}
                onChange={() => setDecision('verified_valid')}
              />{' '}
              Verified valid (the value is correct)
            </label>
            {!finding.hold ? (
              <label>
                <input
                  type="radio"
                  name={`${ids}-decision`}
                  checked={decision === 'acknowledge'}
                  onChange={() => setDecision('acknowledge')}
                />{' '}
                Acknowledge advisory
              </label>
            ) : null}
          </fieldset>
          <div className="field">
            <label htmlFor={`${ids}-reason`}>Reason (required)</label>
            <input
              id={`${ids}-reason`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          {decision === 'verified_valid' ? (
            <div className="field">
              <label htmlFor={`${ids}-evidence`}>Evidence (source you checked)</label>
              <input
                id={`${ids}-evidence`}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="e.g. Annual report 2025, page 14"
              />
            </div>
          ) : null}
          {decide.error ? (
            <ErrorPanel
              error={decide.error}
              title="The backend refused this decision"
              onRetry={onReload}
            />
          ) : null}
          <button type="submit" className="btn btn--primary btn--small" disabled={decide.isPending}>
            {decide.isPending ? 'Recording…' : 'Record decision'}
          </button>
        </form>
      ) : null}
    </li>
  );
}
