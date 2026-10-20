import { createApiClient } from '@pokayoke/api-client';
import type {
  CorrectionRequest,
  DecisionRequest,
  Draft,
  DraftCreated,
  DraftReviewed,
  Health,
  InspectResult,
  Plan,
  Profile,
  ProfileApproval,
  ProfileApproved,
  Receipt,
  Reference,
  Review,
} from '@pokayoke/api-client';
import { ApiError, detailText } from './errors';
import { draftIdFromPath, finishRequest, startRequest } from './request-log';

export type TokenGetter = () => Promise<string | undefined>;

async function describeRequestBody(request: Request): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('multipart/form-data')) {
      const form = await request.clone().formData();
      const summary: Record<string, unknown> = {};
      form.forEach((value, key) => {
        summary[key] =
          value instanceof File ? { name: value.name, size: value.size } : String(value);
      });
      return summary;
    }
    const text = await request.clone().text();
    if (!text) return undefined;
    return type.includes('json') ? JSON.parse(text) : text;
  } catch {
    return '(body could not be read)';
  }
}

async function describeResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.clone().text();
    if (!text) return undefined;
    const type = response.headers.get('content-type') ?? '';
    if (type.includes('json')) return JSON.parse(text);
    return text.length > 4000 ? `${text.slice(0, 4000)}… (${text.length} characters)` : text;
  } catch {
    return '(body could not be read)';
  }
}

/** fetch wrapper that records every exchange for the inspector and adds the auth header. */
function loggedFetch(getToken?: TokenGetter) {
  return async (input: Request): Promise<Response> => {
    const token = getToken ? await getToken() : undefined;
    if (token) input.headers.set('Authorization', `Bearer ${token}`);
    const url = new URL(input.url, window.location.href);
    const started = performance.now();
    const id = startRequest({
      method: input.method,
      url: url.href,
      path: url.pathname + url.search,
      requestBody: await describeRequestBody(input),
      draftId: draftIdFromPath(url.pathname),
      contentType: input.headers.get('content-type') ?? undefined,
    });
    try {
      const response = await fetch(input);
      finishRequest(id, {
        status: response.status,
        durationMs: Math.round(performance.now() - started),
        responseBody: await describeResponseBody(response),
      });
      return response;
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      finishRequest(id, {
        durationMs: Math.round(performance.now() - started),
        error: timedOut ? 'Timed out waiting for a response' : 'No response (network or CORS)',
      });
      throw error;
    }
  };
}

type Result<T> = { data?: T; error?: unknown; response: Response };

/**
 * Typed calls to every route in docs/api.md. Each returns the parsed body or
 * throws ApiError with the route, status and FastAPI `detail`.
 */
export function createBackend(baseUrl: string, getToken?: TokenGetter) {
  const client = createApiClient(baseUrl);
  const fetchImpl = loggedFetch(getToken);

  async function run<T>(method: string, path: string, call: () => Promise<Result<T>>) {
    let result: Result<T>;
    try {
      result = await call();
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      throw new ApiError({
        kind: timedOut ? 'timeout' : 'network',
        method,
        path,
        detail: timedOut ? 'The backend did not respond in time.' : 'No response from the backend.',
      });
    }
    if (!result.response.ok || result.data === undefined) {
      throw new ApiError({
        kind: 'http',
        method,
        path,
        status: result.response.status,
        detail: detailText(result.error),
        body: result.error,
      });
    }
    return result.data;
  }

  const id = (draftId: string) => ({ params: { path: { id: draftId } }, fetch: fetchImpl });
  const upload = (file: File) => ({
    body: { file },
    bodySerializer: () => {
      const form = new FormData();
      form.append('file', file);
      return form;
    },
    fetch: fetchImpl,
  });

  return {
    baseUrl,
    health: (signal?: AbortSignal): Promise<Health> =>
      run('GET', '/api/health', () =>
        client.GET('/api/health', {
          fetch: fetchImpl,
          signal: signal ?? AbortSignal.timeout(8000),
        }),
      ),
    createDraft: (file: File): Promise<DraftCreated> =>
      run('POST', '/api/drafts', () => client.POST('/api/drafts', upload(file))),
    inspect: (draftId: string): Promise<InspectResult> =>
      run('POST', `/api/drafts/${draftId}/inspect`, () =>
        client.POST('/api/drafts/{id}/inspect', id(draftId)),
      ),
    draft: (draftId: string): Promise<Draft> =>
      run('GET', `/api/drafts/${draftId}`, () => client.GET('/api/drafts/{id}', id(draftId))),
    plan: (draftId: string): Promise<Plan> =>
      run('GET', `/api/drafts/${draftId}/plan`, () =>
        client.GET('/api/drafts/{id}/plan', id(draftId)),
      ),
    profiles: (): Promise<Profile[]> =>
      run('GET', '/api/profiles', () => client.GET('/api/profiles', { fetch: fetchImpl })),
    uploadReference: (file: File): Promise<Reference> =>
      run('POST', '/api/references', () => client.POST('/api/references', upload(file))),
    approveProfile: (draftId: string, body: ProfileApproval): Promise<ProfileApproved> =>
      run('POST', `/api/drafts/${draftId}/profile`, () =>
        client.POST('/api/drafts/{id}/profile', { ...id(draftId), body }),
      ),
    runReview: (draftId: string): Promise<Review> =>
      run('POST', `/api/drafts/${draftId}/review`, () =>
        client.POST('/api/drafts/{id}/review', {
          ...id(draftId),
          signal: AbortSignal.timeout(180_000),
        }),
      ),
    review: (draftId: string): Promise<Review> =>
      run('GET', `/api/drafts/${draftId}/review`, () =>
        client.GET('/api/drafts/{id}/review', id(draftId)),
      ),
    correct: (draftId: string, body: CorrectionRequest): Promise<DraftReviewed> =>
      run('POST', `/api/drafts/${draftId}/corrections`, () =>
        client.POST('/api/drafts/{id}/corrections', { ...id(draftId), body }),
      ),
    decide: (draftId: string, body: DecisionRequest): Promise<DraftReviewed> =>
      run('POST', `/api/drafts/${draftId}/decisions`, () =>
        client.POST('/api/drafts/{id}/decisions', { ...id(draftId), body }),
      ),
    submit: (draftId: string): Promise<Receipt> =>
      run('POST', `/api/drafts/${draftId}/submit`, () =>
        client.POST('/api/drafts/{id}/submit', {
          ...id(draftId),
          signal: AbortSignal.timeout(60_000),
        }),
      ),
    accepted: (receipt: string): Promise<Receipt> =>
      run('GET', `/api/accepted/${receipt}`, () =>
        client.GET('/api/accepted/{receipt}', {
          params: { path: { receipt } },
          fetch: fetchImpl,
        }),
      ),
    downloadUrl: (receipt: string) =>
      `${baseUrl.replace(/\/+$/, '')}/api/accepted/${encodeURIComponent(receipt)}/download`,
  };
}

export type Backend = ReturnType<typeof createBackend>;
