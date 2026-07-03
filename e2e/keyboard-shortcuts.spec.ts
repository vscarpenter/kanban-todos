import { test, expect, createBoard, selectBoard } from './fixtures';
import { pressShortcutUntilVisible } from './helpers/keyboard';

test.describe('Keyboard Shortcuts', () => {
  test('press N opens new task dialog', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'n', page.getByRole('heading', { name: 'Create New Task' }));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Ctrl+K opens new task dialog', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'Control+K', page.getByRole('heading', { name: 'Create New Task' }));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Cmd+K opens new task dialog', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'Meta+K', page.getByRole('heading', { name: 'Create New Task' }));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press H opens keyboard shortcuts help', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'h', page.getByRole('heading', { name: 'Keyboard Shortcuts' }));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press F1 opens user guide', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'F1', page.getByRole('dialog'));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Ctrl+, opens settings', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'Control+,', page.getByRole('heading', { name: 'Settings' }));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('press Cmd+, opens settings', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'Meta+,', page.getByRole('heading', { name: 'Settings' }));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('Escape closes the new task dialog', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'n', page.getByRole('dialog'));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('Enter in new task dialog creates task', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'n', page.getByRole('dialog'));
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
    await pressShortcutUntilVisible(page, 'n', page.getByRole('dialog'));
    await page.getByLabel('Title *').focus();

    // Typing 'n' inside the input should not open another dialog.
    await page.keyboard.type('n');

    await expect(page.getByRole('dialog')).toHaveCount(1);

    await page.keyboard.press('Escape');
  });

  test('Escape closes nested confirmation dialog', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'Control+,', page.getByRole('heading', { name: 'Settings' }));

    await page.getByRole('button', { name: 'Reset Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Reset Settings' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Reset Settings' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('Tab navigates focus inside the dialog', async ({ page }) => {
    await pressShortcutUntilVisible(page, 'n', page.getByRole('dialog'));

    await expect(page.getByLabel('Title *')).toBeFocused();

    await page.keyboard.press('Tab');
    // Focus moves to the next field — exact target depends on implementation.
    await expect(page.getByLabel('Title *')).not.toBeFocused();

    await page.keyboard.press('Escape');
  });
});
