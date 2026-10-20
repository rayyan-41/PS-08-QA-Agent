import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Play } from '@pokayoke/ui';
import type { Draft, Plan, Profile, ProfileApproval } from '@pokayoke/api-client';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { ActivityItem, ErrorPanel, Skeleton } from '../components/states';
import { readLastReference, ReferenceUpload } from '../screens/NewJobScreen';
import type { LaunchState } from './JobWorkspace';

/** Phase 2: verify the recommended profile, then "Launch ninjas". */
export function ProfileStep({
  draft,
  launch,
  onLaunch,
  onRunReviewOnly,
}: {
  draft: Draft;
  launch: LaunchState;
  onLaunch: (body: ProfileApproval) => void;
  onRunReviewOnly: () => void;
}) {
  const { backend, target } = useBackend();
  const plan = useQuery({
    queryKey: keys.plan(target, draft.id),
    queryFn: () => backend.plan(draft.id),
    retry: false,
  });
  const profiles = useQuery({
    queryKey: keys.profiles(target),
    queryFn: () => backend.profiles(),
    retry: false,
  });

  if (plan.isPending) return <Skeleton lines={8} label="Loading the recommended profile" />;
  if (plan.error) return <ErrorPanel error={plan.error} onRetry={() => void plan.refetch()} />;

  return (
    <div className="stack-lg">
      <PlannerStatus plan={plan.data} />
      {/* Keyed so the form re-initialises when the backend returns a new plan or version. */}
      <ProfileForm
        key={`${plan.data.version}:${plan.dataUpdatedAt}`}
        draft={draft}
        plan={plan.data}
        profiles={profiles.data ?? []}
        profilesError={profiles.error}
        launch={launch}
        onLaunch={onLaunch}
        onRunReviewOnly={onRunReviewOnly}
      />
    </div>
  );
}

function PlannerStatus({ plan }: { plan: Plan }) {
  const agentRan = !/unavailable|pending|deterministic|disabled|not configured/i.test(
    plan.planner_status,
  );
  return (
    <section className="panel stack" aria-labelledby="planner-heading">
      <h2 id="planner-heading" className="h3">
        How this profile was proposed
      </h2>
      {!agentRan ? (
        <p className="notice">
          The planning agent did not run for this plan. The recommendation below comes from
          deterministic rules, not from the agent.
        </p>
      ) : null}
      <dl className="facts">
        <dt>planner_status</dt>
        <dd className="mono">{plan.planner_status}</dd>
        <dt>planner_note</dt>
        <dd>{plan.planner_note ?? <span className="muted">(none)</span>}</dd>
        <dt>planner_error</dt>
        <dd className={plan.planner_error ? 'text-hold' : undefined}>
          {plan.planner_error ?? <span className="muted">(none)</span>}
        </dd>
        <dt>Plan for version</dt>
        <dd className="mono">{plan.version}</dd>
      </dl>
      <details>
        <summary>Planner activity ({plan.planner_activity?.length ?? 0} recorded steps)</summary>
        {plan.planner_activity?.length ? (
          <ol className="timeline">
            {plan.planner_activity.map((item, index) => (
              <li key={index}>
                <ActivityItem item={item} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">The backend recorded no planner activity.</p>
        )}
      </details>
    </section>
  );
}

function toggle(list: string[], value: string, on: boolean) {
  return on ? [...new Set([...list, value])] : list.filter((item) => item !== value);
}

function ProfileForm({
  draft,
  plan,
  profiles,
  profilesError,
  launch,
  onLaunch,
  onRunReviewOnly,
}: {
  draft: Draft;
  plan: Plan;
  profiles: Profile[];
  profilesError: unknown;
  launch: LaunchState;
  onLaunch: (body: ProfileApproval) => void;
  onRunReviewOnly: () => void;
}) {
  const recommended = plan.recommended_profile;
  const ids = useId();
  const [name, setName] = useState(recommended.name);
  const [required, setRequired] = useState(recommended.required_fields);
  const [unique, setUnique] = useState(recommended.unique_fields);
  const [checks, setChecks] = useState(recommended.checks);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(plan.questions.map((q) => [q.field, q.suggested ?? ''])),
  );
  const [referenceId, setReferenceId] = useState(() => readLastReference()?.id ?? '');
  const [reuseId, setReuseId] = useState('');
  const [problem, setProblem] = useState<string>();
  const questionsRef = useRef<HTMLFieldSetElement>(null);

  const columns = draft.inspection?.columns.map((c) => c.name) ?? [];
  const fieldOptions = [
    ...new Set([...columns, ...recommended.required_fields, ...recommended.unique_fields]),
  ];
  const checkOptions = [...new Set([...plan.available_checks, ...recommended.checks])];
  const busy = launch.phase === 'approving' || launch.phase === 'reviewing';

  function applySaved(profileId: string) {
    setReuseId(profileId);
    const saved = profiles.find((p) => p.id === profileId);
    if (!saved) return;
    setName(saved.name);
    setChecks(saved.checks);
    if (saved.required_fields) setRequired(saved.required_fields);
    if (saved.unique_fields) setUnique(saved.unique_fields);
  }

  function submit() {
    setProblem(undefined);
    if (!name.trim()) {
      setProblem('Give the profile a name before launching.');
      return;
    }
    const unanswered = plan.questions.filter((q) => !answers[q.field]?.trim());
    if (unanswered.length > 0) {
      setProblem(
        `Answer ${unanswered.length === 1 ? 'the question' : `${unanswered.length} questions`}: ${unanswered.map((q) => q.label).join('; ')}`,
      );
      questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    onLaunch({
      draft_version: draft.version,
      name: name.trim(),
      required_fields: required,
      unique_fields: unique,
      checks,
      answers,
      reference_id: referenceId.trim() || null,
      required_checks: [],
      ...(reuseId ? { reuse_profile_id: reuseId } : {}),
    });
  }

  return (
    <form
      className="stack-lg"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <section className="panel panel--feature stack" aria-labelledby={`${ids}-selected`}>
        <h2 id={`${ids}-selected`} className="h2">
          Selected profile
        </h2>
        <p className="muted">
          {reuseId
            ? `Reusing saved profile ${reuseId}. The backend saves a new immutable copy after you confirm.`
            : 'Recommended by the backend for this file. Edit anything below before launching.'}
        </p>
        <div className="field">
          <label htmlFor={`${ids}-saved`}>Start from a saved profile</label>
          <select
            id={`${ids}-saved`}
            value={reuseId}
            onChange={(event) =>
              event.target.value ? applySaved(event.target.value) : setReuseId('')
            }
          >
            <option value="">Use the recommendation</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} (v{profile.version}, {profile.id})
              </option>
            ))}
          </select>
          {profilesError ? (
            <p className="field__error">Saved profiles could not be loaded.</p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor={`${ids}-name`}>Profile name</label>
          <input id={`${ids}-name`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </section>

      <section className="panel stack">
        <h2 className="h3">Fields</h2>
        <p className="muted">
          Required fields must have a value in every row. Unique fields must not repeat.
        </p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Column</th>
                <th scope="col">Required</th>
                <th scope="col">Unique</th>
              </tr>
            </thead>
            <tbody>
              {fieldOptions.map((field) => (
                <tr key={field}>
                  <td className="mono">{field}</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${field} required`}
                      checked={required.includes(field)}
                      onChange={(e) => setRequired(toggle(required, field, e.target.checked))}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`${field} unique`}
                      checked={unique.includes(field)}
                      onChange={(e) => setUnique(toggle(unique, field, e.target.checked))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <h2 className="h3">Checks to run</h2>
        <p className="muted">
          From the backend&apos;s available checks. Recommended checks are pre-selected.
        </p>
        <ul className="checklist">
          {checkOptions.map((check) => (
            <li key={check}>
              <label>
                <input
                  type="checkbox"
                  checked={checks.includes(check)}
                  onChange={(e) => setChecks(toggle(checks, check, e.target.checked))}
                />{' '}
                <code>{check}</code>
                {recommended.checks.includes(check) ? (
                  <span className="muted"> recommended</span>
                ) : null}
                {!plan.available_checks.includes(check) ? (
                  <span className="text-hold"> not in available_checks</span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <fieldset className="panel stack" ref={questionsRef}>
        <legend className="h3">Questions</legend>
        {plan.questions.length === 0 ? (
          <p className="muted">The planner has no open questions.</p>
        ) : (
          plan.questions.map((question) => (
            <div className="field" key={question.field}>
              <label htmlFor={`${ids}-q-${question.field}`}>{question.label}</label>
              <input
                id={`${ids}-q-${question.field}`}
                value={answers[question.field] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [question.field]: e.target.value })}
              />
              {question.suggested ? (
                <p className="muted">
                  Suggested: {question.suggested}{' '}
                  {answers[question.field] !== question.suggested ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() =>
                        setAnswers({ ...answers, [question.field]: question.suggested ?? '' })
                      }
                    >
                      Use suggestion
                    </button>
                  ) : null}
                </p>
              ) : null}
            </div>
          ))
        )}
      </fieldset>

      <section className="panel stack">
        <h2 className="h3">Historical reference</h2>
        <div className="field">
          <label htmlFor={`${ids}-ref`}>Reference ID (optional, labels unverified)</label>
          <input
            id={`${ids}-ref`}
            className="mono"
            value={referenceId}
            onChange={(e) => setReferenceId(e.target.value)}
            placeholder="None"
          />
        </div>
        <details>
          <summary>Upload a historical CSV</summary>
          <ReferenceUpload onUploaded={(reference) => setReferenceId(reference.id)} />
        </details>
      </section>

      <section className="panel stack" aria-live="polite">
        {problem ? (
          <p className="field__error" role="alert">
            {problem}
          </p>
        ) : null}
        <LaunchStatus launch={launch} onRunReviewOnly={onRunReviewOnly} />
        <div className="row">
          <button type="submit" className="btn btn--primary btn--large" disabled={busy}>
            <Play aria-hidden size={16} />
            {launch.phase === 'approving'
              ? 'Saving profile…'
              : launch.phase === 'reviewing'
                ? 'Ninjas launched'
                : 'Launch ninjas'}
          </button>
          <span className="muted">
            Saves this profile for job version <code>{draft.version}</code>, then runs the selected
            checks.
          </span>
        </div>
      </section>
    </form>
  );
}

function LaunchStatus({
  launch,
  onRunReviewOnly,
}: {
  launch: LaunchState;
  onRunReviewOnly: () => void;
}) {
  if (launch.phase === 'approve-failed') {
    return <ErrorPanel error={launch.error} title="The profile was not saved" />;
  }
  if (launch.phase === 'approved-review-failed') {
    return (
      <div className="stack">
        <p className="notice">
          The profile was saved
          {launch.profileId ? (
            <>
              {' '}
              as <code>{launch.profileId}</code>
            </>
          ) : null}
          , but the review did not complete.
        </p>
        <ErrorPanel error={launch.error} title="Review failed" />
        <div className="row">
          <button type="button" className="btn btn--secondary" onClick={onRunReviewOnly}>
            Run review
          </button>
        </div>
      </div>
    );
  }
  if (launch.phase === 'reviewing') {
    return (
      <p className="notice">
        Ninjas launched.{' '}
        <Link to="../run" relative="path">
          Follow the run
        </Link>
        .
      </p>
    );
  }
  return null;
}
