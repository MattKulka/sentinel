import { expect, test } from '@playwright/test';

// These specs drive the app relative to whatever week is in view, so they are
// independent of the real calendar date the suite happens to run on.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait for the mocked data to load (a seeded shift is present).
  await expect(page.getByRole('button', { name: /Lead cover/ })).toBeVisible();
});

test('shows the seeded week with conflict warnings', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Sentinel' }),
  ).toBeVisible();

  // The seed double-books Ada on Wednesday.
  const conflictBadges = page.getByLabel(/scheduling conflict/i);
  await expect(conflictBadges).toHaveCount(2);
  await expect(page.getByText(/\d+ conflict/i)).toBeVisible();
});

test('creates a new shift and shows it on the board', async ({ page }) => {
  await page.getByRole('button', { name: /new shift/i }).click();

  const dialog = page.getByRole('dialog', { name: /new shift/i });
  await dialog.getByLabel(/title/i).fill('Inventory count');
  await dialog.getByLabel(/assign to/i).selectOption({ label: 'Grace Hopper' });
  await dialog.getByRole('button', { name: /save shift/i }).click();

  await expect(
    page.getByRole('button', { name: /Inventory count/ }),
  ).toBeVisible();
});

test('warns when a newly created shift double-books a person', async ({
  page,
}) => {
  // Two overlapping shifts for the same employee on the anchor day.
  for (const title of ['Double A', 'Double B']) {
    await page.getByRole('button', { name: /new shift/i }).click();
    const dialog = page.getByRole('dialog', { name: /new shift/i });
    await dialog.getByLabel(/title/i).fill(title);
    await dialog.getByLabel(/assign to/i).selectOption({ label: 'Alan Turing' });
    await dialog.getByRole('button', { name: /save shift/i }).click();
    await expect(page.getByRole('button', { name: title })).toBeVisible();
  }

  for (const title of ['Double A', 'Double B']) {
    await expect(
      page.getByRole('button', { name: title }).getByText(/conflict/i),
    ).toBeVisible();
  }
});

test('validates that end is after start', async ({ page }) => {
  await page.getByRole('button', { name: /new shift/i }).click();
  const dialog = page.getByRole('dialog', { name: /new shift/i });
  await dialog.getByLabel(/title/i).fill('Bad times');
  await dialog.getByLabel(/^end$/i).fill('06:00'); // before the 09:00 start
  await dialog.getByRole('button', { name: /save shift/i }).click();

  await expect(dialog.getByRole('alert')).toContainText(/after the start/i);
});

test('navigates to an empty future week', async ({ page }) => {
  const range = page.getByRole('heading', { level: 2 });
  const initial = await range.textContent();

  // Seed data only exists in the current week; step a few weeks ahead.
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: /next week/i }).click();
  }

  await expect(range).not.toHaveText(initial ?? '');
  await expect(
    page.getByText(/no shifts scheduled this week/i),
  ).toBeVisible();
});
