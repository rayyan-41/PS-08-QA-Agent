import { readPublicConfig, type AppConfig } from '../../../config/public-config';
export type { AppConfig };
export async function loadConfig(): Promise<AppConfig> {
  return readPublicConfig(import.meta.env);
}
