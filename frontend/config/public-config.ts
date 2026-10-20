import { z } from 'zod';

const publicUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  }, 'Use an HTTP(S) URL without credentials, query parameters, or a fragment.');
const optionalUrl = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  publicUrl.optional(),
);
const schema = z.object({
  VITE_API_BASE_URL: optionalUrl,
  VITE_PLATFORM_URL: optionalUrl,
  VITE_PORTAL_URL: optionalUrl,
  VITE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_USE_MOCKS: z.enum(['', 'false', 'true']).optional(),
});
export interface AppConfig {
  apiBaseUrl?: string;
  platformUrl?: string;
  portalUrl?: string;
  publishableKey?: string;
  firebase?: { apiKey: string; authDomain: string; projectId: string; appId: string };
  setupErrors: string[];
}
export function readPublicConfig(input: unknown): AppConfig {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return {
      setupErrors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  const value = parsed.data;
  const setupErrors: string[] = [];
  if (!value.VITE_API_BASE_URL)
    setupErrors.push('Set VITE_API_BASE_URL to connect this app to the backend.');
  if (value.VITE_USE_MOCKS === 'true')
    setupErrors.push('Mock mode is not implemented in this scaffold. Connect a real backend.');
  return {
    apiBaseUrl: value.VITE_USE_MOCKS === 'true' ? undefined : value.VITE_API_BASE_URL,
    platformUrl: value.VITE_PLATFORM_URL,
    portalUrl: value.VITE_PORTAL_URL,
    publishableKey: value.VITE_PUBLISHABLE_KEY,
    firebase:
      value.VITE_FIREBASE_API_KEY &&
      value.VITE_FIREBASE_AUTH_DOMAIN &&
      value.VITE_FIREBASE_PROJECT_ID &&
      value.VITE_FIREBASE_APP_ID
        ? {
            apiKey: value.VITE_FIREBASE_API_KEY,
            authDomain: value.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: value.VITE_FIREBASE_PROJECT_ID,
            appId: value.VITE_FIREBASE_APP_ID,
          }
        : undefined,
    setupErrors,
  };
}
