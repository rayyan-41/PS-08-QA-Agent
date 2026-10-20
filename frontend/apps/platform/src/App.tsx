import { useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router';
import {
  FilePlus2,
  ListChecks,
  Logo,
  LogOut,
  PanelRightOpen,
  SlidersHorizontal,
} from '@pokayoke/ui';
import { BackendProvider, useBackend } from './api/context';
import { useAuth } from './auth';
import type { PlatformConfig } from './config';
import { Inspector, useHealth } from './devtools/Inspector';
import { JobsScreen } from './screens/JobsScreen';
import { NewJobScreen } from './screens/NewJobScreen';
import { LoginScreen, ProfilesScreen } from './screens/OtherScreens';
import { JobWorkspace } from './workspace/JobWorkspace';
import { targetLabel } from './lib/format';

// Console routes. None may start with a backend prefix:
// /api, /tools, /procedures, /docs, /redoc, /openapi.json, /fallback, /static.
export function App({ config, devtools }: { config: PlatformConfig; devtools: boolean }) {
  const { getToken } = useAuth();
  return (
    <BackendProvider config={config} devtools={devtools} getToken={getToken}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="*"
          element={
            <RequireAuth>
              <Shell>
                <Routes>
                  <Route path="/" element={<JobsScreen />} />
                  <Route path="/jobs/new" element={<NewJobScreen />} />
                  <Route path="/jobs/:id" element={<JobWorkspace />} />
                  <Route path="/jobs/:id/:step" element={<JobWorkspace />} />
                  <Route path="/profiles" element={<ProfilesScreen />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Shell>
            </RequireAuth>
          }
        />
      </Routes>
    </BackendProvider>
  );
}

/** With "auth": "firebase", signed-out users go to /login?next=… . With "none" there is no gate. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();
  if (state.mode === 'none' || state.status === 'signed-in') return <>{children}</>;
  if (state.status === 'loading') return <p className="page">Checking sign-in…</p>;
  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate replace to={`/login?next=${next}`} />;
}

function Shell({ children }: { children: ReactNode }) {
  const { config, devtools, target } = useBackend();
  const { state, signOut } = useAuth();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const location = useLocation();
  return (
    <div className={`shell${inspectorOpen ? ' shell--inspector' : ''}`}>
      <a className="pk-skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="shell__sidebar">
        <Link to="/" aria-label="Pokayoke jobs" className="shell__brand">
          <Logo variant="reversed" />
        </Link>
        <nav aria-label="Main" className="shell__nav">
          <NavLink to="/" end>
            <ListChecks aria-hidden size={16} /> Jobs
          </NavLink>
          <NavLink to="/jobs/new">
            <FilePlus2 aria-hidden size={16} /> New job
          </NavLink>
          <NavLink to="/profiles">
            <SlidersHorizontal aria-hidden size={16} /> Profiles
          </NavLink>
        </nav>
        <p className="shell__foot">Pre-submission QA for company financials</p>
      </aside>
      <div className="shell__body">
        <header className="topbar">
          <span className="topbar__title">
            <span className="topbar__product">Pokayoke console</span>
            <span aria-hidden className="topbar__sep">
              /
            </span>
            <span>{sectionLabel(location.pathname)}</span>
          </span>
          <div className="topbar__right">
            {devtools ? <TargetBadge target={target} /> : null}
            {devtools ? (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                aria-expanded={inspectorOpen}
                onClick={() => setInspectorOpen((open) => !open)}
              >
                <PanelRightOpen aria-hidden size={14} /> Inspector
              </button>
            ) : null}
            {state.mode === 'firebase' && state.status === 'signed-in' ? (
              <>
                <span className="small">QA expert · {state.email}</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => void signOut()}
                >
                  <LogOut aria-hidden size={14} /> Sign out
                </button>
              </>
            ) : null}
          </div>
        </header>
        {config.setupErrors.length > 0 ? (
          <div className="setup-notes" role="alert">
            {config.setupErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}
        <main id="main-content">
          <div key={location.pathname.split('/').slice(0, 3).join('/')} className="route-fade">
            {children}
          </div>
        </main>
      </div>
      {devtools && inspectorOpen ? <Inspector onClose={() => setInspectorOpen(false)} /> : null}
    </div>
  );
}

/** Topbar label for the current route; the job workspace shows its own breadcrumb. */
function sectionLabel(pathname: string) {
  if (pathname === '/') return 'Jobs';
  if (pathname === '/jobs/new') return 'New job';
  if (pathname.startsWith('/jobs/')) return 'Job workspace';
  if (pathname === '/profiles') return 'Profiles';
  return 'Not found';
}

function TargetBadge({ target }: { target: string }) {
  const health = useHealth();
  const state = health.isPending ? 'checking' : health.error ? 'down' : health.data.status;
  return (
    <span
      className={`target-badge target-badge--${health.error ? 'down' : health.data?.status === 'ok' ? 'ok' : 'unknown'}`}
      title={targetLabel(target)}
    >
      <span className="mono">{target === '' ? 'same origin' : target}</span> · {state}
      {health.data ? ` · ${health.data.storage}` : ''}
    </span>
  );
}

function NotFound() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p>
        <Link to="/">Back to jobs</Link>
      </p>
    </section>
  );
}
