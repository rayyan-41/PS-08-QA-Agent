import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBackendHealth } from './health';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function queryWrapper() {
  const client = new QueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useBackendHealth', () => {
  it('waits for configuration before making a network request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useBackendHealth(), { wrapper: queryWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('starts checking when configuration arrives and exposes success metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { result, rerender } = renderHook(
      ({ url }: { url: string | undefined }) => useBackendHealth(url),
      { wrapper: queryWrapper(), initialProps: { url: undefined as string | undefined } },
    );

    rerender({ url: 'https://backend.example' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('exposes errors to the UI without automatic retries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useBackendHealth('https://backend.example'), {
      wrapper: queryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: 'http', status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
