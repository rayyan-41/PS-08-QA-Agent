import { z } from 'zod';
import type { AppConfig } from '../../../config/public-config';
export type { AppConfig };

const portalUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  });

export function readMarketingConfig(
  input: Record<string, unknown>,
  development = false,
): AppConfig {
  const configured = input.VITE_PORTAL_URL;
  if (configured === undefined || configured === '') {
    return { portalUrl: development ? 'http://127.0.0.1:5175' : undefined, setupErrors: [] };
  }
  const parsed = portalUrlSchema.safeParse(configured);
  if (!parsed.success) return { setupErrors: ['The demo link is not available yet.'] };
  return { portalUrl: parsed.data, setupErrors: [] };
}

export async function loadConfig(): Promise<AppConfig> {
  return readMarketingConfig(import.meta.env, import.meta.env.DEV);
}
