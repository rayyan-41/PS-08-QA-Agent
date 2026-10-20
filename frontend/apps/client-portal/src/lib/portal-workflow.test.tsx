import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePortalImport, usePortalSubmission } from '../hooks/usePortalWorkflow';
import { readRecentDrafts, saveRecentDraft } from './drafts';
import { PortalApiError } from '../api/portal-api';

const api = vi.hoisted(() => ({
  upload: vi.fn(),
  inspect: vi.fn(),
  getDraft: vi.fn(),
  getReview: vi.fn(),
  getReceipt: vi.fn(),
  downloadUrl: vi.fn(),
}));
vi.mock('../api/portal-api', async (original) => ({
  ...(await original<typeof import('../api/portal-api')>()),
  createPortalApi: () => api,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});
afterEach(cleanup);

describe('portal upload and inspection state', () => {
  it('persists the real uploaded ID before handing off and retries only inspection after a failure', async () => {
    api.upload.mockResolvedValue({ draft_id: 'draft-live', version: 1, status: 'uploaded' });
    const navigated = vi.fn();
    const upload = renderHook(() => usePortalImport('https://backend.test', navigated), {
      wrapper,
    });
    act(() => upload.result.current.selectFile(new File(['a\n1'], 'financials.csv')));
    act(() => upload.result.current.submit());
    await waitFor(() => expect(navigated).toHaveBeenCalledWith('draft-live'));
    expect(readRecentDrafts()[0]).toMatchObject({ id: 'draft-live', filename: 'financials.csv' });

    const uploaded = { id: 'draft-live', version: 1, status: 'uploaded' };
    api.getDraft.mockResolvedValue(uploaded);
    api.inspect.mockImplementationOnce(async () => {
      expect(readRecentDrafts()[0].id).toBe('draft-live');
      throw new PortalApiError('Inspection failed', 503);
    });
    api.getReview.mockRejectedValue(new PortalApiError('No review', 404));
    const submission = renderHook(
      () => usePortalSubmission('https://backend.test', 'draft-live', 'https://platform.test'),
      { wrapper },
    );
    await waitFor(() => expect(submission.result.current.inspectError).toBe('Inspection failed'));
    expect(api.upload).toHaveBeenCalledTimes(1);
    expect(api.inspect).toHaveBeenCalledTimes(1);
    api.inspect.mockResolvedValueOnce({
      draft_id: 'draft-live',
      version: 1,
      inspection: { row_count: 1 },
    });
    api.getDraft.mockResolvedValue({
      ...uploaded,
      status: 'inspected',
      inspection: {
        row_count: 1,
        column_count: 1,
        columns: [{ name: 'a' }],
        preview: [{ a: '1' }],
        warnings: [],
      },
    });
    act(() => submission.result.current.retryInspect());
    await waitFor(() => expect(submission.result.current.statusLabel).toBe('Ready for QA profile'));
    expect(api.inspect).toHaveBeenCalledTimes(2);
    expect(api.upload).toHaveBeenCalledTimes(1);
    expect(submission.result.current.previewRows).toEqual([['1']]);
    expect(submission.result.current.receipt).toBeUndefined();
  });

  it('never treats a local draft or an accepted status alone as an acceptance receipt', async () => {
    const now = new Date().toISOString();
    saveRecentDraft({
      id: 'abc',
      version: 1,
      filename: 'figures.csv',
      createdAt: now,
      updatedAt: now,
    });
    api.getDraft.mockResolvedValue({ id: 'abc', version: 1, status: 'accepted' });
    api.getReview.mockRejectedValue(new PortalApiError('No review', 404));
    const submission = renderHook(() => usePortalSubmission('https://backend.test', 'abc'), {
      wrapper,
    });
    await waitFor(() => expect(submission.result.current.draft?.status).toBe('accepted'));
    expect(submission.result.current.receipt).toBeUndefined();
    expect(submission.result.current.downloadUrl).toBeUndefined();
    expect(api.getReceipt).not.toHaveBeenCalled();
  });
});
