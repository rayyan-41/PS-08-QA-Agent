import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const platform = 'http://127.0.0.1:5174';

test('platform console opens with an honest empty job list and accessible desktop layout', async ({
  page,
}) => {
  // Browser fixtures exercise the console; they do not claim a live backend result.
  await page.route(`${platform}/api/health`, (route) =>
    route.fulfill({ json: { status: 'ok', storage: 'test-fixture' } }),
  );
  await page.goto(platform);
  await expect(page.getByRole('heading', { name: 'Jobs created in this browser' })).toBeVisible();
  await expect(page.getByText('No jobs yet', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('link', { name: 'New job', exact: true }),
  ).toHaveAttribute('href', '/jobs/new');
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.matches(':focus-visible'))).toBe(true);
  const audit = await new AxeBuilder({ page })
    .options({ preload: false })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test('platform inspector shows a real request error and retries health on demand', async ({
  page,
}) => {
  let healthy = false;
  let attempts = 0;
  await page.route(`${platform}/api/health`, (route) => {
    attempts += 1;
    return route.fulfill(
      healthy
        ? { json: { status: 'ok', storage: 'test-fixture' } }
        : { status: 503, json: { detail: 'Unavailable test fixture' } },
    );
  });
  await page.goto(platform);
  await page.getByRole('button', { name: 'Inspector', exact: true }).click();
  const inspector = page.getByRole('complementary', { name: 'Developer inspector' });
  await expect(inspector.getByRole('alert')).toContainText('Unavailable test fixture');
  await expect(inspector.getByRole('alert')).toContainText('HTTP 503');
  const beforeRetry = attempts;
  healthy = true;
  await inspector.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(inspector.getByText('test-fixture', { exact: true })).toBeVisible();
  expect(attempts).toBeGreaterThan(beforeRetry);
});
