import { beforeEach, describe, expect, it, vi } from 'vitest';
import { platformDraftUrl, readRecentDrafts, saveRecentDraft, updateRecentDraft } from './drafts';
import { readPortalConfig } from '../config';

const draft = {
  id: 'abc',
  filename: 'financials.csv',
  version: 1,
  createdAt: '2026-10-20T08:00:00.000Z',
  updatedAt: '2026-10-20T08:00:00.000Z',
};
beforeEach(() => localStorage.clear());

describe('portal local draft metadata', () => {
  it('persists only validated navigation metadata and replaces a repeated draft ID', () => {
    saveRecentDraft(draft);
    updateRecentDraft('abc', { version: 2 });
    expect(readRecentDrafts()).toHaveLength(1);
    expect(readRecentDrafts()[0]).toMatchObject({ id: 'abc', version: 2 });
    expect(readRecentDrafts()[0]).not.toHaveProperty('status');
  });
  it('survives corrupt or unavailable storage', () => {
    localStorage.setItem('pokayoke.client-portal.recent-drafts.v1', 'not json');
    expect(readRecentDrafts()).toEqual([]);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveRecentDraft(draft)).not.toThrow();
    spy.mockRestore();
  });
  it('preserves the draft and portal return route in the platform handoff', () => {
    const link = new URL(
      platformDraftUrl('https://quality.test', 'draft one', 'https://portal.test'),
    );
    expect(link.pathname).toBe('/jobs/draft%20one/profile');
    expect(link.searchParams.get('return')).toBe('https://portal.test/import/draft%20one');
    expect(platformDraftUrl('', 'abc')).toBe('');
  });
});

describe('portal connection configuration', () => {
  it('uses only the configured dev proxy and local platform default in development', () => {
    expect(readPortalConfig({ DEV: true })).toEqual({
      apiBaseUrl: '',
      apiReady: true,
      platformUrl: 'http://127.0.0.1:5174',
      setupErrors: [],
    });
  });
  it('requires production configuration and accepts explicit same-origin API deployment', () => {
    expect(readPortalConfig({ DEV: false }).setupErrors).toHaveLength(2);
    expect(
      readPortalConfig({ VITE_API_BASE_URL: '/', VITE_PLATFORM_URL: 'https://quality.test' }),
    ).toEqual({
      apiBaseUrl: '',
      apiReady: true,
      platformUrl: 'https://quality.test',
      setupErrors: [],
    });
    expect(
      readPortalConfig({ DEV: true, VITE_PLATFORM_URL: 'javascript:alert(1)' }).platformUrl,
    ).toBe('');
    expect(readPortalConfig({ DEV: false }).apiReady).toBe(false);
    expect(readPortalConfig({ DEV: false, VITE_API_BASE_URL: ' ' }).apiReady).toBe(false);
    expect(readPortalConfig({ DEV: true, VITE_API_BASE_URL: 'javascript:alert(1)' }).apiReady).toBe(
      false,
    );
    expect(readPortalConfig({ DEV: true, VITE_USE_MOCKS: 'true' }).apiReady).toBe(false);
    expect(readPortalConfig({ VITE_API_BASE_URL: 'https://backend.test' }).apiReady).toBe(true);
  });
});
