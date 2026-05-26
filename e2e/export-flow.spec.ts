import { test, expect, type Page } from '@playwright/test';

interface ExportData {
  version: string;
  exportedAt: string;
  tasks: Array<{ id: string; title: string; boardId: string }>;
  boards: Array<{ id: string; name: string; isDefault?: boolean }>;
  settings?: Record<string, unknown>;
}

test.describe('Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('downloads a full export with tasks, boards, and settings', async ({ page }) => {
    await createTask(page, 'Exportable Task A');
    await createTask(page, 'Exportable Task B');

    await openExport(page);

    const data = await captureExport(page, async () => {
      await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    });

    expect(data.version).toBe('1.0.0');
    expect(typeof data.exportedAt).toBe('string');
    expect(data.tasks.length).toBeGreaterThanOrEqual(2);

    const titles = data.tasks.map((t) => t.title);
    expect(titles).toContain('Exportable Task A');
    expect(titles).toContain('Exportable Task B');

    expect(data.boards.length).toBeGreaterThanOrEqual(1);
    expect(data.boards.some((b) => b.name === 'Work Tasks')).toBe(true);

    expect(data.settings).toBeDefined();
  });

  test('downloads filename matches the displayed filename', async ({ page }) => {
    await openExport(page);

    // The export dialog renders the proposed filename in a font-mono span next
    // to "Filename:". Scope to the dialog so we don't pick up the ⌘K shortcut
    // chip in the search bar (which also uses font-mono).
    const expectedFilename = (await page
      .getByRole('dialog')
      .locator('.font-mono')
      .first()
      .textContent())?.trim();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);
    if (expectedFilename) {
      expect(download.suggestedFilename()).toBe(expectedFilename);
    }
  });

  test('export with only tasks excludes boards and settings', async ({ page }) => {
    await createTask(page, 'Tasks Only');

    await openExport(page);
    await page.locator('#includeBoards').click();
    await page.locator('#includeSettings').click();

    const data = await captureExport(page, async () => {
      await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    });

    expect(data.tasks.length).toBeGreaterThanOrEqual(1);
    expect(data.boards).toHaveLength(0);
    expect(data.settings).toBeUndefined();
  });

  test('export with only boards excludes tasks and settings', async ({ page }) => {
    await openExport(page);
    await page.locator('#includeTasks').click();
    await page.locator('#includeSettings').click();

    const data = await captureExport(page, async () => {
      await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    });

    expect(data.tasks).toHaveLength(0);
    expect(data.boards.length).toBeGreaterThanOrEqual(1);
    expect(data.settings).toBeUndefined();
  });

  test('export with only settings excludes tasks and boards', async ({ page }) => {
    await openExport(page);
    await page.locator('#includeTasks').click();
    await page.locator('#includeBoards').click();

    const data = await captureExport(page, async () => {
      await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    });

    expect(data.tasks).toHaveLength(0);
    expect(data.boards).toHaveLength(0);
    expect(data.settings).toBeDefined();
  });

  test('export excludes archived tasks when toggle is off', async ({ page }) => {
    const archivedTitle = 'Archived Task';
    const activeTitle = 'Active Task';

    await createTask(page, archivedTitle);
    await archiveTask(page, archivedTitle);
    await createTask(page, activeTitle);

    await openExport(page);
    // Turn off archived tasks
    await page.locator('#includeArchivedTasks').click();
    await expect(page.locator('#includeArchivedTasks')).not.toBeChecked();

    const data = await captureExport(page, async () => {
      await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    });

    const titles = data.tasks.map((t) => t.title);
    expect(titles).toContain(activeTitle);
    expect(titles).not.toContain(archivedTitle);
  });

  test('export shows success toast', async ({ page }) => {
    await openExport(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    await downloadPromise;

    await expect(page.locator('[data-sonner-toast]', { hasText: /Export Successful/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('exports include task metadata (priority, tags, status)', async ({ page }) => {
    const title = 'Metadata Task';
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Title *').fill(title);

    await page.getByRole('button', { name: 'Show Details' }).click();
    const priorityTrigger = page
      .getByText('Priority', { exact: true })
      .locator('xpath=..')
      .getByRole('combobox');
    await priorityTrigger.click();
    await page.getByRole('option', { name: 'High', exact: true }).click();
    await page.getByLabel('Tags').fill('alpha, beta');

    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.locator('.task-card', { hasText: title }).first()).toBeVisible();

    await openExport(page);

    const data = await captureExport(page, async () => {
      await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    });

    const exported = data.tasks.find((t) => t.title === title) as
      | (typeof data.tasks)[number] & { priority: string; tags: string[]; status: string }
      | undefined;
    expect(exported).toBeDefined();
    expect(exported?.priority).toBe('high');
    expect(exported?.tags).toContain('alpha');
    expect(exported?.tags).toContain('beta');
    expect(exported?.status).toBe('todo');
  });
});

// Helper functions

async function openExport(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: /Open sidebar/i });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
  await page.getByRole('button', { name: 'Export Data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Export Data' })).toBeVisible();
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(page.locator('.task-card', { hasText: title }).first()).toBeVisible();
}

async function archiveTask(page: Page, title: string): Promise<void> {
  const card = page.locator('.task-card', { hasText: title }).first();
  await card.getByRole('button', { name: /Task options/i }).click();
  await page.getByRole('menuitem', { name: 'Archive' }).click();
  await expect(page.locator('.task-card', { hasText: title })).toHaveCount(0);
}

/**
 * Triggers a download and reads the resulting file as parsed JSON.
 *
 * downloadAsJson uses an anchor + Blob URL to trigger the download. Playwright
 * captures it via the `download` event, and `download.path()` resolves once
 * the browser writes the file to disk.
 */
async function captureExport(
  page: Page,
  trigger: () => Promise<void>
): Promise<ExportData> {
  const downloadPromise = page.waitForEvent('download');
  await trigger();
  const download = await downloadPromise;

  const path = await download.path();
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path, 'utf-8');
  return JSON.parse(content) as ExportData;
}
