import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'packages/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      'apps/client-portal/**/*.test.{ts,tsx}',
    ],
    restoreMocks: true,
  },
});
