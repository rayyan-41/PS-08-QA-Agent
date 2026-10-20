import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileApproval } from '@pokayoke/api-client';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { isStatus } from '../api/errors';
import { ErrorPanel, Skeleton, Updated } from '../components/states';
import { readRecentJobs } from '../lib/recent-jobs';
import { IntakeStep } from './IntakeStep';
import { ProfileStep } from './ProfileStep';
import { RunStep } from './RunStep';
import { ReviewStep } from './ReviewStep';
import { ReleaseStep } from './ReleaseStep';

export const STEPS = ['upload', 'inspect', 'configure', 'review', 'release'] as const;
export type Step = (typeof STEPS)[number];
const LABELS: Record<Step, string> = {
  upload: 'Upload',
  inspect: 'Inspect',
  configure: 'Configure',
  review: 'Review',
  release: 'Release',
};

/** Where "Launch ninjas" currently is. Both calls are separate so partial success is visible. */
export type LaunchState =
  | { phase: 'idle' }
  | { phase: 'approving' }
  | { phase: 'reviewing'; startedAt: number; profileId?: string }
  | { phase: 'approved-review-failed'; error: unknown; profileId?: string }
  | { phase: 'approve-failed'; error: unknown };

export function JobWorkspace() {
  const { id = '' } = useParams();
  const { backend, target } = useBackend();
  const queryClient = useQueryClient();
  const [launch, setLaunch] = useState<LaunchState>({ phase: 'idle' });

  const draft = useQuery({
    queryKey: keys.draft(target, id),
    queryFn: () => backend.draft(id),
    retry: false,
  });
  // GET review 404s until a review has run; that is "no review yet", not an error.
  const review = useQuery({
    queryKey: keys.review(target, id),
    queryFn: async () => {
      try {
        return await backend.review(id);
      } catch (error) {
        if (isStatus(error, 404)) return null;
        throw error;
      }
    },
    retry: false,
    enabled: draft.isSuccess,
  });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: keys.draft(target, id) });
    void queryClient.invalidateQueries({ queryKey: keys.review(target, id) });
    void queryClient.invalidateQueries({ queryKey: keys.plan(target, id) });
  };

  const runReview = useMutation({
    mutationFn: () => backend.runReview(id),
    onSuccess: (result) => {
      queryClient.setQueryData(keys.review(target, id), result);
      void queryClient.invalidateQueries({ queryKey: keys.draft(target, id) });
      setLaunch({ phase: 'idle' });
      toast.success(`Review finished: ${result.total} findings, ${result.holds} holding release.`);
    },
    onError: (error) =>
      setLaunch((current) => ({
        phase: 'approved-review-failed',
        error,
        profileId: 'profileId' in current ? current.profileId : undefined,
      })),
  });

  const launchNinjas = useMutation({
    mutationFn: (body: ProfileApproval) => backend.approveProfile(id, body),
    onMutate: () => setLaunch({ phase: 'approving' }),
    onSuccess: (approved) => {
      void queryClient.invalidateQueries({ queryKey: keys.profiles(target) });
      void queryClient.invalidateQueries({ queryKey: keys.draft(target, id) });
      setLaunch({ phase: 'reviewing', startedAt: Date.now(), profileId: approved.profile.id });
      toast.success('Ninjas launched');
      runReview.mutate();
    },
    onError: (error) => setLaunch({ phase: 'approve-failed', error }),
  });

  const filename = draft.data?.filename ?? readRecentJobs().find((job) => job.id === id)?.filename;

  if (draft.isPending) {
    return (
      <section className="page">
        <Skeleton lines={6} label="Loading job" />
      </section>
    );
  }
  if (draft.error) {
    return (
      <section className="page">
        <h1>Job {id}</h1>
        {isStatus(draft.error, 404) ? (
          <ErrorPanel
            error={draft.error}
            title="This job does not exist on the active backend"
            onRetry={() => void draft.refetch()}
          />
        ) : (
          <ErrorPanel error={draft.error} onRetry={() => void draft.refetch()} />
        )}
        <p>
          <Link to="/">Back to jobs</Link>
        </p>
      </section>
    );
  }

  const data = draft.data;
  const hasReview = Boolean(review.data);
  const reached: Record<Step, boolean> = {
    upload: true,
    inspect: Boolean(data.inspection),
    configure: Boolean(data.profile_id),
    review: hasReview,
    release: hasReview && review.data?.holds === 0,
  };

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="muted">
            <Link to="/">Jobs</Link> / {filename ?? 'Job'}
          </p>
          <h1>{filename ?? `Job ${id}`}</h1>
          <p className="job-meta">
            <span>
              Job ID <code>{data.id}</code>
            </span>
            <span>
              Version <code>{data.version}</code>
            </span>
            <span>
              Status <code>{data.status}</code>
            </span>
          </p>
        </div>
        <Updated
          at={draft.dataUpdatedAt}
          fetching={draft.isFetching || review.isFetching}
          onRefresh={refreshAll}
        />
      </header>

      <nav aria-label="Job progress">
        <ol className="stepper">
          {STEPS.map((item, index) => (
            <li key={item} className={reached[item] ? 'is-current' : undefined}>
              <a href={`#${item}`} aria-label={`${LABELS[item]} section`}>
                <span className="stepper__n">{index + 1}</span> {LABELS[item]}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {review.error ? (
        <ErrorPanel
          error={review.error}
          title="The review could not be loaded"
          onRetry={refreshAll}
        />
      ) : null}

      <div aria-live="polite" className="sr-only">
        {launch.phase === 'reviewing' ? 'Ninjas launched. Running the selected checks.' : ''}
      </div>

      <section id="upload" className="panel stack">
        <h2 className="h2">Upload</h2>
        <p>
          The original CSV is preserved as <strong>{filename ?? 'this file'}</strong>.
        </p>
        <p className="muted">
          Job <code>{data.id}</code> · version {data.version}
        </p>
        <Link className="btn btn--secondary" to="/jobs/new">
          Upload another CSV
        </Link>
      </section>
      <section id="inspect" className="panel stack">
        <h2 className="h2">Inspect</h2>
        <IntakeStep draft={data} />
      </section>
      {data.inspection ? (
        <section id="configure" className="stack-lg">
          <h2 className="h2">Configure</h2>
          <ProfileStep
            draft={data}
            launch={launch}
            onLaunch={(body) => launchNinjas.mutate(body)}
            onRunReviewOnly={() => {
              setLaunch((s) => ({
                phase: 'reviewing',
                startedAt: Date.now(),
                profileId: 'profileId' in s ? s.profileId : undefined,
              }));
              runReview.mutate();
            }}
          />
        </section>
      ) : null}
      {hasReview || launch.phase !== 'idle' ? (
        <section id="review" className="stack-lg">
          <h2 className="h2">Review</h2>
          <RunStep
            launch={launch}
            review={review.data ?? null}
            onRunReview={() => {
              setLaunch({ phase: 'reviewing', startedAt: Date.now() });
              runReview.mutate();
            }}
          />
          <ReviewStep draft={data} review={review.data ?? null} onReload={refreshAll} />
        </section>
      ) : null}
      {hasReview ? (
        <section id="release" className="stack-lg">
          <h2 className="h2">Release</h2>
          <ReleaseStep draft={data} review={review.data ?? null} onReload={refreshAll} />
        </section>
      ) : null}
    </section>
  );
}
