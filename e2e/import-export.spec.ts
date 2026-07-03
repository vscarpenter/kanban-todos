import { readFile, writeFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect, createTask, createBoard, selectBoard, boardItem } from './fixtures';

test.describe('Import/Export', () => {
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

  test('exports a downloadable JSON backup with current boards, tasks, and settings', async ({ page }) => {
    await createBoard(page, 'Export Board', 'Board included in backup');
    await selectBoard(page, 'Export Board');
    await createTask(page, 'Exported Task');

    await openExport(page);

    const downloadPromise = page.waitForEvent('download');
    await exportSubmitButton(page).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^cascade-full-export-\d{4}-\d{2}-\d{2}\.json$/);

    const path = await download.path();
    expect(path).not.toBeNull();

    const backup = JSON.parse(await readFile(path as string, 'utf8')) as ExportBackup;
    const exportedBoard = backup.boards.find(board => board.name === 'Export Board');
    const exportedTask = backup.tasks.find(task => task.title === 'Exported Task');

    expect(backup.version).toBe('1.0.0');
    expect(exportedBoard).toBeDefined();
    expect(exportedTask).toBeDefined();
    expect(exportedTask?.boardId).toBe(exportedBoard?.id);
    expect(backup.settings?.theme).toBeDefined();
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

  test('imports valid JSON backup and renders imported board task', async ({ page }, testInfo) => {
    const importPath = testInfo.outputPath('valid-import.json');
    await writeFile(importPath, JSON.stringify(createImportBackup(), null, 2), 'utf8');

    await openImport(page);
    await page.locator('input[type="file"]').setInputFiles(importPath);

    await expect(page.getByText('valid-import.json')).toBeVisible();
    await page.getByRole('button', { name: 'Review import' }).click();

    await expect(page.getByRole('heading', { name: 'Preview Data' })).toBeVisible();
    await expect(page.getByText('Imported QA Task')).toHaveCount(0);

    await page.getByRole('button', { name: 'Start import' }).click();
    await expect(page.getByText('Import Complete!')).toBeVisible();
    await expect(page.getByText('Tasks imported:')).toBeVisible();
    await expect(page.getByText('Boards imported:')).toBeVisible();

    await page.getByRole('button', { name: 'Close import' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(boardItem(page, 'Imported Roadmap')).toBeVisible();
    await selectBoard(page, 'Imported Roadmap');
    await expect(page.locator('.task-card', { hasText: 'Imported QA Task' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Imported Roadmap' })).toBeVisible();
    await expect(page.locator('.task-card', { hasText: 'Imported QA Task' })).toBeVisible();
  });

  test('shows import error for malformed JSON file', async ({ page }, testInfo) => {
    const importPath = testInfo.outputPath('malformed-import.json');
    await writeFile(importPath, '{ this is not valid json', 'utf8');

    await openImport(page);
    await page.locator('input[type="file"]').setInputFiles(importPath);

    await expect(page.getByText(/Invalid JSON format/i)).toBeVisible();
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

interface ExportBackup {
  version: string;
  exportedAt: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    boardId: string;
    createdAt: string;
    updatedAt: string;
    priority: string;
    tags: string[];
  }>;
  boards: Array<{
    id: string;
    name: string;
    description?: string;
    color: string;
    isDefault: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
  }>;
  settings?: { theme?: string };
}

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

function createImportBackup(): ExportBackup {
  const now = '2026-01-02T03:04:05.000Z';

  return {
    version: '1.0.0',
    exportedAt: now,
    boards: [
      {
        id: 'imported-board-1',
        name: 'Imported Roadmap',
        description: 'Restored from an import file',
        color: '#2563eb',
        isDefault: false,
        order: 10,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks: [
      {
        id: 'imported-task-1',
        title: 'Imported QA Task',
        status: 'todo',
        boardId: 'imported-board-1',
        createdAt: now,
        updatedAt: now,
        priority: 'high',
        tags: ['imported', 'qa'],
      },
    ],
  };
}
