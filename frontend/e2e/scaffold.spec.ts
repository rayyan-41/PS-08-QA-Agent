import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const [name, port] of [
  ['marketing', 5173],
  ['platform', 5174],
  ['client-portal', 5175],
] as const) {
  test(`${name}: honest setup page, responsive layout, and accessibility`, async ({ page }) => {
    test.skip(
      Boolean(process.env.E2E_BACKEND_TEST_URL),
      'This case verifies genuinely missing configuration.',
    );
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Set VITE_API_BASE_URL', { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/Backend connected/)).toHaveCount(0);
    const accessibility = await new AxeBuilder({ page })
      .options({ preload: false })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.setViewportSize({ width: 360, height: 800 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.keyboard.press('Tab');
    const focusVisible = await page.evaluate(() =>
      document.activeElement?.matches(':focus-visible'),
    );
    expect(focusVisible).toBe(true);
  });

  test(`${name}: controlled health responses show loading, error, retry and success`, async ({
    page,
  }) => {
    const backendUrl = process.env.E2E_BACKEND_TEST_URL;
    test.skip(!backendUrl, 'Set E2E_BACKEND_TEST_URL to run isolated network-response fixtures.');
    if (!backendUrl) return;

    let attempts = 0;
    let fixtureStatus = 503;
    let releaseFirstResponse: (() => void) | undefined;
    const firstResponse = new Promise<void>((resolve) => {
      releaseFirstResponse = resolve;
    });
    await page.route(`${backendUrl.replace(/\/+$/, '')}/health`, async (route) => {
      attempts += 1;
      // StrictMode may cancel and remount the initial request. Gate every initial
      // request so the loading assertion does not depend on its request count.
      await firstResponse;
      await route.fulfill({
        status: fixtureStatus,
        headers: { 'access-control-allow-origin': '*' },
        body: fixtureStatus === 503 ? 'Unavailable test fixture' : 'Healthy test fixture',
      });
    });

    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Checking the backend' })).toBeVisible();
    releaseFirstResponse?.();
    await expect(page.getByRole('heading', { name: 'Backend connection failed' })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('HTTP 503');
    const attemptsBeforeRetry = attempts;
    fixtureStatus = 200;
    await page.getByRole('button', { name: 'Retry connection' }).click();
    await expect(page.getByRole('heading', { name: 'Backend reachable' })).toBeVisible();
    await expect(page.getByText('200', { exact: true })).toBeVisible();
    expect(attempts).toBe(attemptsBeforeRetry + 1);
    const accessibility = await new AxeBuilder({ page })
      .options({ preload: false })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  });
}
