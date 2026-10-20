import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['marketing.spec.ts', 'portal.spec.ts'],
  fullyParallel: true,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  webServer: [
    ['marketing', 5173],
    ['client-portal', 5175],
  ].map(([app, port]) => ({
    command: `pnpm --filter @pokayoke/${app} dev`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_PORTAL_URL: 'http://127.0.0.1:5175',
      VITE_PLATFORM_URL: 'http://127.0.0.1:5174',
      VITE_API_BASE_URL: '',
      VITE_USE_MOCKS: 'false',
    },
  })),
});
