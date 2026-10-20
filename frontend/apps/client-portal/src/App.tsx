import { useBackendHealth } from '@pokayoke/api-client';
import { ConnectionStatus } from '@pokayoke/ui';
import type { AppConfig } from './config';

export function App({ config }: { config: AppConfig }) {
  const health = useBackendHealth(config.apiBaseUrl);

  return (
    <div className="portal-page">
      <a className="pk-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-monogram" aria-hidden="true">
            HR
          </span>
          <span>Halden Research</span>
        </div>
        <span className="portal-header-note">Financial data operations</span>
      </header>
      <main id="main-content" className="portal-main">
        <div className="portal-intro">
          <h1>Company financials</h1>
          <p>Client portal deployment setup</p>
        </div>
        <div className="portal-columns">
          <section className="portal-pending" aria-labelledby="pending-heading">
            <h2 id="pending-heading">Imports are not connected yet</h2>
            <p>
              The CSV import, quality review widget and accepted records table will be connected
              after the deployment checks pass.
            </p>
            <p>No records have been requested from the backend.</p>
          </section>
          <div className="portal-connection">
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
              apiBaseUrl={config.apiBaseUrl}
              checkedAt={health.data?.checkedAt}
              httpStatus={health.data?.status}
              error={health.error?.message}
              onRetry={() => {
                void health.refetch();
              }}
            />
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
          </div>
        </div>
      </main>
      <footer className="portal-footer">
        Halden Research is a fictional company used to demonstrate Pokayoke.
      </footer>
    </div>
  );
}
