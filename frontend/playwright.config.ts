import { defineConfig, devices } from '@playwright/test';
const apps = [
  ['marketing', 5173],
  ['platform', 5174],
  ['client-portal', 5175],
] as const;
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'retain-on-failure',
  },
  webServer: apps.map(([app, port]) => ({
    command: `pnpm --filter @pokayoke/${app} dev`,
    url: `http://127.0.0.1:${port}`,
    // The test configuration must not inherit an unrelated developer server.
    reuseExistingServer: false,
    env: { VITE_API_BASE_URL: process.env.E2E_BACKEND_TEST_URL ?? '', VITE_USE_MOCKS: 'false' },
  })),
});
