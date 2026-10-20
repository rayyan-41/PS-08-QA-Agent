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
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  webServer: apps.map(([app, port]) => ({
    command: `pnpm --filter @pokayoke/${app} dev`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_BASE_URL: process.env.E2E_BACKEND_TEST_URL ?? '',
      VITE_PORTAL_URL: 'http://127.0.0.1:5175',
      VITE_PLATFORM_URL: 'http://127.0.0.1:5174',
      VITE_USE_MOCKS: 'false',
    },
  })),
});
