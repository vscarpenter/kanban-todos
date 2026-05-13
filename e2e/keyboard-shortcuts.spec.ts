import { test, expect, type Page } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('press N opens new task dialog', async ({ page }) => {
    await page.keyboard.press('n');

    await expect(page.getByRole('heading', { name: 'Create New Task' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Ctrl+K opens new task dialog', async ({ page }) => {
    await page.keyboard.press('Control+K');

    await expect(page.getByRole('heading', { name: 'Create New Task' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Cmd+K opens new task dialog', async ({ page }) => {
    await page.keyboard.press('Meta+K');

    await expect(page.getByRole('heading', { name: 'Create New Task' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press H opens keyboard shortcuts help', async ({ page }) => {
    await page.keyboard.press('h');

    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press F1 opens user guide', async ({ page }) => {
    await page.keyboard.press('F1');

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Ctrl+, opens settings', async ({ page }) => {
    await page.keyboard.press('Control+,');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Cmd+, opens settings', async ({ page }) => {
    await page.keyboard.press('Meta+,');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('Escape closes the new task dialog', async ({ page }) => {
    await page.keyboard.press('n');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('Enter in new task dialog creates task', async ({ page }) => {
    await page.keyboard.press('n');
    await page.getByLabel('Title *').fill('Quick Task');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('.task-card', { hasText: 'Quick Task' })).toBeVisible();
  });

  test('press Ctrl+1 switches to first board', async ({ page }) => {
    await createBoard(page, 'Second Board');
    await selectBoard(page, 'Second Board');
    await expect(page.getByRole('heading', { name: 'Second Board' })).toBeVisible();

    await page.keyboard.press('Control+1');

    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('press Cmd+1 switches to first board', async ({ page }) => {
    await createBoard(page, 'Second Board');
    await selectBoard(page, 'Second Board');

    await page.keyboard.press('Meta+1');

    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('shortcuts are suppressed while typing in inputs', async ({ page }) => {
    await page.keyboard.press('n');
    await page.getByLabel('Title *').focus();

    // Typing 'n' inside the input should not open another dialog.
    await page.keyboard.type('n');

    await expect(page.getByRole('dialog')).toHaveCount(1);

    await page.keyboard.press('Escape');
  });

  test('Escape closes nested confirmation dialog', async ({ page }) => {
    await page.keyboard.press('Control+,');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.getByRole('button', { name: 'Reset Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Reset Settings' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Reset Settings' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('Tab navigates focus inside the dialog', async ({ page }) => {
    await page.keyboard.press('n');

    await expect(page.getByLabel('Title *')).toBeFocused();

    await page.keyboard.press('Tab');
    // Focus moves to the next field — exact target depends on implementation.
    await expect(page.getByLabel('Title *')).not.toBeFocused();

    await page.keyboard.press('Escape');
  });
});

// Helper functions

async function createBoard(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Add board' }).click();
  await page.getByLabel('Board Name *').fill(name);
  await page.getByRole('button', { name: 'Create Board' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

async function selectBoard(page: Page, name: string): Promise<void> {
  await page
    .locator('[role="button"]', { has: page.getByText(name, { exact: true }) })
    .filter({ hasNotText: 'Move ' })
    .first()
    .click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}
