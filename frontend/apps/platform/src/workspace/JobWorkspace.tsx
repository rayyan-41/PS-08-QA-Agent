import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
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

export const STEPS = ['intake', 'profile', 'run', 'review', 'release'] as const;
export type Step = (typeof STEPS)[number];
const LABELS: Record<Step, string> = {
  intake: 'Intake',
  profile: 'Profile',
  run: 'Run',
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
  const { id = '', step } = useParams();
  const { backend, target } = useBackend();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      navigate(`/jobs/${id}/run`);
      runReview.mutate();
    },
    onError: (error) => setLaunch({ phase: 'approve-failed', error }),
  });

  if (!step) return <Navigate replace to={`/jobs/${id}/intake`} />;
  if (!STEPS.includes(step as Step)) return <Navigate replace to={`/jobs/${id}/intake`} />;
  const current = step as Step;
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
    intake: true,
    profile: Boolean(data.inspection),
    run: hasReview || launch.phase !== 'idle',
    review: hasReview,
    release: hasReview,
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

      <nav aria-label="Job steps">
        <ol className="stepper">
          {STEPS.map((item, index) => (
            <li key={item} className={item === current ? 'is-current' : undefined}>
              {reached[item] ? (
                <Link
                  to={`/jobs/${id}/${item}`}
                  aria-current={item === current ? 'step' : undefined}
                >
                  <span className="stepper__n">{index + 1}</span> {LABELS[item]}
                </Link>
              ) : (
                <span className="stepper__locked">
                  <span className="stepper__n">{index + 1}</span> {LABELS[item]}
                </span>
              )}
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

      {current === 'intake' ? <IntakeStep draft={data} /> : null}
      {current === 'profile' ? (
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
      ) : null}
      {current === 'run' ? (
        <RunStep
          launch={launch}
          review={review.data ?? null}
          onRunReview={() => {
            setLaunch({ phase: 'reviewing', startedAt: Date.now() });
            runReview.mutate();
          }}
        />
      ) : null}
      {current === 'review' ? (
        <ReviewStep draft={data} review={review.data ?? null} onReload={refreshAll} />
      ) : null}
      {current === 'release' ? (
        <ReleaseStep draft={data} review={review.data ?? null} onReload={refreshAll} />
      ) : null}
    </section>
  );
}
