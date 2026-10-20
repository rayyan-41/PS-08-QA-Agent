import { createApiClient } from '@pokayoke/api-client';
import { useQuery } from '@tanstack/react-query';
import { ConnectionStatus, Logo } from '@pokayoke/ui';
import { Route, Routes } from 'react-router';
import type { PlatformConfig as AppConfig } from './config';

export function App({ config }: { config: AppConfig }) {
  return (
    <Routes>
      <Route path="/" element={<PlatformSetup config={config} />} />
      <Route path="/login" element={<PlatformSetup config={config} />} />
      <Route path="*" element={<PlatformSetup config={config} />} />
    </Routes>
  );
}

function PlatformSetup({ config }: { config: AppConfig }) {
  // Placeholder until the console screens land: same-origin GET /api/health.
  const health = useQuery({
    queryKey: ['api-health', config.apiBaseUrl],
    queryFn: async () => {
      const result = await createApiClient(config.apiBaseUrl).GET('/api/health');
      const response = result.response;
      if (!result.data) throw new Error(`GET /api/health returned HTTP ${response.status}`);
      return { status: response.status, checkedAt: new Date().toISOString() };
    },
    retry: false,
  });

  return (
    <div className="platform-shell">
      <a className="pk-skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="platform-sidebar">
        <Logo variant="reversed" />
        <p>Platform setup</p>
        <span>Deployment scaffold</span>
      </aside>
      <div className="platform-body">
        <header className="platform-topbar">
          <span>Pokayoke platform</span>
          <span>Access not connected</span>
        </header>
        <main id="main-content" className="platform-main">
          <div className="platform-intro">
            <h1>Connect the foundation.</h1>
            <p>
              This page checks the connection to the backend before the review workspace is built.
            </p>
          </div>
          <ConnectionStatus
            state={
              !config.apiBaseUrl
                ? 'configuring'
                : health.isPending || health.isFetching
                  ? 'loading'
                  : health.isError
                    ? 'error'
                    : 'success'
            }
            apiBaseUrl={config.apiBaseUrl || window.location.origin}
            checkedAt={health.data?.checkedAt}
            httpStatus={health.data?.status}
            error={health.error?.message}
            onRetry={() => {
              void health.refetch();
            }}
          />
          <PendingAccess />
          {config.setupErrors.length > 0 ? (
            <aside className="pk-setup-notes">
              <h2>Configuration needed</h2>
              <ul>
                {config.setupErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </aside>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function PendingAccess() {
  return (
    <section className="platform-access" aria-labelledby="access-heading">
      <h2 id="access-heading">Sign-in is not connected yet</h2>
      <p>
        Firebase Authentication and protected job routes will be added after deployment checks pass.
        Access will be set up by your workspace admin.
      </p>
      <p>No job data is available in this scaffold.</p>
    </section>
  );
}
