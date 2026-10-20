import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPortalApi, PortalApiError } from './portal-api';

afterEach(() => vi.unstubAllGlobals());

describe('portal API uses the actual draft contract', () => {
  it('surfaces FastAPI upload validation errors without retrying the mutation', async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'CSV exceeds 10 MB' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', transport);
    const api = createPortalApi('https://backend.test');
    await expect(api.upload(new File(['a,b\n1,2'], 'file.csv'))).rejects.toMatchObject({
      status: 413,
      message: 'CSV exceeds 10 MB',
    });
    expect(transport).toHaveBeenCalledTimes(1);
    expect((transport.mock.calls[0][0] as Request).url).toBe('https://backend.test/api/drafts');
  });

  it('keeps inspect and upload separate and allows inspection retry for the existing ID', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ draft_id: 'draft-1', version: 1, status: 'uploaded' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'Inspection temporarily unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            draft_id: 'draft-1',
            version: 1,
            inspection: { row_count: 1, column_count: 2, columns: [], preview: [], warnings: [] },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', transport);
    const api = createPortalApi('https://backend.test/');
    const draft = await api.upload(new File(['a,b\n1,2'], 'file.csv'));
    await expect(api.inspect(draft.draft_id)).rejects.toBeInstanceOf(PortalApiError);
    expect((await api.inspect(draft.draft_id)).inspection.row_count).toBe(1);
    expect(transport.mock.calls.map((call) => new URL((call[0] as Request).url).pathname)).toEqual([
      '/api/drafts',
      '/api/drafts/draft-1/inspect',
      '/api/drafts/draft-1/inspect',
    ]);
  });

  it('reports connection failure and does not create fabricated status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(createPortalApi('https://backend.test').getDraft('unknown')).rejects.toMatchObject(
      { status: null, message: expect.stringContaining('Could not connect') },
    );
  });

  it('rejects an invalid upload response before it can enter the local draft history', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 'uploaded' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await expect(
      createPortalApi('https://backend.test').upload(new File(['a\n1'], 'file.csv')),
    ).rejects.toMatchObject({ message: expect.stringContaining('unexpected response') });
  });
});
