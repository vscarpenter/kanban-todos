import { test, expect, type Page } from '@playwright/test';

const FORMAT_VERSION = '1.0.0';

interface MinimalImportPayload {
  version: string;
  exportedAt: string;
  tasks: Array<Record<string, unknown>>;
  boards: Array<Record<string, unknown>>;
  settings?: Record<string, unknown>;
}

function buildPayload(overrides: Partial<MinimalImportPayload> = {}): MinimalImportPayload {
  return {
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: [],
    boards: [],
    ...overrides,
  };
}

function payloadToBuffer(payload: unknown): Buffer {
  return Buffer.from(JSON.stringify(payload), 'utf-8');
}

test.describe('Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('imports a valid JSON file with new tasks', async ({ page }) => {
    await openImport(page);

    // Build a payload that creates a new board with a unique id and a single task
    // referencing that board. This avoids conflicts with the default Work Tasks board.
    const boardId = 'imported-board-' + Date.now();
    const taskId = 'imported-task-' + Date.now();

    const payload = buildPayload({
      boards: [
        {
          id: boardId,
          name: 'Imported Board',
          description: 'From import test',
          color: '#6B4A87',
          isDefault: false,
          order: 99,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tasks: [
        {
          id: taskId,
          title: 'Imported Task',
          status: 'todo',
          boardId,
          priority: 'medium',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    await uploadImportFile(page, payload);

    // Step 2: preview screen — verify the counts
    await expect(page.getByRole('heading', { name: 'Preview Data' })).toBeVisible();
    await expect(page.getByText('Tasks').first()).toBeVisible();
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();

    // Continue to the next step (no conflicts → import runs automatically)
    await page.getByRole('button', { name: /Start import/i }).click();

    // Step 5: complete
    await expect(page.getByRole('heading', { name: 'Import Complete!' })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole('button', { name: /Close import/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Verify the imported board now appears in the sidebar
    await expect(
      page.locator('[role="button"]', {
        has: page.getByText('Imported Board', { exact: true }),
      })
    ).toBeVisible();
  });

  test('shows error when importing malformed JSON', async ({ page }) => {
    await openImport(page);

    await page.locator('input[type="file"]#import-file-input').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('this is { not valid json', 'utf-8'),
    });

    // The error alert renders within the FileSelectStep
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('shows error when importing JSON missing required fields', async ({ page }) => {
    await openImport(page);

    // Missing required `version` and `tasks`/`boards` arrays
    const invalidPayload = { foo: 'bar' };

    await page.locator('input[type="file"]#import-file-input').setInputFiles({
      name: 'invalid-shape.json',
      mimeType: 'application/json',
      buffer: payloadToBuffer(invalidPayload),
    });

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('preview Back button returns to file select step', async ({ page }) => {
    await openImport(page);

    await uploadImportFile(page, buildPayload());

    await expect(page.getByRole('heading', { name: 'Preview Data' })).toBeVisible();

    await page.getByRole('button', { name: /^Back$/ }).click();

    await expect(page.getByRole('heading', { name: 'Select File' })).toBeVisible();
  });

  test('reflects file size and version in the preview', async ({ page }) => {
    await openImport(page);

    const payload = buildPayload();

    await uploadImportFile(page, payload);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Preview Data' })).toBeVisible();
    // Dialog scoping is needed because the sidebar version indicator also
    // shows a version number; only the preview row should match here.
    await expect(dialog.getByText(FORMAT_VERSION)).toBeVisible();
    await expect(dialog.getByText(/File Size/)).toBeVisible();
  });

  test('imports a payload with settings included', async ({ page }) => {
    await openImport(page);

    const payload = buildPayload({
      settings: {
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        enableDeveloperMode: false,
        searchPreferences: { defaultScope: 'current-board', rememberScope: true },
        accessibility: { highContrast: false, reduceMotion: false, fontSize: 'medium' },
      },
    });

    await uploadImportFile(page, payload);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Preview Data' })).toBeVisible();

    // Settings row should render in the preview when included. Scope to the
    // dialog because the sidebar also has a "Settings" nav item.
    await expect(dialog.getByText('Settings', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Included')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('detects conflicts when re-importing a board with the same ID', async ({ page }) => {
    await openImport(page);

    const sharedBoardId = 'shared-board-id';
    const buildBoardPayload = () =>
      buildPayload({
        boards: [
          {
            id: sharedBoardId,
            name: 'Conflict Board',
            color: '#6B4A87',
            isDefault: false,
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        tasks: [],
      });

    // First import should succeed without a conflict step
    await uploadImportFile(page, buildBoardPayload());
    await expect(page.getByRole('heading', { name: 'Preview Data' })).toBeVisible();
    await page.getByRole('button', { name: /Start import/i }).click();
    await expect(page.getByRole('heading', { name: 'Import Complete!' })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole('button', { name: /Close import/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Second import with the same board id should raise a conflict
    await openImport(page);
    await uploadImportFile(page, buildBoardPayload());
    await expect(page.getByRole('heading', { name: 'Preview Data' })).toBeVisible();
    await page.getByRole('button', { name: /Start import/i }).click();

    // Should advance to the conflict resolution step. The heading "Resolve
    // Conflicts" appears both as the dialog title (DialogTitle) and as a
    // section heading in the step body, so we match by the dialog's title
    // role specifically.
    const conflictDialog = page.getByRole('dialog');
    await expect(
      conflictDialog.getByRole('heading', { name: 'Resolve Conflicts' }).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(conflictDialog.getByText(/board\(s\) with matching IDs/)).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('cancels import and resets state on close', async ({ page }) => {
    await openImport(page);

    await uploadImportFile(page, buildPayload());
    await expect(page.getByRole('heading', { name: 'Preview Data' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    // Re-opening should reset back to the Select File step
    await openImport(page);
    await expect(page.getByRole('heading', { name: 'Select File' })).toBeVisible();
    await page.keyboard.press('Escape');
  });
});

// Helper functions

async function openImport(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: /Open sidebar/i });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
  await page.getByRole('button', { name: 'Import Data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Select File' })).toBeVisible();
}

async function uploadImportFile(
  page: Page,
  payload: unknown,
  filename = 'import.json'
): Promise<void> {
  await page.locator('input[type="file"]#import-file-input').setInputFiles({
    name: filename,
    mimeType: 'application/json',
    buffer: payloadToBuffer(payload),
  });

  // Once a valid file is parsed, the dialog enables a "Review import" button
  // on the file-select step. Click it to advance to the preview.
  const reviewBtn = page.getByRole('button', { name: /Review import/i });
  await expect(reviewBtn).toBeVisible({ timeout: 5000 });
  await reviewBtn.click();
}
