import { useSyncExternalStore } from 'react';

/** One HTTP exchange, recorded for the developer inspector. */
export interface LoggedRequest {
  id: number;
  at: string;
  method: string;
  url: string;
  /** Path without the origin, e.g. /api/drafts/abc/plan. */
  path: string;
  status?: number;
  durationMs?: number;
  /** JSON text, or a summary such as "file: data.csv (12.3 KB)". */
  requestBody?: unknown;
  responseBody?: unknown;
  /** Set when no response arrived (network, CORS, timeout). */
  error?: string;
  /** Draft ID parsed from the path, for filtering. */
  draftId?: string;
  /** Headers that matter for reproducing the request as cURL. */
  contentType?: string;
}

const MAX_ENTRIES = 200;
let entries: LoggedRequest[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function startRequest(entry: Omit<LoggedRequest, 'id' | 'at'>): number {
  const id = nextId++;
  entries = [{ ...entry, id, at: new Date().toISOString() }, ...entries].slice(0, MAX_ENTRIES);
  emit();
  return id;
}

export function finishRequest(id: number, patch: Partial<LoggedRequest>) {
  entries = entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
  emit();
}

export function clearRequestLog() {
  entries = [];
  emit();
}

export function useRequestLog(): LoggedRequest[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => entries,
  );
}

export function draftIdFromPath(path: string): string | undefined {
  return /\/api\/drafts\/([^/?]+)/.exec(path)?.[1];
}

/** Rebuild a request as a cURL command. File bodies become a placeholder @path. */
export function toCurl(entry: LoggedRequest): string {
  const parts = [`curl -X ${entry.method} '${entry.url}'`];
  const body = entry.requestBody;
  if (body && typeof body === 'object' && 'file' in body) {
    const file = (body as { file: { name: string } }).file;
    parts.push(`-F 'file=@${file.name}'`);
  } else if (body !== undefined) {
    parts.push(`-H 'Content-Type: application/json'`);
    parts.push(`--data '${JSON.stringify(body).replace(/'/g, `'\\''`)}'`);
  }
  return parts.join(' \\\n  ');
}
