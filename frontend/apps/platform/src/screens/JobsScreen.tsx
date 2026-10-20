import { useState } from 'react';
import { Link } from 'react-router';
import { useQueries } from '@tanstack/react-query';
import { FileUp, Trash2 } from '@pokayoke/ui';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { isApiError } from '../api/errors';
import { Empty } from '../components/states';
import { forgetJob, readRecentJobs } from '../lib/recent-jobs';
import { formatTime, targetLabel } from '../lib/format';

/**
 * Jobs created from this browser. The backend has no list route yet
 * (BACKEND_REQUESTS.md #1), so each remembered draft is refreshed with
 * GET /api/drafts/{id}.
 */
export function JobsScreen() {
  const { backend, target } = useBackend();
  const [jobs, setJobs] = useState(readRecentJobs);
  const visible = jobs.filter((job) => job.target === target);
  const otherTargets = jobs.length - visible.length;

  const results = useQueries({
    queries: visible.map((job) => ({
      queryKey: keys.draft(target, job.id),
      queryFn: () => backend.draft(job.id),
      retry: false,
    })),
  });

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>Jobs created in this browser</h1>
          <p className="muted">
            The backend has no job list yet, so this page shows jobs started here on{' '}
            {targetLabel(target)}.
          </p>
        </div>
        <Link className="btn btn--primary" to="/jobs/new">
          <FileUp aria-hidden size={16} /> New job
        </Link>
      </header>

      {visible.length === 0 ? (
        <Empty title="No jobs yet">
          <p>Upload a CSV of company financials to start a review.</p>
          {otherTargets > 0 ? (
            <p className="muted">
              {otherTargets} job{otherTargets === 1 ? '' : 's'} belong to another backend target.
            </p>
          ) : null}
        </Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">Job ID</th>
                <th scope="col" className="num">
                  Version
                </th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job, index) => {
                const result = results[index];
                const draft = result?.data;
                const missing = isApiError(result?.error) && result.error.status === 404;
                return (
                  <tr key={job.id}>
                    <td>
                      <Link to={`/jobs/${job.id}`}>{job.filename}</Link>
                    </td>
                    <td className="mono">{job.id}</td>
                    <td className="num mono">{draft?.version ?? '–'}</td>
                    <td>
                      {result?.isPending ? (
                        <span className="muted">Loading…</span>
                      ) : missing ? (
                        <span className="chip chip--hold">Not found on this backend</span>
                      ) : result?.error ? (
                        <span className="chip chip--hold">
                          Could not load
                          {isApiError(result.error) && result.error.status
                            ? ` (HTTP ${result.error.status})`
                            : ''}
                        </span>
                      ) : (
                        <span className="chip">{draft?.status}</span>
                      )}
                    </td>
                    <td className="muted">{formatTime(job.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        onClick={() => {
                          forgetJob(job.id);
                          setJobs(readRecentJobs());
                        }}
                        aria-label={`Remove ${job.filename} from this list`}
                      >
                        <Trash2 aria-hidden size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
