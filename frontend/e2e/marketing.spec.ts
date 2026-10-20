import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ids = [
  'hero',
  'problem',
  'why-rules',
  'poka-yoke',
  'workflow',
  'ninjas',
  'trust',
  'roadmap',
  'demo',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#hero h1')).toBeVisible();
});

test('complete narrative, sourced facts, sample illustrations, and demo handoff', async ({
  page,
}) => {
  for (const id of ids) await expect(page.locator(`section#${id}`)).toBeAttached();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(
    page.getByText('Workflow illustration · sample CSV evidence', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href*="234057_quality-program-snapshot"]')).toHaveCount(1);
  await expect(page.locator('a[href*="10.1016/j.chb.2011.04.004"]')).toHaveCount(1);
  await expect(page.locator('#demo a')).toHaveAttribute('href', 'http://127.0.0.1:5175');
  await expect(page.locator('footer')).toContainText('Ibtasaam');
  await expect(page.locator('footer')).toContainText('Rayyan');
  await expect(page.locator('footer')).toContainText('Abdullah');
  await expect(
    page.locator('footer a[href="https://github.com/rayyan-41/PS-08-QA-Agent"]'),
  ).toBeVisible();
});

test('presenter keyboard controls, section hashes, boundaries, and exit', async ({ page }) => {
  await page.keyboard.press('p');
  await expect(page.locator('.is-presenting')).toBeVisible();
  await expect(page.getByText('1 of 9', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#problem$/);
  await expect(page.getByText('2 of 9', { exact: true })).toBeVisible();
  await page.keyboard.press('PageDown');
  await expect(page).toHaveURL(/#why-rules$/);
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(/#poka-yoke$/);
  await page.keyboard.press('Home');
  await expect(page).toHaveURL(/#hero$/);
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/#hero$/);
  await page.keyboard.press('End');
  await expect(page).toHaveURL(/#demo$/);
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#demo$/);
  await page.keyboard.press('PageUp');
  await expect(page).toHaveURL(/#roadmap$/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.is-presenting')).toHaveCount(0);
});

test('deep-linked workflow presents all six phases and fits desktop slides', async ({ page }) => {
  await page.goto('/#workflow', { waitUntil: 'domcontentloaded' });
  await page.keyboard.press('p');
  await expect(page.getByText('5 of 9', { exact: true })).toBeVisible();
  for (const title of [
    'Receive and inspect',
    'Understand and configure',
    'Execute checks',
    'Investigate and explain',
    'Review and resolve',
    'Release and record',
  ]) {
    await expect(
      page.locator('#workflow').getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  for (let i = 0; i < ids.length; i++) {
    await page.keyboard.press('Home');
    for (let next = 0; next < i; next++) await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#${ids[i]}`)).toBeVisible();
    const metrics = await page.locator(`#${ids[i]}`).evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        scroll: element.scrollHeight,
        client: element.clientHeight,
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(1281);
    expect(metrics.top).toBeGreaterThanOrEqual(-1);
    expect(metrics.bottom).toBeLessThanOrEqual(721);
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 2);
  }
});

test('desktop layout, keyboard focus, and accessibility', async ({ page }) => {
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.matches(':focus-visible'))).toBe(true);
  const result = await new AxeBuilder({ page })
    .options({ preload: false })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('reduced motion keeps the complete story and presenter usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#hero h1')).toBeVisible();
  await page.keyboard.press('p');
  await page.keyboard.press('End');
  await expect(page.locator('#demo')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.is-presenting')).toHaveCount(0);
});

test('scrolling moves sample records and reveals each pinned workflow phase', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const record = page.locator('.travelling-record');
  const initialTransform = await record.evaluate((element) => getComputedStyle(element).transform);
  const phases = page.locator('.workflow-phase');
  for (let index = 0; index < 6; index++) {
    await page.locator('.workflow-sequence').evaluate((element, step) => {
      const start = element.getBoundingClientRect().top + window.scrollY;
      const travel = element.clientHeight - window.innerHeight;
      window.scrollTo({ top: start + ((step + 0.35) / 6) * travel, behavior: 'instant' });
    }, index);
    await expect
      .poll(async () =>
        phases.nth(index).evaluate((element) => Number(getComputedStyle(element).opacity)),
      )
      .toBeGreaterThan(0.9);
    await expect(page.locator('.data-spine')).toHaveAttribute('data-stage', String(index));
    await expect(page.locator(`[data-spine-popup="${index}"]`)).toHaveAttribute(
      'aria-hidden',
      'false',
    );
    await expect(page.locator(`[data-spine-popup="${index}"]`)).toBeVisible();
  }
  await expect
    .poll(async () => record.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(initialTransform);
});
