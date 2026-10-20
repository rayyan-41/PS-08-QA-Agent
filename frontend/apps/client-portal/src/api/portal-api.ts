import {
  createApiClient,
  type DraftCreated,
  type Draft,
  type InspectResult,
  type Receipt,
  type Review,
} from '@pokayoke/api-client';

export class PortalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'PortalApiError';
  }
}

interface RequestOptions {
  signal?: AbortSignal;
}
interface ApiResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

function detailMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('detail' in body)) return undefined;
  const detail: unknown = body.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return (
      detail
        .flatMap((item: unknown) =>
          item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string'
            ? [item.msg]
            : [],
        )
        .join('; ') || undefined
    );
  return undefined;
}

/** Each operation has a timeout and abort signal; mutations are never retried automatically. */
async function request<T>(
  operation: (signal: AbortSignal) => Promise<ApiResult<T>>,
  options: RequestOptions = {},
  validate?: (data: T) => boolean,
): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) cancel();
  options.signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 120_000);
  try {
    const result = await operation(controller.signal);
    if (!result.response.ok)
      throw new PortalApiError(
        detailMessage(result.error) ?? `The backend returned HTTP ${result.response.status}.`,
        result.response.status,
      );
    if (result.data === undefined || result.data === null)
      throw new PortalApiError('The backend returned an empty response.', result.response.status);
    if (
      typeof result.data !== 'object' ||
      Array.isArray(result.data) ||
      (validate && !validate(result.data))
    )
      throw new PortalApiError(
        'The backend returned an unexpected response. Check the API configuration.',
        result.response.status,
      );
    return result.data;
  } catch (error) {
    if (error instanceof PortalApiError) throw error;
    if (error instanceof SyntaxError)
      throw new PortalApiError('The backend returned invalid JSON. Check the API configuration.');
    if (controller.signal.aborted)
      throw new PortalApiError(
        timedOut
          ? 'The backend took too long to respond. Refresh the draft before trying again.'
          : 'The request was cancelled.',
      );
    throw new PortalApiError(
      'Could not connect to the backend. Check the connection and try again.',
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancel);
  }
}

export function createPortalApi(baseUrl: string) {
  const client = createApiClient(baseUrl);
  return {
    upload(file: File, options?: RequestOptions): Promise<DraftCreated> {
      return request(
        (signal) =>
          client.POST('/api/drafts', {
            signal,
            body: { file },
            bodySerializer: (body) => {
              const form = new FormData();
              form.append('file', body.file);
              return form;
            },
          }),
        options,
        (data) =>
          typeof data.draft_id === 'string' &&
          data.draft_id.length > 0 &&
          Number.isInteger(data.version) &&
          data.version > 0 &&
          typeof data.status === 'string',
      );
    },
    inspect(id: string, options?: RequestOptions): Promise<InspectResult> {
      return request(
        (signal) => client.POST('/api/drafts/{id}/inspect', { signal, params: { path: { id } } }),
        options,
      );
    },
    getDraft(id: string, options?: RequestOptions): Promise<Draft> {
      return request(
        (signal) => client.GET('/api/drafts/{id}', { signal, params: { path: { id } } }),
        options,
      );
    },
    getReview(id: string, options?: RequestOptions): Promise<Review> {
      return request(
        (signal) => client.GET('/api/drafts/{id}/review', { signal, params: { path: { id } } }),
        options,
      );
    },
    getReceipt(receipt: string, options?: RequestOptions): Promise<Receipt> {
      return request(
        (signal) =>
          client.GET('/api/accepted/{receipt}', { signal, params: { path: { receipt } } }),
        options,
      );
    },
    downloadUrl(receipt: string): string {
      return `${baseUrl.replace(/\/+$/, '')}/api/accepted/${encodeURIComponent(receipt)}/download`;
    },
  };
}

export type PortalApi = ReturnType<typeof createPortalApi>;
