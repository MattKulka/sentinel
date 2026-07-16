import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// One axe scan per meaningful view. WCAG 2.1 A/AA rule tags keep the scan
// focused on the standards employers care about.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('the schedule board has no detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Lead cover/ })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test('the schedule board is accessible in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('button', { name: /Lead cover/ }).waitFor();

  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations).toEqual([]);
});

test('the shift dialog has no detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /new shift/i }).click();
  await expect(page.getByRole('dialog', { name: /new shift/i })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations).toEqual([]);
});
