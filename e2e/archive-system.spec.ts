import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('Archive System', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('manually archives completed task', async ({ page }) => {
    const taskTitle = 'Task to Archive';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);
    await expect(taskCard(page, taskTitle)).toHaveCount(0);
  });

  test('manually archives uncompleted task', async ({ page }) => {
    const taskTitle = 'Incomplete Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);
    await expect(taskCard(page, taskTitle)).toHaveCount(0);
  });

  test('restores task from archive', async ({ page }) => {
    const taskTitle = 'Restorable Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);

    await openArchive(page);
    await page.getByRole('button', { name: 'Restore task' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('views archived tasks list', async ({ page }) => {
    const tasks = ['Task 1', 'Task 2', 'Task 3'];

    for (const task of tasks) {
      await createTask(page, task);
      await archiveTask(page, task);
    }

    await openArchive(page);

    for (const task of tasks) {
      await expect(archiveRow(page, task)).toBeVisible();
    }

    await expect(page.getByText(/Archive \(3 tasks\)/)).toBeVisible();
  });

  test('searches archived tasks', async ({ page }) => {
    const tasks = ['Design Task', 'Development Task', 'Testing Task'];

    for (const task of tasks) {
      await createTask(page, task);
      await archiveTask(page, task);
    }

    await openArchive(page);
    await page.getByPlaceholder('Search archived tasks...').fill('Design');

    await expect(archiveRow(page, 'Design Task')).toBeVisible();
    await expect(archiveRow(page, 'Development Task')).toHaveCount(0);
    await expect(archiveRow(page, 'Testing Task')).toHaveCount(0);
  });

  test('clears archive search', async ({ page }) => {
    const taskTitle = 'Searchable Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);

    await openArchive(page);

    const searchBox = page.getByPlaceholder('Search archived tasks...');
    await searchBox.fill(taskTitle);
    await expect(archiveRow(page, taskTitle)).toBeVisible();

    await searchBox.locator('xpath=..').getByRole('button').click();
    await expect(searchBox).toHaveValue('');
    await expect(archiveRow(page, taskTitle)).toBeVisible();
  });

  test('permanently deletes archived task', async ({ page }) => {
    const taskTitle = 'Deletable Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);

    await openArchive(page);
    await page.getByRole('button', { name: 'Delete permanently' }).click();
    await page.getByRole('button', { name: 'Permanently Delete' }).click();

    await expect(archiveRow(page, taskTitle)).toHaveCount(0);
  });

  test('shows empty archive state', async ({ page }) => {
    await openArchive(page);

    await expect(page.getByText('No archived tasks')).toBeVisible();
    await expect(page.getByText('Tasks you archive will appear here')).toBeVisible();
  });

  test('shows no matching tasks for search', async ({ page }) => {
    const taskTitle = 'Existing Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);

    await openArchive(page);
    await page.getByPlaceholder('Search archived tasks...').fill('NonExistent');

    await expect(page.getByText('No matching tasks')).toBeVisible();
    await expect(page.getByText('Try a different search term')).toBeVisible();
  });

  test('archive persists after page reload', async ({ page }) => {
    const taskTitle = 'Persistent Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await expect(taskCard(page, taskTitle)).toHaveCount(0);

    await openArchive(page);
    await expect(archiveRow(page, taskTitle)).toBeVisible();
  });

  test('archives task with description and tags', async ({ page }) => {
    const taskTitle = 'Detailed Task';
    const description = 'Task description';

    await createTaskWithDetails(page, taskTitle, { description, tags: 'work, urgent' });
    await archiveTask(page, taskTitle);

    await openArchive(page);

    const row = archiveRow(page, taskTitle);
    await expect(row).toBeVisible();
    await expect(row).toContainText(description);
    await expect(row).toContainText('work');
    await expect(row).toContainText('urgent');
  });

  test('shows task metadata in archive', async ({ page }) => {
    const taskTitle = 'Metadata Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);

    await openArchive(page);

    const row = archiveRow(page, taskTitle);
    await expect(row).toContainText('Work Tasks');
    await expect(row).toContainText('todo');
  });

  test('cancels permanent deletion', async ({ page }) => {
    const taskTitle = 'Cancel Delete Task';
    await createTask(page, taskTitle);
    await archiveTask(page, taskTitle);

    await openArchive(page);

    await page.getByRole('button', { name: 'Delete permanently' }).click();
    // The DeleteTaskDialog opens on top; click its Cancel
    await page.locator('[role="dialog"]').last().getByRole('button', { name: 'Cancel' }).click();

    await expect(archiveRow(page, taskTitle)).toBeVisible();
  });

  test('archives multiple tasks and restores one', async ({ page }) => {
    const tasks = ['Task 1', 'Task 2', 'Task 3'];

    for (const task of tasks) {
      await createTask(page, task);
      await archiveTask(page, task);
    }

    await openArchive(page);

    await archiveRow(page, 'Task 1').getByRole('button', { name: 'Restore task' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(taskCard(page, 'Task 1')).toBeVisible();
    await expect(taskCard(page, 'Task 2')).toHaveCount(0);
    await expect(taskCard(page, 'Task 3')).toHaveCount(0);

    await openArchive(page);
    await expect(page.getByText(/Archive \(2 tasks\)/)).toBeVisible();
  });
});

// Helper functions

function taskCard(page: Page, title: string): Locator {
  return page.locator('.task-card', { hasText: title });
}

// Archive list rows render with shadcn <Card>, which emits `data-slot="card"`.
// Anchor on the slot attribute and filter by the h3 task-title heading.
function archiveRow(page: Page, title: string): Locator {
  return page
    .getByRole('dialog')
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole('heading', { name: title, level: 3 }) });
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

async function createTaskWithDetails(
  page: Page,
  title: string,
  options: { description?: string; tags?: string } = {}
): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);

  if (options.description || options.tags) {
    await page.getByRole('button', { name: 'Show Details' }).click();
    if (options.description) await page.getByLabel('Description').fill(options.description);
    if (options.tags) await page.getByLabel('Tags').fill(options.tags);
  }

  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

async function openTaskMenu(page: Page, taskTitle: string): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.getByRole('button', { name: /Task options/i }).click();
}

async function archiveTask(page: Page, taskTitle: string): Promise<void> {
  await openTaskMenu(page, taskTitle);
  await page.getByRole('menuitem', { name: 'Archive' }).click();
  await expect(taskCard(page, taskTitle)).toHaveCount(0);
}

async function openArchive(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: /Open sidebar/i });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }

  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Archive/ })).toBeVisible();
}
