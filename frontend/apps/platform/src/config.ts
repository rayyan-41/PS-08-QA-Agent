import { z } from 'zod';

/**
 * Platform runtime configuration, read from /config.json at startup.
 *
 * The console is served by the backend itself, so the default API base is ""
 * (same origin, requests go to "/api/..."). If /config.json is missing or
 * invalid the console still starts with these defaults and reports the problem.
 */
export interface PlatformConfig {
  /** "" means same origin. Otherwise an absolute http(s) origin or base path. */
  apiBaseUrl: string;
  auth: 'none' | 'firebase';
  /** Whether the developer inspector is allowed. */
  devtools: boolean;
  /** Named backend targets offered by the inspector's target switcher. */
  backendPresets: Record<string, string>;
  firebase?: { apiKey: string; authDomain: string; projectId: string; appId: string };
  portalUrl?: string;
  /** Problems found while loading configuration, shown to the user. */
  setupErrors: string[];
}

export const DEFAULT_CONFIG: PlatformConfig = {
  apiBaseUrl: '',
  auth: 'none',
  devtools: true,
  backendPresets: { 'same-origin': '', local: 'http://localhost:8080' },
  setupErrors: [],
};

/** "" (same origin) or an http(s) URL without credentials, query or fragment. */
export function isValidApiBase(value: string): boolean {
  if (value === '') return true;
  try {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

const apiBase = z.string().trim().refine(isValidApiBase, {
  message: 'Use "" for same origin, or an http(s) URL without credentials, query or fragment.',
});

const schema = z.object({
  apiBaseUrl: apiBase.default(''),
  auth: z.enum(['none', 'firebase']).default('none'),
  devtools: z.boolean().default(false),
  backendPresets: z.record(z.string(), apiBase).default(DEFAULT_CONFIG.backendPresets),
  firebase: z
    .object({
      apiKey: z.string().min(1),
      authDomain: z.string().min(1),
      projectId: z.string().min(1),
      appId: z.string().min(1),
    })
    .optional(),
  portalUrl: z.string().url().optional(),
});

export function parseConfig(input: unknown): PlatformConfig {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ...DEFAULT_CONFIG,
      setupErrors: parsed.error.issues.map(
        (issue) => `config.json ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
    };
  }
  const setupErrors: string[] = [];
  if (parsed.data.auth === 'firebase' && !parsed.data.firebase) {
    setupErrors.push('config.json sets auth to "firebase" but has no firebase web configuration.');
  }
  return { ...parsed.data, setupErrors };
}

export async function loadConfig(): Promise<PlatformConfig> {
  try {
    const response = await fetch('/config.json', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseConfig(await response.json());
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ...DEFAULT_CONFIG,
      setupErrors: [`/config.json could not be read (${reason}). Using same-origin defaults.`],
    };
  }
}

/**
 * Devtools are on when config.json allows them, or in local development with
 * ?devtools=1. A production config without the flag cannot be overridden.
 */
export function devtoolsEnabled(config: PlatformConfig, search: string): boolean {
  if (config.devtools) return true;
  return import.meta.env.DEV && new URLSearchParams(search).get('devtools') === '1';
}
