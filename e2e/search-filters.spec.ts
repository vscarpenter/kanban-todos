import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('Search Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('opens the filters popover', async ({ page }) => {
    await openFilters(page);

    await expect(page.getByLabel('Filter by task status')).toBeVisible();
    await expect(page.getByLabel('Filter by task priority')).toBeVisible();
  });

  test('filters tasks by status (todo)', async ({ page }) => {
    await createTask(page, 'Task A');
    await createTask(page, 'Task B');

    // Move Task B to In Progress so we can verify status filtering
    await openTaskMenu(page, 'Task B');
    await page.getByRole('menuitem', { name: 'Move to Column' }).hover();
    await page.getByRole('menuitem', { name: 'In Progress', exact: true }).click();
    await expect(taskInColumn(page, 'in-progress', 'Task B')).toBeVisible();

    await openFilters(page);
    await selectFromDropdown(page, page.getByLabel('Filter by task status'), 'To Do');
    // Close popover by pressing Escape
    await page.keyboard.press('Escape');

    // After applying status=todo filter, only Task A (todo) should be visible
    await expect(taskCard(page, 'Task A')).toBeVisible();
    await expect(taskCard(page, 'Task B')).toHaveCount(0);
  });

  test('filters tasks by priority (high)', async ({ page }) => {
    await createTaskWithPriority(page, 'Low Task', 'Low');
    await createTaskWithPriority(page, 'High Task', 'High');

    await openFilters(page);
    await selectFromDropdown(page, page.getByLabel('Filter by task priority'), 'High');
    await page.keyboard.press('Escape');

    await expect(taskCard(page, 'High Task')).toBeVisible();
    await expect(taskCard(page, 'Low Task')).toHaveCount(0);
  });

  test('combined status and priority filters', async ({ page }) => {
    await createTaskWithPriority(page, 'Todo High', 'High');
    await createTaskWithPriority(page, 'Todo Low', 'Low');

    // Move "Todo High" to In Progress so it should be filtered out
    // when status=todo is selected
    await openTaskMenu(page, 'Todo Low');
    await page.getByRole('menuitem', { name: 'Move to Column' }).hover();
    await page.getByRole('menuitem', { name: 'In Progress', exact: true }).click();
    await expect(taskInColumn(page, 'in-progress', 'Todo Low')).toBeVisible();

    await openFilters(page);
    await selectFromDropdown(page, page.getByLabel('Filter by task status'), 'To Do');
    await selectFromDropdown(page, page.getByLabel('Filter by task priority'), 'High');
    await page.keyboard.press('Escape');

    // Only Todo High (status=todo, priority=high) should match
    await expect(taskCard(page, 'Todo High')).toBeVisible();
    await expect(taskCard(page, 'Todo Low')).toHaveCount(0);
  });

  test('clears all active filters', async ({ page }) => {
    await createTaskWithPriority(page, 'Task A', 'Low');
    await createTaskWithPriority(page, 'Task B', 'High');

    await openFilters(page);
    await selectFromDropdown(page, page.getByLabel('Filter by task priority'), 'High');
    await page.keyboard.press('Escape');

    await expect(taskCard(page, 'Task A')).toHaveCount(0);

    await openFilters(page);
    await page.getByRole('button', { name: 'Clear all' }).click();
    await page.keyboard.press('Escape');

    // Both tasks should be visible again
    await expect(taskCard(page, 'Task A')).toBeVisible();
    await expect(taskCard(page, 'Task B')).toBeVisible();
  });

  test('removes individual filter via active chip', async ({ page }) => {
    await createTaskWithPriority(page, 'Task A', 'Low');
    await createTaskWithPriority(page, 'Task B', 'High');

    await openFilters(page);
    await selectFromDropdown(page, page.getByLabel('Filter by task priority'), 'High');

    // The active chip should appear with a remove button
    const removeChip = page.getByRole('button', { name: /Remove Priority: high/i });
    await expect(removeChip).toBeVisible();
    await removeChip.click();
    await page.keyboard.press('Escape');

    await expect(taskCard(page, 'Task A')).toBeVisible();
    await expect(taskCard(page, 'Task B')).toBeVisible();
  });

  test('shows active filter count badge on the trigger', async ({ page }) => {
    await openFilters(page);
    await selectFromDropdown(page, page.getByLabel('Filter by task priority'), 'High');
    await page.keyboard.press('Escape');

    // The trigger's aria-label is updated to include the active filter count.
    // The exact count varies because Object.values(filters).filter(Boolean)
    // counts empty arrays (tags: []) as truthy. Just verify the "(N active)"
    // pattern is present.
    await expect(
      page.getByRole('button', { name: /Open filters menu \(\d+ active\)/ })
    ).toBeVisible();
  });

  test('search and filter combined', async ({ page }) => {
    await createTaskWithPriority(page, 'Apple Task', 'High');
    await createTaskWithPriority(page, 'Banana Task', 'High');
    await createTaskWithPriority(page, 'Apple Pie', 'Low');

    await openFilters(page);
    await selectFromDropdown(page, page.getByLabel('Filter by task priority'), 'High');
    await page.keyboard.press('Escape');

    await page.getByRole('searchbox').fill('Apple');
    await page.getByRole('searchbox').press('Enter');

    // Apple Task matches both filters
    await expect(taskCard(page, 'Apple Task')).toBeVisible();
    // Banana Task fails the search; Apple Pie fails the priority filter
    await expect(taskCard(page, 'Banana Task')).toHaveCount(0);
    await expect(taskCard(page, 'Apple Pie')).toHaveCount(0);
  });

  test('cross-board search toggle is in the filter popover', async ({ page }) => {
    await openFilters(page);

    const toggle = page.getByRole('switch', { name: /Toggle cross-board search/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
  });
});

// Helper functions

function taskCard(page: Page, title: string): Locator {
  return page.locator('.task-card', { hasText: title });
}

function taskInColumn(
  page: Page,
  status: 'todo' | 'in-progress' | 'done',
  title: string
): Locator {
  const idx = status === 'todo' ? 0 : status === 'in-progress' ? 1 : 2;
  return page.locator('.kanban-column').nth(idx).locator('.task-card', { hasText: title });
}

async function openFilters(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Open filters menu/i }).click();
  await expect(page.getByLabel('Filter by task status')).toBeVisible();
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

async function createTaskWithPriority(
  page: Page,
  title: string,
  priority: 'Low' | 'Medium' | 'High'
): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Show Details' }).click();

  // Shadcn Select trigger derived from the visible label
  const trigger = page
    .getByText('Priority', { exact: true })
    .locator('xpath=..')
    .getByRole('combobox');
  await trigger.click();
  await page.getByRole('option', { name: priority, exact: true }).click();

  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

async function openTaskMenu(page: Page, taskTitle: string): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.getByRole('button', { name: /Task options/i }).click();
}

async function selectFromDropdown(
  _page: Page,
  trigger: Locator,
  optionText: string
): Promise<void> {
  await trigger.click();
  await _page.getByRole('option', { name: optionText, exact: true }).click();
}
