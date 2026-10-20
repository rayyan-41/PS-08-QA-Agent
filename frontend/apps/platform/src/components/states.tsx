import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from '@pokayoke/ui';
import { useBackend } from '../api/context';
import { isApiError, isStatus } from '../api/errors';
import { sinceText, targetLabel } from '../lib/format';

/**
 * Shows a failed call with what the backend said (FastAPI `detail`), the status
 * code and the route. A 409 gets the "job changed" treatment with Reload.
 */
export function ErrorPanel({
  error,
  onRetry,
  retryLabel = 'Retry',
  title,
}: {
  error: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
}) {
  const { target } = useBackend();
  if (isStatus(error, 409)) {
    return (
      <div className="state state--warn" role="alert">
        <AlertTriangle aria-hidden size={18} />
        <div>
          <p className="state__title">This job changed since you loaded it</p>
          {isApiError(error) ? <p className="state__detail">{error.detail}</p> : null}
          <RouteLine error={error} />
          {onRetry ? (
            <button type="button" className="btn btn--secondary" onClick={onRetry}>
              <RefreshCw aria-hidden size={14} /> Reload
            </button>
          ) : null}
        </div>
      </div>
    );
  }
  let heading = title ?? 'The request failed';
  let detail = error instanceof Error ? error.message : String(error);
  if (isApiError(error) && error.kind !== 'http') {
    heading =
      error.kind === 'timeout'
        ? 'The backend did not respond in time'
        : 'No response from the backend';
    detail =
      target === ''
        ? `The backend is down, or the development proxy target is wrong. Active target: ${targetLabel(target)}.`
        : `The backend did not allow this origin (CORS) or is unreachable. Console origin: ${window.location.origin}. Active target: ${target}.`;
  } else if (isApiError(error)) {
    detail = error.detail;
  }
  return (
    <div className="state state--error" role="alert">
      <AlertTriangle aria-hidden size={18} />
      <div>
        <p className="state__title">{heading}</p>
        <p className="state__detail">{detail}</p>
        <RouteLine error={error} />
        {onRetry ? (
          <button type="button" className="btn btn--secondary" onClick={onRetry}>
            <RefreshCw aria-hidden size={14} /> {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RouteLine({ error }: { error: unknown }) {
  if (!isApiError(error)) return null;
  return (
    <p className="state__route mono">
      {error.method} {error.path}
      {error.status ? ` → HTTP ${error.status}` : ' → no response'}
    </p>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state state--empty">
      <div>
        <p className="state__title">{title}</p>
        {children}
      </div>
    </div>
  );
}

/** Skeleton lines that roughly match the final layout. */
export function Skeleton({ lines = 4, label }: { lines?: number; label: string }) {
  return (
    <div className="skeleton" role="status" aria-label={label}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton__line" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

/** "Updated 12s ago" with a refresh control (MASTER_UI 5.6 stale state). */
export function Updated({
  at,
  onRefresh,
  fetching,
}: {
  at: number;
  onRefresh: () => void;
  fetching?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="updated">
      {at ? `Updated ${sinceText(now - at)} ago` : 'Not loaded'}
      <button
        type="button"
        className="btn btn--ghost btn--small"
        onClick={onRefresh}
        aria-label="Refresh"
        disabled={fetching}
      >
        <RefreshCw aria-hidden size={14} className={fetching ? 'spin' : undefined} />
      </button>
    </span>
  );
}

/** Collapsible JSON viewer built on <details>, for raw responses. */
export function JsonView({ value, label = 'JSON' }: { value: unknown; label?: string }) {
  return (
    <details className="json">
      <summary>{label}</summary>
      <JsonNode value={value} />
    </details>
  );
}

function JsonNode({ value }: { value: unknown }) {
  if (value === null || typeof value !== 'object') {
    return (
      <code className={`json__leaf json__leaf--${value === null ? 'null' : typeof value}`}>
        {JSON.stringify(value)}
      </code>
    );
  }
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return <code>{Array.isArray(value) ? '[]' : '{}'}</code>;
  return (
    <ul className="json__list">
      {entries.map(([key, item]) => (
        <li key={key}>
          {item !== null && typeof item === 'object' ? (
            <details open={entries.length < 8}>
              <summary className="mono">
                {key}: {Array.isArray(item) ? `[${item.length}]` : '{…}'}
              </summary>
              <JsonNode value={item} />
            </details>
          ) : (
            <span className="mono">
              {key}: <JsonNode value={item} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Renders an undocumented activity item: known keys in plain view, everything else as JSON. */
export function ActivityItem({ item }: { item: unknown }) {
  if (typeof item === 'string') return <span>{item}</span>;
  if (!item || typeof item !== 'object') return <code>{JSON.stringify(item)}</code>;
  const record = item as Record<string, unknown>;
  const tool = record.tool ?? record.name ?? record.model ?? record.type ?? record.kind;
  const status = record.status ?? record.result;
  const summary = record.summary ?? record.message ?? record.description ?? record.action;
  const failed = typeof status === 'string' && /fail|error|unavailable/i.test(status);
  return (
    <div className={`activity${failed || record.error ? ' activity--failed' : ''}`}>
      <div className="activity__head">
        {tool !== undefined ? <code>{String(tool)}</code> : null}
        {status !== undefined ? <span className="activity__status">{String(status)}</span> : null}
        {typeof record.duration_ms === 'number' ? (
          <span className="mono muted">{record.duration_ms} ms</span>
        ) : null}
      </div>
      {summary !== undefined ? <p>{String(summary)}</p> : null}
      {record.error ? <p className="activity__error">{String(record.error)}</p> : null}
      <JsonView value={item} label="All fields" />
    </div>
  );
}
