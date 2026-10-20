import { describe, expect, it } from 'vitest';
import { readPublicConfig } from '../config/public-config';
import { assertProductionMocksDisabled } from '../config/production-mock-guard';

describe('public app configuration', () => {
  it('shows missing backend configuration without inventing a URL', () => {
    expect(readPublicConfig({})).toMatchObject({
      apiBaseUrl: undefined,
      setupErrors: [expect.stringContaining('VITE_API_BASE_URL')],
    });
  });
  it('preserves proxy paths for the health client', () => {
    expect(readPublicConfig({ VITE_API_BASE_URL: 'https://example.test/api/' }).apiBaseUrl).toBe(
      'https://example.test/api/',
    );
  });
  it.each([
    'javascript:alert(1)',
    'https://user:password@example.test',
    'https://example.test?secret=1',
  ])('rejects unsafe URL %s', (url) => {
    expect(readPublicConfig({ VITE_API_BASE_URL: url }).setupErrors.length).toBeGreaterThan(0);
  });
  it('does not silently connect while mock mode is requested', () => {
    const config = readPublicConfig({
      VITE_API_BASE_URL: 'https://example.test',
      VITE_USE_MOCKS: 'true',
    });
    expect(config.apiBaseUrl).toBeUndefined();
    expect(config.setupErrors.join(' ')).toContain('not implemented');
  });
  it('blocks production mocks including custom Vite build modes', () => {
    expect(() => assertProductionMocksDisabled('true')).toThrow();
    expect(() => assertProductionMocksDisabled('1')).toThrow();
    expect(() => assertProductionMocksDisabled('false')).not.toThrow();
    expect(() => assertProductionMocksDisabled(undefined)).not.toThrow();
  });
});
