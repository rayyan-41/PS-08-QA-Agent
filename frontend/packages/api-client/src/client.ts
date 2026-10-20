import createClient from 'openapi-fetch';
import type { paths } from './schema';

/** Typed fetch client for the Pokayoke backend. One client per base URL. */
export function createApiClient(apiBaseUrl: string) {
  return createClient<paths>({ baseUrl: apiBaseUrl.replace(/\/+$/, '') });
}

export type ApiClient = ReturnType<typeof createApiClient>;
