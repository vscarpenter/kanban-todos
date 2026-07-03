import type { Page, Locator } from '@playwright/test';
import { test, expect, createBoard, selectBoard, createTask, boardItem, taskCard } from './fixtures';

test.describe('Settings Management', () => {
  test('switches between light and dark theme', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Theme', 'Dark');
    await saveSettings(page);

    await openSettings(page);
    await expect(comboboxFor(page, 'Theme')).toContainText('Dark');

    await selectByLabel(page, 'Theme', 'Light');
    await saveSettings(page);
  });

  test('switches to system theme', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Theme', 'System');
    await saveSettings(page);
  });

  test('theme persists after page reload', async ({ page }) => {
    await openSettings(page);
    await selectByLabel(page, 'Theme', 'Dark');
    await saveSettings(page);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await openSettings(page);
    await expect(comboboxFor(page, 'Theme')).toContainText('Dark');

    await selectByLabel(page, 'Theme', 'System');
    await saveSettings(page);
  });

  test('enables auto-archive with custom days', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Auto-archive completed tasks after', '1 week');
    await saveSettings(page);

    await openSettings(page);
    await expect(comboboxFor(page, 'Auto-archive completed tasks after')).toContainText('1 week');
    await cancelOrDiscard(page);
  });

  test('changes auto-archive duration', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Auto-archive completed tasks after', '1 day');
    await saveSettings(page);

    await openSettings(page);
    await expect(comboboxFor(page, 'Auto-archive completed tasks after')).toContainText('1 day');
    await cancelOrDiscard(page);
  });

  test('toggles notifications', async ({ page }) => {
    await openSettings(page);

    const notificationsSwitch = page.getByRole('switch', { name: 'Enable notifications' });
    const initialState = await notificationsSwitch.isChecked();
    await notificationsSwitch.click();
    await saveSettings(page);

    await openSettings(page);
    expect(await notificationsSwitch.isChecked()).toBe(!initialState);

    await notificationsSwitch.click();
    await saveSettings(page);
  });

  test('toggles high contrast mode', async ({ page }) => {
    await openSettings(page);

    const highContrastSwitch = page.getByRole('switch', { name: 'High contrast mode' });
    await highContrastSwitch.click();
    await saveSettings(page);

    await openSettings(page);
    await expect(highContrastSwitch).toBeChecked();

    await highContrastSwitch.click();
    await saveSettings(page);
  });

  test('toggles reduce motion', async ({ page }) => {
    await openSettings(page);

    const reduceMotionSwitch = page.getByRole('switch', { name: 'Reduce motion' });
    await reduceMotionSwitch.click();
    await saveSettings(page);

    await openSettings(page);
    await expect(reduceMotionSwitch).toBeChecked();

    await reduceMotionSwitch.click();
    await saveSettings(page);
  });

  test('changes font size', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Font size', 'Large');
    await saveSettings(page);

    await openSettings(page);
    await expect(comboboxFor(page, 'Font size')).toContainText('Large');

    await selectByLabel(page, 'Font size', 'Medium');
    await saveSettings(page);
  });

  test('toggles keyboard shortcuts', async ({ page }) => {
    await openSettings(page);
    await ensureAdvancedExpanded(page);

    const keyboardSwitch = page.getByRole('switch', { name: 'Keyboard shortcuts' });
    const initialState = await keyboardSwitch.isChecked();
    await keyboardSwitch.click();
    await saveSettings(page);

    await openSettings(page);
    await ensureAdvancedExpanded(page);
    expect(await keyboardSwitch.isChecked()).toBe(!initialState);

    await keyboardSwitch.click();
    await saveSettings(page);
  });

  test('resets all settings to defaults', async ({ page }) => {
    await openSettings(page);
    await selectByLabel(page, 'Theme', 'Dark');
    await saveSettings(page);

    await openSettings(page);

    await page.getByRole('button', { name: 'Reset Settings' }).click();
    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();

    await openSettings(page);
    await expect(comboboxFor(page, 'Theme')).toContainText('System');
    await cancelOrDiscard(page);
  });

  test('reset app clears persisted boards and tasks', async ({ page }) => {
    await createBoard(page, 'Reset Board');
    await selectBoard(page, 'Reset Board');
    await createTask(page, 'Reset Task');

    await openSettings(page);
    await ensureAdvancedExpanded(page);
    await page.getByRole('button', { name: 'Reset App to Default' }).click();

    await expect(page.getByRole('heading', { name: 'Reset Application' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue to reset' }).click();

    await expect(page.getByRole('heading', { name: 'Final Confirmation' })).toBeVisible();
    await page.getByRole('button', { name: 'Reset Everything' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
    await expect(boardItem(page, 'Reset Board')).toHaveCount(0);
    await expect(taskCard(page, 'Reset Task')).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
    await expect(boardItem(page, 'Reset Board')).toHaveCount(0);
    await expect(taskCard(page, 'Reset Task')).toHaveCount(0);
  });

  test('cancels settings changes without modifications', async ({ page }) => {
    await openSettings(page);

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('shows unsaved changes warning when cancelling with changes', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Theme', 'Dark');

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();

    await page.getByRole('button', { name: 'Discard' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('keeps editing when "Keep Editing" is pressed in unsaved changes warning', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Theme', 'Dark');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep Editing' }).click();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Clean up — discard so the next test starts fresh
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Discard' }).click();
  });

  test('changes multiple settings at once', async ({ page }) => {
    await openSettings(page);

    await selectByLabel(page, 'Theme', 'Dark');
    await selectByLabel(page, 'Auto-archive completed tasks after', '1 week');
    await page.getByRole('switch', { name: 'Enable notifications' }).click();

    await saveSettings(page);

    await openSettings(page);
    await expect(comboboxFor(page, 'Theme')).toContainText('Dark');
    await expect(comboboxFor(page, 'Auto-archive completed tasks after')).toContainText('1 week');

    await page.getByRole('button', { name: 'Reset Settings' }).click();
    await page.getByRole('button', { name: 'Reset' }).click();
  });
});

// Helper functions

async function openSettings(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: /Open sidebar/i });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}

function comboboxFor(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator('xpath=..').getByRole('combobox');
}

async function selectByLabel(page: Page, label: string, optionText: string): Promise<void> {
  await comboboxFor(page, label).click();
  await page.getByRole('option', { name: optionText, exact: true }).click();
}

async function saveSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

async function ensureAdvancedExpanded(page: Page): Promise<void> {
  // SettingsDialog preserves showAdvanced state across close/open, so we only
  // expand when the keyboard-shortcuts switch (only present in the Advanced
  // section) is not yet rendered.
  const shortcutsSwitch = page.locator('#keyboardShortcuts');
  if (!(await shortcutsSwitch.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Advanced' }).click();
    await expect(shortcutsSwitch).toBeVisible();
  }
}

async function cancelOrDiscard(page: Page): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  const discard = page.getByRole('button', { name: 'Discard' });
  if (await discard.isVisible().catch(() => false)) {
    await discard.click();
  }
  await expect(page.getByRole('dialog')).toBeHidden();
}
