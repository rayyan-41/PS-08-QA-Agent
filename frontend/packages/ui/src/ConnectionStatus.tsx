import { CheckCircle2, CircleEllipsis, CircleHelp, CircleX } from 'lucide-react';
import { Button } from './Button';
import { useId } from 'react';

export type ConnectionState = 'configuring' | 'loading' | 'error' | 'success';

export type ConnectionStatusProps = {
  state: ConnectionState;
  apiBaseUrl?: string;
  checkedAt?: string;
  httpStatus?: number;
  error?: string;
  onRetry: () => void;
};

const states = {
  configuring: { title: 'Backend not configured', Icon: CircleHelp },
  loading: { title: 'Checking the backend', Icon: CircleEllipsis },
  error: { title: 'Backend connection failed', Icon: CircleX },
  success: { title: 'Backend reachable', Icon: CheckCircle2 },
} as const;

export function ConnectionStatus({
  state,
  apiBaseUrl,
  checkedAt,
  httpStatus,
  error,
  onRetry,
}: ConnectionStatusProps) {
  const { title, Icon } = states[state];
  const headingId = useId();
  const checkedTime = checkedAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(
        new Date(checkedAt),
      )
    : undefined;

  return (
    <section className={`pk-connection pk-connection--${state}`} aria-labelledby={headingId}>
      <div className="pk-connection__heading" role="status" aria-live="polite" aria-atomic="true">
        <Icon aria-hidden="true" size={22} strokeWidth={1.75} />
        <h2 id={headingId}>{title}</h2>
      </div>
      <div className="pk-connection__body">
        {state === 'configuring' ? (
          <p>
            Set the API base URL in this app’s configuration, then reload to check the connection.
          </p>
        ) : null}
        {state === 'loading' ? (
          <div aria-busy="true">
            <p>Requesting the configured backend’s health endpoint.</p>
            <div className="pk-connection__skeleton" aria-hidden="true" />
          </div>
        ) : null}
        {state === 'error' ? (
          <p role="alert">
            {error ??
              'The health request did not succeed. Check the API URL, backend availability and CORS settings, then try again.'}
          </p>
        ) : null}
        {state === 'success' ? (
          <p>
            The health endpoint responded successfully. Authentication and the review workflow still
            need to be connected.
          </p>
        ) : null}
        {apiBaseUrl ? (
          <dl className="pk-connection__details">
            <div>
              <dt>API base URL</dt>
              <dd>
                <code>{apiBaseUrl}</code>
              </dd>
            </div>
            {httpStatus !== undefined ? (
              <div>
                <dt>HTTP response</dt>
                <dd>
                  <code>{httpStatus}</code>
                </dd>
              </div>
            ) : null}
            {checkedAt ? (
              <div>
                <dt>Last checked</dt>
                <dd>
                  <time dateTime={checkedAt}>{checkedTime}</time>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        {state === 'success' || state === 'error' ? (
          <Button variant="primary" onClick={onRetry}>
            {state === 'error' ? 'Retry connection' : 'Check connection again'}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
