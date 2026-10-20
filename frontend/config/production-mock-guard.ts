import { loadEnv, type Plugin } from 'vite';
export function assertProductionMocksDisabled(value: string | undefined): void {
  if (value && value !== 'false')
    throw new Error('Production builds require VITE_USE_MOCKS to be false or empty.');
}
export function productionMockGuard(): Plugin {
  return {
    name: 'pokayoke-production-mock-guard',
    config(_config, environment) {
      if (environment.command !== 'build') return;
      const values = loadEnv(environment.mode, process.cwd(), 'VITE_');
      assertProductionMocksDisabled(process.env.VITE_USE_MOCKS ?? values.VITE_USE_MOCKS);
    },
  };
}
