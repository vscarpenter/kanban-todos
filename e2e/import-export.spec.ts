import { test, expect, type Page } from '@playwright/test';

test.describe('Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('opens export dialog', async ({ page }) => {
    await openExport(page);

    await expect(page.getByRole('heading', { name: 'Export Data' })).toBeVisible();
    await expect(page.getByText('Export your tasks, boards, and settings to a JSON file')).toBeVisible();
  });

  test('opens import dialog', async ({ page }) => {
    await openImport(page);

    await expect(page.getByRole('heading', { name: 'Select File' })).toBeVisible();
    await expect(page.getByText('Choose a JSON file to import')).toBeVisible();
  });

  test('export dialog shows task statistics', async ({ page }) => {
    await createTask(page, 'Task 1');
    await createTask(page, 'Task 2');

    await openExport(page);

    // The Tasks badge shows "{count} total"
    await expect(page.getByText('2 total').first()).toBeVisible();
  });

  test('can toggle export option switches', async ({ page }) => {
    await openExport(page);

    const tasksSwitch = page.locator('#includeTasks');
    await expect(tasksSwitch).toBeChecked();
    await tasksSwitch.click();
    await expect(tasksSwitch).not.toBeChecked();

    const boardsSwitch = page.locator('#includeBoards');
    await boardsSwitch.click();
    await expect(boardsSwitch).not.toBeChecked();

    const settingsSwitch = page.locator('#includeSettings');
    await settingsSwitch.click();
    await expect(settingsSwitch).not.toBeChecked();
  });

  test('can toggle archived items inclusion', async ({ page }) => {
    await openExport(page);

    const archivedTasksSwitch = page.locator('#includeArchivedTasks');
    const initialTasksState = await archivedTasksSwitch.isChecked();
    await archivedTasksSwitch.click();
    expect(await archivedTasksSwitch.isChecked()).toBe(!initialTasksState);

    const archivedBoardsSwitch = page.locator('#includeArchivedBoards');
    const initialBoardsState = await archivedBoardsSwitch.isChecked();
    await archivedBoardsSwitch.click();
    expect(await archivedBoardsSwitch.isChecked()).toBe(!initialBoardsState);
  });

  test('export count updates when options change', async ({ page }) => {
    await openExport(page);

    const itemsRow = page.locator('div').filter({ hasText: /^Items to export:/ }).first();
    const initialCount = await itemsRow.textContent();

    await page.locator('#includeTasks').click();

    const newCount = await itemsRow.textContent();
    expect(newCount).not.toBe(initialCount);
  });

  test('validates export before exporting', async ({ page }) => {
    await openExport(page);

    await page.getByRole('button', { name: 'Validate Export' }).click();
    await expect(page.getByRole('heading', { name: 'Validation Results' })).toBeVisible();
  });

  test('cannot export with no data selected', async ({ page }) => {
    await openExport(page);

    await page.locator('#includeTasks').click();
    await page.locator('#includeBoards').click();
    await page.locator('#includeSettings').click();

    await expect(exportSubmitButton(page)).toBeDisabled();
  });

  test('cancels export dialog', async ({ page }) => {
    await openExport(page);

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('import dialog shows file input affordance', async ({ page }) => {
    await openImport(page);

    // The native file input is hidden; users click the "Choose File" button.
    await expect(page.getByRole('button', { name: 'Choose File' })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
  });

  test('import dialog has no Review import button before file selection', async ({ page }) => {
    await openImport(page);

    await expect(page.getByRole('button', { name: 'Review import' })).toHaveCount(0);
  });

  test('closes import dialog with Escape', async ({ page }) => {
    await openImport(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('export options default to enabled', async ({ page }) => {
    await openExport(page);

    await expect(page.locator('#includeTasks')).toBeChecked();
    await expect(page.locator('#includeBoards')).toBeChecked();
    await expect(page.locator('#includeSettings')).toBeChecked();
  });

  test('export with only tasks selected', async ({ page }) => {
    await openExport(page);

    await page.locator('#includeBoards').click();
    await page.locator('#includeSettings').click();

    await expect(page.locator('#includeTasks')).toBeChecked();
    await expect(page.locator('#includeBoards')).not.toBeChecked();
    await expect(page.locator('#includeSettings')).not.toBeChecked();
  });

  test('export filename is displayed', async ({ page }) => {
    await openExport(page);

    await expect(page.locator('.font-mono').first()).toBeVisible();
  });

  test('export and import dialogs can be opened independently', async ({ page }) => {
    await openExport(page);
    await expect(page.getByRole('heading', { name: 'Export Data' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await openImport(page);
    await expect(page.getByRole('heading', { name: 'Select File' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

// Helper functions

async function openSidebar(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: /Open sidebar/i });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
}

async function openExport(page: Page): Promise<void> {
  await openSidebar(page);
  await page.getByRole('button', { name: 'Export Data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Export Data' })).toBeVisible();
}

async function openImport(page: Page): Promise<void> {
  await openSidebar(page);
  await page.getByRole('button', { name: 'Import Data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Select File' })).toBeVisible();
}

// The submit button shares the "Export Data" text; scope to the dialog footer
// to disambiguate from the dialog title that also reads "Export Data".
function exportSubmitButton(page: Page) {
  return page.getByRole('dialog').getByRole('button', { name: /Export Data|Exporting/ });
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(page.locator('.task-card', { hasText: title }).first()).toBeVisible();
}
