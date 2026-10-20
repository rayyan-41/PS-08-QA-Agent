import { afterEach, describe, expect, it, vi } from 'vitest';
import { backendHealthKeys, checkBackendHealth } from './health';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function pendingFetch() {
  return vi.fn((_url: string, options: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      options.signal?.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      );
    });
  });
}

describe('backend connectivity', () => {
  it('preserves the configured base path and accepts a non-JSON success body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('healthy', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await checkBackendHealth('https://backend.example/api/');

    expect(fetchMock).toHaveBeenCalledWith('https://backend.example/api/health', {
      method: 'GET',
      signal: expect.any(AbortSignal),
      cache: 'no-store',
      credentials: 'omit',
    });
    expect(result.status).toBe(200);
    expect(Number.isNaN(Date.parse(result.checkedAt))).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['checkedAt', 'status']);
  });

  it('reports a failing HTTP status without reading an undocumented error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('private backend details', { status: 503 })),
    );

    await expect(checkBackendHealth('https://backend.example')).rejects.toMatchObject({
      name: 'ApiRequestError',
      kind: 'http',
      status: 503,
    });
  });

  it('provides an actionable error after a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(checkBackendHealth('https://backend.example')).rejects.toMatchObject({
      kind: 'network',
      message: expect.stringContaining('CORS'),
    });
  });

  it('aborts the request at the timeout and clears its timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', pendingFetch());
    const request = checkBackendHealth('https://backend.example', { timeoutMs: 500 });
    const rejection = expect(request).rejects.toMatchObject({ kind: 'timeout' });

    await vi.advanceTimersByTimeAsync(500);

    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('propagates caller cancellation and removes its listener', async () => {
    vi.stubGlobal('fetch', pendingFetch());
    const controller = new AbortController();
    const removeListener = vi.spyOn(controller.signal, 'removeEventListener');
    const request = checkBackendHealth('https://backend.example', { signal: controller.signal });
    const rejection = expect(request).rejects.toMatchObject({ kind: 'aborted' });

    controller.abort();

    await rejection;
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('does not send a request when already cancelled', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();

    await expect(
      checkBackendHealth('https://backend.example', { signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'aborted' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    '',
    'file:///tmp/service',
    'https://backend.example?token=secret',
    'https://user:secret@backend.example',
  ])('rejects invalid configuration before making a request: %s', async (url) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(checkBackendHealth(url)).rejects.toMatchObject({ kind: 'configuration' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('separates health caches by the configured backend', () => {
    expect(backendHealthKeys.detail('https://first.example')).not.toEqual(
      backendHealthKeys.detail('https://second.example'),
    );
    expect(backendHealthKeys.detail()).toEqual(['backend-health', null]);
  });
});
