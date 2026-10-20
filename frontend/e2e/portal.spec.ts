import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const portal = 'http://127.0.0.1:5175';

test('Begin demo opens the client portal and its actual sample CSV', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/#demo');
  await page.locator('#demo a').click();
  await expect(page).toHaveURL(`${portal}/`);
  await expect(
    page.getByRole('heading', { name: 'Company financials', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No records yet.' })).toBeVisible();
  await page
    .locator('.portal-heading-actions')
    .getByRole('link', { name: 'Import figures' })
    .click();
  await page.getByRole('button', { name: 'Use sample file' }).click();
  await expect(page.locator('.portal-file-meta')).toContainText('ps08_data_entries.csv');
  await expect(page.getByRole('button', { name: 'Send for review' })).toBeEnabled();
  const source = await page.request.get(`${portal}/ps08_data_entries.csv`);
  expect(source.ok()).toBe(true);
  expect((await source.text()).trim().split('\n')).toHaveLength(301);
});

// Response fixtures belong only to this test. The production portal calls the real API.
test('upload saves a draft, retries inspection on that same draft, and hands off for QA', async ({
  page,
}) => {
  let uploads = 0;
  let inspections = 0;
  let inspected = false;
  const inspection = {
    row_count: 300,
    column_count: 2,
    columns: [
      { name: 'entity', candidate_type: 'string', blank_count: 0, distinct_count: 10 },
      { name: 'value', candidate_type: 'number', blank_count: 0, distinct_count: 300 },
    ],
    preview: [{ entity: 'GlobalTech Inc', value: '31158.37' }],
    warnings: ['Test fixture: confirm reporting units before review.'],
  };
  await page.route(`${portal}/api/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/drafts' && request.method() === 'POST') {
      uploads += 1;
      expect(request.headers()['content-type']).toContain('multipart/form-data; boundary=');
      expect(request.postDataBuffer()?.toString()).toContain('filename="ps08_data_entries.csv"');
      return route.fulfill({ json: { draft_id: 'test-draft', version: 1, status: 'uploaded' } });
    }
    if (path === '/api/drafts/test-draft/inspect' && request.method() === 'POST') {
      inspections += 1;
      if (inspections === 1)
        return route.fulfill({
          status: 503,
          json: { detail: 'Inspection temporarily unavailable.' },
        });
      inspected = true;
      return route.fulfill({ json: { draft_id: 'test-draft', version: 1, inspection } });
    }
    if (path === '/api/drafts/test-draft')
      return route.fulfill({
        json: {
          id: 'test-draft',
          version: 1,
          status: inspected ? 'inspected' : 'uploaded',
          ...(inspected ? { inspection } : {}),
        },
      });
    return route.fulfill({ status: 404, json: { detail: 'Review not started.' } });
  });
  await page.goto(`${portal}/import`);
  await page.getByRole('button', { name: 'Use sample file' }).click();
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page).toHaveURL(`${portal}/import/test-draft`);
  await expect(page.getByRole('alert')).toContainText('Inspection temporarily unavailable.');
  await expect(page.getByRole('link', { name: 'Open in Pokayoke' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Retry inspection' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for QA review.' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'GlobalTech Inc' })).toBeVisible();
  await expect(page.getByText('These figures are not in the accepted database yet.')).toBeVisible();
  const handoff = new URL(
    (await page.getByRole('link', { name: 'Open in Pokayoke' }).getAttribute('href')) ?? '',
  );
  expect(handoff.origin).toBe('http://127.0.0.1:5174');
  expect(handoff.pathname).toBe('/jobs/test-draft/profile');
  expect(handoff.searchParams.get('return')).toBe(`${portal}/import/test-draft`);
  expect(uploads).toBe(1);
  expect(inspections).toBe(2);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ready for QA review.' })).toBeVisible();
  expect(uploads).toBe(1);
  expect(inspections).toBe(2);
  const audit = await new AxeBuilder({ page })
    .options({ preload: false })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
});

test('backend failure leaves the selected source recoverable without inventing a review', async ({
  page,
}) => {
  await page.route(`${portal}/api/drafts`, (route) =>
    route.fulfill({ status: 503, json: { detail: 'The review service is unavailable.' } }),
  );
  await page.goto(`${portal}/import`);
  await page.getByRole('button', { name: 'Use sample file' }).click();
  await page.getByRole('button', { name: 'Send for review' }).click();
  await expect(page.getByRole('alert')).toContainText('The review service is unavailable.');
  await expect(page.locator('.portal-file-meta')).toContainText('ps08_data_entries.csv');
  await expect(page.getByRole('button', { name: 'Send for review' })).toBeEnabled();
  await expect(page).toHaveURL(`${portal}/import`);
  await expect(page.getByRole('link', { name: 'Open in Pokayoke' })).toHaveCount(0);
});

test('file validation and accessible desktop import layout', async ({ page }) => {
  await page.goto(`${portal}/import`);
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'figures.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('Choose a CSV file.');
  await expect(page.getByRole('button', { name: 'Send for review' })).toBeDisabled();
  for (const width of [1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  const audit = await new AxeBuilder({ page })
    .options({ preload: false })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
});
