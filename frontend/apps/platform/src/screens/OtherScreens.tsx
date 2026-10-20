import { useId, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { useAuth } from '../auth';
import { Empty, ErrorPanel, Skeleton, Updated } from '../components/states';

/** GET /api/profiles. Profile detail and versions need BACKEND_REQUESTS.md #9. */
export function ProfilesScreen() {
  const { backend, target } = useBackend();
  const profiles = useQuery({
    queryKey: keys.profiles(target),
    queryFn: () => backend.profiles(),
    retry: false,
  });
  return (
    <section className="page">
      <header className="page__head">
        <div>
          <h1>Saved profiles</h1>
          <p className="muted">Profiles saved when a QA expert launched a review.</p>
        </div>
        <Updated
          at={profiles.dataUpdatedAt}
          fetching={profiles.isFetching}
          onRefresh={() => void profiles.refetch()}
        />
      </header>
      {profiles.isPending ? (
        <Skeleton label="Loading profiles" />
      ) : profiles.error ? (
        <ErrorPanel error={profiles.error} onRetry={() => void profiles.refetch()} />
      ) : profiles.data.length === 0 ? (
        <Empty title="No saved profiles">
          <p>A profile is saved the first time you press Launch ninjas on a job.</p>
        </Empty>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Profile ID</th>
              <th scope="col" className="num">
                Version
              </th>
              <th scope="col">Checks</th>
              <th scope="col">Required</th>
              <th scope="col">Unique</th>
            </tr>
          </thead>
          <tbody>
            {profiles.data.map((profile) => (
              <tr key={`${profile.id}:${profile.version}`}>
                <td>{profile.name}</td>
                <td className="mono">{profile.id}</td>
                <td className="num mono">{profile.version}</td>
                <td className="mono small">{profile.checks.join(', ')}</td>
                <td className="mono small">{profile.required_fields?.join(', ') ?? '–'}</td>
                <td className="mono small">{profile.unique_fields?.join(', ') ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** Firebase email/password sign-in. Only routed when config.json has "auth": "firebase". */
export function LoginScreen() {
  const { state, signIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ids = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const next = params.get('next') ?? '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (state.mode === 'none') return <Navigate replace to="/" />;
  if (state.mode === 'firebase' && state.status === 'signed-in')
    return <Navigate replace to={safeNext} />;

  return (
    <main className="login">
      <form
        className="panel stack login__card"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(undefined);
          setBusy(true);
          try {
            await signIn(email, password);
            navigate(safeNext, { replace: true });
          } catch (reason) {
            const code = (reason as { code?: string }).code ?? '';
            setError(
              /invalid|wrong|not-found|credential/.test(code)
                ? 'The email or password is not correct. Check both and try again.'
                : `Sign-in failed (${code || 'unknown error'}). Try again.`,
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1 className="h2">Sign in to Pokayoke</h1>
        <p className="muted">Access is set up by your workspace admin.</p>
        {state.status === 'error' ? (
          <p className="field__error" role="alert">
            Sign-in could not start: {state.error}
          </p>
        ) : null}
        <div className="field">
          <label htmlFor={`${ids}-email`}>Email</label>
          <input
            id={`${ids}-email`}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor={`${ids}-password`}>Password</label>
          <input
            id={`${ids}-password`}
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label className="small">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />{' '}
            Show password
          </label>
        </div>
        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="btn btn--primary"
          disabled={busy || state.status === 'loading'}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
