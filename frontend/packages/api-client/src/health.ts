import { useQuery } from '@tanstack/react-query';

/** Connectivity metadata only. The backend's health response body is not yet agreed. */
export interface BackendHealthResult {
  status: number;
  checkedAt: string;
}

export type ApiRequestErrorKind = 'configuration' | 'http' | 'network' | 'timeout' | 'aborted';

export class ApiRequestError extends Error {
  readonly kind: ApiRequestErrorKind;
  readonly status: number | undefined;

  constructor(kind: ApiRequestErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.kind = kind;
    this.status = status;
  }
}

export const backendHealthKeys = {
  all: ['backend-health'] as const,
  detail: (apiBaseUrl?: string) => ['backend-health', apiBaseUrl ?? null] as const,
};

interface HealthRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

function healthUrl(apiBaseUrl: string): string {
  let url: URL;
  try {
    url = new URL(apiBaseUrl);
  } catch {
    throw new ApiRequestError(
      'configuration',
      'Set a valid backend URL before checking connectivity.',
    );
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new ApiRequestError(
      'configuration',
      'Use an HTTP or HTTPS backend URL without credentials, a query, or a fragment.',
    );
  }
  // Preserve reverse-proxy base paths such as https://host.example/api.
  return `${apiBaseUrl.replace(/\/+$/, '')}/health`;
}

export async function checkBackendHealth(
  apiBaseUrl: string,
  { signal, timeoutMs = 10_000 }: HealthRequestOptions = {},
): Promise<BackendHealthResult> {
  const url = healthUrl(apiBaseUrl);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ApiRequestError(
      'configuration',
      'The connectivity timeout must be a positive number.',
    );
  }
  if (signal?.aborted) {
    throw new ApiRequestError('aborted', 'The connectivity check was cancelled.');
  }

  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!response.ok) {
      throw new ApiRequestError(
        'http',
        `The backend returned HTTP ${response.status}. Check the backend service and retry.`,
        response.status,
      );
    }
    return { status: response.status, checkedAt: new Date().toISOString() };
  } catch (error: unknown) {
    if (timedOut) {
      throw new ApiRequestError(
        'timeout',
        'The backend did not respond in time. Check the service and retry.',
      );
    }
    if (signal?.aborted) {
      throw new ApiRequestError('aborted', 'The connectivity check was cancelled.');
    }
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(
      'network',
      'The backend could not be reached. Check its URL, network connection, and CORS configuration, then retry.',
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function useBackendHealth(apiBaseUrl?: string) {
  return useQuery<BackendHealthResult, ApiRequestError>({
    queryKey: backendHealthKeys.detail(apiBaseUrl),
    queryFn: ({ signal }) => checkBackendHealth(apiBaseUrl ?? '', { signal }),
    enabled: Boolean(apiBaseUrl),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
