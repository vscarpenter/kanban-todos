import type { Page } from '@playwright/test';
import {
  test,
  expect,
  createTask,
  createBoard,
  selectBoard,
  taskCard,
  column,
  createTaskWithDetails,
} from './fixtures';

test.describe('Task CRUD and Drag-Drop', () => {
  test('creates task with title only', async ({ page }) => {
    const taskTitle = 'Test Task';

    await createTask(page, taskTitle);

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('creates task with description', async ({ page }) => {
    const taskTitle = 'Test Task';
    const description = 'This is a task description';

    await createTaskWithDetails(page, taskTitle, { description });

    await expect(taskCard(page, taskTitle)).toContainText(description);
  });

  test('creates task with due date', async ({ page }) => {
    const taskTitle = 'Task with Due Date';

    await createTaskWithDetails(page, taskTitle, { dueDatePreset: 'Today' });

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('creates task with priority', async ({ page }) => {
    const taskTitle = 'High Priority Task';

    await createTaskWithDetails(page, taskTitle, { priority: 'High' });

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('creates task with tags', async ({ page }) => {
    const taskTitle = 'Tagged Task';
    const tags = 'work, urgent';

    await createTaskWithDetails(page, taskTitle, { tags });

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('edits task title', async ({ page }) => {
    const originalTitle = 'Original Task';
    const newTitle = 'Updated Task';

    await createTask(page, originalTitle);
    await editTask(page, originalTitle, { title: newTitle });

    await expect(taskCard(page, newTitle)).toBeVisible();
    await expect(taskCard(page, originalTitle)).toHaveCount(0);
  });

  test('edits task description', async ({ page }) => {
    const taskTitle = 'Test Task';
    const newDescription = 'Updated description';

    await createTask(page, taskTitle);
    await editTask(page, taskTitle, { description: newDescription });

    await expect(taskCard(page, taskTitle)).toContainText(newDescription);
  });

  test('edits task priority', async ({ page }) => {
    const taskTitle = 'Priority Task';

    await createTask(page, taskTitle);
    await editTask(page, taskTitle, { priority: 'High' });

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('edits task due date', async ({ page }) => {
    const taskTitle = 'Due Date Task';

    await createTask(page, taskTitle);
    await editTask(page, taskTitle, { dueDatePreset: 'Tomorrow' });

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('deletes task with confirmation', async ({ page }) => {
    const taskTitle = 'Task to Delete';

    await createTask(page, taskTitle);
    await deleteTask(page, taskTitle);

    await expect(taskCard(page, taskTitle)).toHaveCount(0);
  });

  test('cancels task deletion', async ({ page }) => {
    const taskTitle = 'Test Task';

    await createTask(page, taskTitle);

    await openTaskMenu(page, taskTitle);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('moves task between columns via menu', async ({ page }) => {
    const taskTitle = 'Movable Task';

    await createTask(page, taskTitle);
    await moveTaskToColumn(page, taskTitle, 'In Progress');

    await expect(column(page, 'In Progress').locator('.task-card', { hasText: taskTitle })).toBeVisible();
    await expect(column(page, 'To Do').locator('.task-card', { hasText: taskTitle })).toHaveCount(0);
  });

  test('moves task to Done column via menu', async ({ page }) => {
    const taskTitle = 'Completable Task';

    await createTask(page, taskTitle);
    await moveTaskToColumn(page, taskTitle, 'Done');

    await expect(column(page, 'Done').locator('.task-card', { hasText: taskTitle })).toBeVisible();
    await expect(column(page, 'To Do').locator('.task-card', { hasText: taskTitle })).toHaveCount(0);
  });

  test('moves task to another board with confirmation', async ({ page }) => {
    const taskTitle = 'Cross-board Task';
    const targetBoard = 'Destination Board';

    await createBoard(page, targetBoard);
    await selectBoard(page, 'Work Tasks');
    await createTask(page, taskTitle);

    await openTaskMenu(page, taskTitle);
    await page.getByRole('menuitem', { name: 'Move to Board' }).click();

    await expect(page.getByRole('heading', { name: 'Move Task to Board' })).toBeVisible();
    await page.getByRole('dialog').locator('[data-slot="card"]', { hasText: targetBoard }).click();
    await page.getByRole('button', { name: 'Move Task' }).click();

    await expect(page.getByRole('heading', { name: 'Confirm Move' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm Move' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(taskCard(page, taskTitle)).toHaveCount(0);

    await selectBoard(page, targetBoard);
    await expect(taskCard(page, taskTitle)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: targetBoard })).toBeVisible();
    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('archives task via menu', async ({ page }) => {
    const taskTitle = 'Archivable Task';

    await createTask(page, taskTitle);

    await openTaskMenu(page, taskTitle);
    await page.getByRole('menuitem', { name: 'Archive' }).click();

    await expect(taskCard(page, taskTitle)).toHaveCount(0);
  });

  test('task persists after page reload', async ({ page }) => {
    const taskTitle = 'Persistent Task';

    await createTask(page, taskTitle);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });

  test('validates empty task title', async ({ page }) => {
    await page.getByRole('button', { name: 'New Task' }).click();

    const createButton = page.getByRole('button', { name: 'Create Task' });
    await expect(createButton).toBeDisabled();

    await page.getByLabel('Title *').fill('Test Task');
    await expect(createButton).toBeEnabled();

    await page.keyboard.press('Escape');
  });

  test('shows task details on expand', async ({ page }) => {
    const taskTitle = 'Detailed Task';
    const description = 'Task description here';

    await createTaskWithDetails(page, taskTitle, { description });

    await expect(taskCard(page, taskTitle)).toContainText(description);
  });

  test('cancels task creation', async ({ page }) => {
    const initialTaskCount = await page.locator('.task-card').count();

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Title *').fill('Test Task');

    // Cancelling with unsaved changes opens the warning dialog → discard
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    const discard = page.getByRole('button', { name: 'Discard' });
    if (await discard.isVisible().catch(() => false)) {
      await discard.click();
    }

    await expect(page.getByRole('dialog')).toBeHidden();
    expect(await page.locator('.task-card').count()).toBe(initialTaskCount);
  });

  test('cancels task editing', async ({ page }) => {
    const taskTitle = 'Test Task';
    const newTitle = 'Changed Title';

    await createTask(page, taskTitle);

    await openTaskMenu(page, taskTitle);
    await page.getByRole('menuitem', { name: 'Edit Task' }).click();

    await page.getByLabel('Title *').fill(newTitle);
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    // Unsaved changes warning fires; discard
    const discard = page.getByRole('button', { name: 'Discard' });
    if (await discard.isVisible().catch(() => false)) {
      await discard.click();
    }

    await expect(taskCard(page, taskTitle)).toBeVisible();
    await expect(taskCard(page, newTitle)).toHaveCount(0);
  });

  test('creates multiple tasks', async ({ page }) => {
    const tasks = ['Task 1', 'Task 2', 'Task 3'];

    for (const task of tasks) {
      await createTask(page, task);
    }

    for (const task of tasks) {
      await expect(taskCard(page, task)).toBeVisible();
    }
  });

  test('uses quick date presets', async ({ page }) => {
    const taskTitle = 'Today Task';

    await createTaskWithDetails(page, taskTitle, { dueDatePreset: 'Today' });

    await expect(taskCard(page, taskTitle)).toBeVisible();
  });
});

// Helper functions

async function editTask(
  page: Page,
  taskTitle: string,
  updates: {
    title?: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High';
    dueDatePreset?: 'Today' | 'Tomorrow' | 'Next Week' | 'No Date';
  } = {}
): Promise<void> {
  await openTaskMenu(page, taskTitle);
  await page.getByRole('menuitem', { name: 'Edit Task' }).click();

  if (updates.title) {
    await page.getByLabel('Title *').fill(updates.title);
  }

  if (updates.description || updates.priority || updates.dueDatePreset) {
    await page.getByRole('button', { name: 'Show Details' }).click();

    if (updates.description) {
      await page.getByLabel('Description').fill(updates.description);
    }

    if (updates.priority) {
      await selectByLabel(page, 'Priority', updates.priority);
    }

    if (updates.dueDatePreset) {
      await page.getByRole('button', { name: updates.dueDatePreset, exact: true }).click();
    }
  }

  await page.getByRole('button', { name: 'Update Task' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

async function deleteTask(page: Page, taskTitle: string): Promise<void> {
  await openTaskMenu(page, taskTitle);
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  // Confirm in the delete dialog (the destructive button)
  await page.getByRole('dialog').getByRole('button', { name: /^Delete$/ }).click();
  await expect(taskCard(page, taskTitle)).toHaveCount(0);
}

async function openTaskMenu(page: Page, taskTitle: string): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.getByRole('button', { name: /Task options/i }).click();
}

async function moveTaskToColumn(page: Page, taskTitle: string, columnName: string): Promise<void> {
  await openTaskMenu(page, taskTitle);
  await page.getByRole('menuitem', { name: 'Move to Column' }).hover();
  await page.getByRole('menuitem', { name: columnName, exact: true }).click();
}

// Shadcn Select components have no accessible name from the htmlFor label,
// so we walk from the label text to the sibling combobox trigger.
async function selectByLabel(page: Page, label: string, optionText: string): Promise<void> {
  const trigger = page.getByText(label, { exact: true }).locator('xpath=..').getByRole('combobox');
  await trigger.click();
  await page.getByRole('option', { name: optionText, exact: true }).click();
}
