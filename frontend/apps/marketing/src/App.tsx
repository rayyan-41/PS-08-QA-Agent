import { useBackendHealth } from '@pokayoke/api-client';
import { ConnectionStatus, Logo } from '@pokayoke/ui';
import type { AppConfig } from './config';

export function App({ config }: { config: AppConfig }) {
  const health = useBackendHealth(config.apiBaseUrl);

  return (
    <div className="marketing-page">
      <a className="pk-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="marketing-header">
        <Logo />
        <span className="setup-label">Deployment setup</span>
      </header>
      <main id="main-content" className="marketing-main">
        <section className="marketing-intro" aria-labelledby="page-heading">
          <h1 id="page-heading">Catch the wrong number before it is saved.</h1>
          <p className="marketing-lead">
            Pokayoke is being built to review company financials before submission, with evidence
            for every finding and an explicit release gate.
          </p>
          <p className="marketing-stage">
            This is the deployment scaffold. The presentation and live demo journey are not
            available yet.
          </p>
        </section>
        <div className="marketing-connection">
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
          {config.setupErrors.length > 0 ? <SetupNotes errors={config.setupErrors} /> : null}
        </div>
      </main>
      <footer className="marketing-footer">
        Built at the atomcamp National AI Hackathon, 20 October 2026
      </footer>
    </div>
  );
}

function SetupNotes({ errors }: { errors: string[] }) {
  return (
    <aside className="pk-setup-notes">
      <h2>Configuration needed</h2>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </aside>
  );
}
