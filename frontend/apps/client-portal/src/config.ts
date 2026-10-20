export interface PortalConfig {
  apiBaseUrl: string;
  apiReady: boolean;
  platformUrl: string;
  setupErrors: string[];
}

function publicUrl(value: string): boolean {
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

/** Read public connection settings once, never from individual components. */
export function readPortalConfig(env: Record<string, unknown>): PortalConfig {
  const setupErrors: string[] = [];
  const development = env.DEV === true;
  const configuredApi =
    typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL.trim() : undefined;
  const configuredPlatform =
    typeof env.VITE_PLATFORM_URL === 'string' ? env.VITE_PLATFORM_URL.trim() : '';
  let apiBaseUrl = configuredApi === '/' ? '' : (configuredApi ?? '');
  let apiReady = development || Boolean(configuredApi);
  let platformUrl = configuredPlatform || (development ? 'http://127.0.0.1:5174' : '');
  if (apiBaseUrl && !publicUrl(apiBaseUrl)) {
    setupErrors.push(
      'VITE_API_BASE_URL must be an HTTP(S) URL without credentials, query parameters, or a fragment.',
    );
    apiBaseUrl = '';
    apiReady = false;
  }
  if (!development && !configuredApi)
    setupErrors.push(
      'Set VITE_API_BASE_URL to the backend URL, or / when the backend is served on this origin.',
    );
  if (platformUrl && !publicUrl(platformUrl)) {
    setupErrors.push(
      'VITE_PLATFORM_URL must be an HTTP(S) URL without credentials, query parameters, or a fragment.',
    );
    platformUrl = '';
  }
  if (!platformUrl)
    setupErrors.push('Set VITE_PLATFORM_URL to open the Pokayoke review workspace.');
  if (env.VITE_USE_MOCKS === 'true') {
    apiReady = false;
    setupErrors.push('Mock responses are unavailable. Connect the real backend.');
  }
  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
    apiReady,
    platformUrl: platformUrl.replace(/\/+$/, ''),
    setupErrors,
  };
}

export async function loadConfig(): Promise<PortalConfig> {
  return readPortalConfig(import.meta.env);
}
