import { describe, expect, it } from 'vitest';
import { readMarketingConfig } from '../apps/marketing/src/config';

describe('marketing demo handoff', () => {
  it('works independently of a backend URL', () => {
    expect(readMarketingConfig({ VITE_PORTAL_URL: 'https://portal.example' })).toEqual({
      portalUrl: 'https://portal.example',
      setupErrors: [],
    });
  });
  it('uses the scaffold portal only during local development', () => {
    expect(readMarketingConfig({}, true).portalUrl).toBe('http://127.0.0.1:5175');
    expect(readMarketingConfig({}, false).portalUrl).toBeUndefined();
  });
  it.each(['javascript:alert(1)', 'https://user:password@example.test'])(
    'rejects unsafe demo links',
    (value) => {
      expect(readMarketingConfig({ VITE_PORTAL_URL: value }).portalUrl).toBeUndefined();
    },
  );
});
