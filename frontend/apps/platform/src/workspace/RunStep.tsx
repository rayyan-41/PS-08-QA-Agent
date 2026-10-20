import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Review } from '@pokayoke/api-client';
import { ActivityItem, Empty, ErrorPanel } from '../components/states';
import { formatTime, sinceText } from '../lib/format';
import type { LaunchState } from './JobWorkspace';

/**
 * Phases 3 and 4. The review call is synchronous, so while it runs we only
 * show elapsed time (no invented progress). Afterwards we show what the
 * backend recorded.
 */
export function RunStep({
  launch,
  review,
  onRunReview,
}: {
  launch: LaunchState;
  review: Review | null;
  onRunReview: () => void;
}) {
  if (launch.phase === 'reviewing') return <Waiting startedAt={launch.startedAt} />;
  if (launch.phase === 'approving') return <p className="notice">Saving the profile…</p>;

  return (
    <div className="stack-lg">
      {launch.phase === 'approved-review-failed' ? (
        <div className="stack">
          <ErrorPanel error={launch.error} title="The review run failed" />
          <div className="row">
            <button type="button" className="btn btn--secondary" onClick={onRunReview}>
              Run review again
            </button>
          </div>
        </div>
      ) : null}
      {!review ? (
        <Empty title="No review has run for this job">
          <p>
            Verify the profile and press Launch ninjas on the{' '}
            <Link to="../profile" relative="path">
              Profile
            </Link>{' '}
            step.
          </p>
        </Empty>
      ) : (
        <RunRecord review={review} />
      )}
    </div>
  );
}

function Waiting({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="panel stack" role="status">
      <p className="h3">Running the selected checks. This can take several seconds.</p>
      <p className="mono">Elapsed {sinceText(now - startedAt)}</p>
      <p className="muted">
        The backend answers when the whole review is finished. Activity appears here once it
        returns.
      </p>
    </div>
  );
}

function RunRecord({ review }: { review: Review }) {
  const ready = review.total - review.holds;
  return (
    <div className="stack-lg">
      <dl className="facts facts--inline">
        <dt>Review ID</dt>
        <dd className="mono">{review.id}</dd>
        <dt>For job version</dt>
        <dd className="mono">{review.draft_version}</dd>
        <dt>Profile</dt>
        <dd className="mono">{review.profile_id}</dd>
        <dt>Findings</dt>
        <dd className="mono">{review.total}</dd>
        <dt>Holding release</dt>
        <dd className="mono text-hold">{review.holds}</dd>
        <dt>Advisories</dt>
        <dd className="mono">{ready}</dd>
        <dt>Finished</dt>
        <dd>{formatTime(review.created_at)}</dd>
      </dl>

      <section className="stack">
        <h2 className="h3">Check outcomes</h2>
        {review.outcomes.length === 0 ? (
          <p className="muted">The backend reported no check outcomes.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Check or model</th>
                <th scope="col">Status</th>
                <th scope="col">Other fields</th>
              </tr>
            </thead>
            <tbody>
              {review.outcomes.map((outcome, index) => {
                const { model, status, ...rest } = outcome;
                const failed = !/^(completed|ok|passed|success)$/i.test(status);
                return (
                  <tr key={index}>
                    <td className="mono">{model}</td>
                    <td>
                      <span className={`chip ${failed ? 'chip--hold' : 'chip--pass'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="mono small">
                      {Object.keys(rest).length ? JSON.stringify(rest) : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="stack">
        <h2 className="h3">Recorded activity</h2>
        {review.activity.length === 0 ? (
          <p className="muted">The backend recorded no agent activity for this review.</p>
        ) : (
          <ol className="timeline">
            {review.activity.map((item, index) => (
              <li key={index}>
                <ActivityItem item={item} />
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="row">
        <Link className="btn btn--primary" to="../review" relative="path">
          Review findings
        </Link>
      </div>
    </div>
  );
}
