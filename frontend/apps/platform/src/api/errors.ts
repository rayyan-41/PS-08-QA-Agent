import type { ErrorBody } from '@pokayoke/api-client';

export type ApiErrorKind = 'http' | 'network' | 'timeout';

/**
 * A failed backend call, carrying what is needed to diagnose it on screen:
 * the route, the HTTP status (if any) and FastAPI's `detail`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly method: string;
  readonly path: string;
  readonly detail: string;
  readonly body?: unknown;

  constructor(opts: {
    kind: ApiErrorKind;
    method: string;
    path: string;
    detail: string;
    status?: number;
    body?: unknown;
  }) {
    super(opts.detail);
    this.name = 'ApiError';
    this.kind = opts.kind;
    this.status = opts.status;
    this.method = opts.method;
    this.path = opts.path;
    this.detail = opts.detail;
    this.body = opts.body;
  }
}

/** Turn FastAPI's `detail` (string, or a list on 422) into readable text. */
export function detailText(body: unknown): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as ErrorBody).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((item) => `${item.loc?.join('.') ?? ''}: ${item.msg}`).join('; ');
    }
    return JSON.stringify(detail);
  }
  if (typeof body === 'string' && body.trim()) return body.slice(0, 500);
  return 'The backend returned no explanation.';
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isStatus(error: unknown, status: number): boolean {
  return isApiError(error) && error.status === status;
}

/** True when no response arrived, so the outcome of a write is unknown. */
export function isNoResponse(error: unknown): boolean {
  return isApiError(error) && (error.kind === 'network' || error.kind === 'timeout');
}
