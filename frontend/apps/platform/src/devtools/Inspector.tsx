import { useEffect, useId, useReducer, useState } from 'react';
import { useMatch } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, RefreshCw, X } from '@pokayoke/ui';
import { useBackend } from '../api/context';
import { keys } from '../api/keys';
import { isValidApiBase } from '../config';
import { clearRequestLog, toCurl, useRequestLog } from '../api/request-log';
import { ErrorPanel, JsonView } from '../components/states';
import { formatTime, targetLabel } from '../lib/format';
import { TestRunner } from './TestRunner';

const TABS = ['Target', 'Requests', 'Raw state', 'Tests'] as const;
type Tab = (typeof TABS)[number];

/** Developer inspector for testing a backend. Only mounted when devtools are enabled. */
export function Inspector({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('Target');
  return (
    <aside className="inspector" aria-label="Developer inspector">
      <header className="inspector__head">
        <h2 className="h3">Inspector</h2>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={onClose}
          aria-label="Close inspector"
        >
          <X aria-hidden size={16} />
        </button>
      </header>
      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? 'is-active' : undefined}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="inspector__body">
        {tab === 'Target' ? <TargetPanel /> : null}
        {tab === 'Requests' ? <RequestLog /> : null}
        {tab === 'Raw state' ? <RawState /> : null}
        {tab === 'Tests' ? <TestRunner /> : null}
      </div>
    </aside>
  );
}

/** Polls GET /api/health every 15s with latency. Shared by the top bar and the inspector. */
export function useHealth() {
  const { backend, target } = useBackend();
  return useQuery({
    queryKey: keys.health(target),
    queryFn: async () => {
      const started = performance.now();
      const health = await backend.health();
      return { ...health, latencyMs: Math.round(performance.now() - started) };
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

function TargetPanel() {
  const { config, target, setTarget } = useBackend();
  const health = useHealth();
  const customId = useId();
  const presets = { 'same-origin': '', ...config.backendPresets };
  const isPreset = Object.values(presets).includes(target);
  const [custom, setCustom] = useState(isPreset ? '' : target);
  const [customError, setCustomError] = useState<string>();
  const mixed = window.location.protocol === 'https:' && target.startsWith('http:');

  return (
    <div className="stack">
      <fieldset className="field">
        <legend>Backend target</legend>
        {Object.entries(presets).map(([name, url]) => (
          <label key={name}>
            <input
              type="radio"
              name="target"
              checked={target === url}
              onChange={() => setTarget(url)}
            />{' '}
            {name === 'same-origin' ? 'This backend (same origin)' : name}{' '}
            <span className="mono muted small">{url || window.location.origin}</span>
          </label>
        ))}
      </fieldset>
      <form
        className="field"
        onSubmit={(event) => {
          event.preventDefault();
          const value = custom.trim().replace(/\/+$/, '');
          if (!isValidApiBase(value)) {
            setCustomError('Use an http(s) URL without credentials, query or fragment.');
            return;
          }
          setCustomError(undefined);
          setTarget(value);
        }}
      >
        <label htmlFor={customId}>Custom URL</label>
        <div className="row">
          <input
            id={customId}
            className="mono"
            value={custom}
            placeholder="https://pokayoke-api-….run.app"
            onChange={(e) => setCustom(e.target.value)}
          />
          <button type="submit" className="btn btn--secondary btn--small">
            Use
          </button>
        </div>
        {customError ? <p className="field__error">{customError}</p> : null}
      </form>
      <p className="small">
        Active: <span className="mono">{targetLabel(target)}</span>
      </p>
      {mixed ? (
        <p className="field__error" role="alert">
          This console is served over https but the target is http. Browsers block these requests
          (mixed content).
        </p>
      ) : null}
      {target !== '' ? (
        <p className="muted small">
          Cross-origin target: the backend must allow the origin{' '}
          <span className="mono">{window.location.origin}</span> (CORS).
        </p>
      ) : null}

      <h3 className="h4">Health</h3>
      {health.isPending ? (
        <p>Checking…</p>
      ) : health.error ? (
        <ErrorPanel error={health.error} onRetry={() => void health.refetch()} />
      ) : (
        <dl className="facts">
          <dt>status</dt>
          <dd className={health.data.status === 'ok' ? 'text-pass mono' : 'text-hold mono'}>
            {health.data.status}
          </dd>
          <dt>storage</dt>
          <dd className="mono">{health.data.storage}</dd>
          <dt>latency</dt>
          <dd className="mono">{health.data.latencyMs} ms</dd>
          <dt>checked</dt>
          <dd>{formatTime(new Date(health.dataUpdatedAt).toISOString())} (every 15s)</dd>
        </dl>
      )}
    </div>
  );
}

function RequestLog() {
  const log = useRequestLog();
  const [filter, setFilter] = useState('');
  const filterId = useId();
  const shown = filter ? log.filter((entry) => entry.draftId?.includes(filter.trim())) : log;
  return (
    <div className="stack">
      <div className="row">
        <label htmlFor={filterId} className="small">
          Filter by job ID
        </label>
        <input
          id={filterId}
          className="mono"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button type="button" className="btn btn--ghost btn--small" onClick={clearRequestLog}>
          Clear
        </button>
      </div>
      {shown.length === 0 ? <p className="muted">No requests recorded.</p> : null}
      <ul className="reqlog">
        {shown.map((entry) => (
          <li
            key={entry.id}
            className={entry.error || (entry.status ?? 0) >= 400 ? 'is-failed' : undefined}
          >
            <details>
              <summary className="mono small">
                <span className="reqlog__status">
                  {entry.status ?? (entry.error ? 'ERR' : '…')}
                </span>{' '}
                {entry.method} {entry.path}{' '}
                <span className="muted">
                  {entry.durationMs !== undefined ? `${entry.durationMs} ms` : ''}
                </span>
              </summary>
              <div className="stack">
                <p className="small muted">
                  {formatTime(entry.at)} · {entry.url}
                </p>
                {entry.error ? <p className="field__error">{entry.error}</p> : null}
                {entry.requestBody !== undefined ? (
                  <JsonView value={entry.requestBody} label="Request body" />
                ) : null}
                {entry.responseBody !== undefined ? (
                  <JsonView value={entry.responseBody} label="Response body" />
                ) : null}
                <button
                  type="button"
                  className="btn btn--secondary btn--small"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(toCurl(entry))
                      .then(() => toast.success('cURL copied'))
                      .catch(() => toast.error('Clipboard is not available'));
                  }}
                >
                  <Copy aria-hidden size={14} /> Copy as cURL
                </button>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RawState() {
  const { target } = useBackend();
  const queryClient = useQueryClient();
  const match = useMatch('/jobs/:id/*');
  const id = match?.params.id;
  // Re-render whenever the query cache changes so this view stays current.
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => queryClient.getQueryCache().subscribe(() => rerender()), [queryClient]);
  if (!id || id === 'new') return <p className="muted">Open a job to see its raw state.</p>;
  const draft = queryClient.getQueryData(keys.draft(target, id));
  const plan = queryClient.getQueryData(keys.plan(target, id));
  const review = queryClient.getQueryData(keys.review(target, id));
  let receipt: unknown;
  try {
    const raw = window.localStorage.getItem(`pokayoke.receipt:${target}:${id}`);
    receipt = raw ? JSON.parse(raw) : undefined;
  } catch {
    receipt = undefined;
  }
  return (
    <div className="stack">
      <button
        type="button"
        className="btn btn--secondary btn--small"
        onClick={() =>
          void queryClient.invalidateQueries({ predicate: (q) => q.queryKey.includes(id) })
        }
      >
        <RefreshCw aria-hidden size={14} /> Refresh
      </button>
      <JsonView value={draft ?? null} label="draft (GET /api/drafts/{id})" />
      <JsonView value={plan ?? null} label="plan (GET /plan)" />
      <JsonView value={review ?? null} label="review (GET /review)" />
      <JsonView value={receipt ?? null} label="receipt (last submit from this browser)" />
    </div>
  );
}
