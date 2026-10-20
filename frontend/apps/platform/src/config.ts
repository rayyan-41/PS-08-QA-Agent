import { readPublicConfig, type AppConfig } from '../../../config/public-config';
export type { AppConfig };
export async function loadConfig(): Promise<AppConfig> {
  if (import.meta.env.DEV) return readPublicConfig(import.meta.env);
  try {
    const response = await fetch('/config.json', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('Runtime configuration could not be loaded.');
    return readPublicConfig(await response.json());
  } catch {
    return {
      setupErrors: [
        'Runtime configuration is unavailable. Configure the platform container and reload.',
      ],
    };
  }
}
