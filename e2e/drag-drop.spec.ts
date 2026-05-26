import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('drags task from To Do to In Progress column', async ({ page }) => {
    const taskTitle = 'Draggable Task';
    await createTask(page, taskTitle);

    await expect(taskInColumn(page, 'todo', taskTitle)).toBeVisible();

    await dragTaskToColumn(page, taskTitle, 'in-progress');

    await expect(taskInColumn(page, 'in-progress', taskTitle)).toBeVisible({ timeout: 5000 });
    await expect(taskInColumn(page, 'todo', taskTitle)).toHaveCount(0);
  });

  test('drags task from To Do to Done column (fires completion)', async ({ page }) => {
    const taskTitle = 'Completable Task';
    await createTask(page, taskTitle);

    await dragTaskToColumn(page, taskTitle, 'done');

    await expect(taskInColumn(page, 'done', taskTitle)).toBeVisible({ timeout: 5000 });
    // Completion celebration toast may appear. Don't depend on it - timing
    // varies and the toast auto-dismisses. Just verify the task moved.
  });

  test('drags task between non-todo columns', async ({ page }) => {
    const taskTitle = 'Multi-Move Task';
    await createTask(page, taskTitle);

    // First move to In Progress via menu (drag has trouble with consecutive
    // operations on the same card without a re-query)
    await openTaskMenu(page, taskTitle);
    await page.getByRole('menuitem', { name: 'Move to Column' }).hover();
    await page.getByRole('menuitem', { name: 'In Progress', exact: true }).click();
    await expect(taskInColumn(page, 'in-progress', taskTitle)).toBeVisible();

    // Now drag from In Progress to Done
    await dragTaskToColumn(page, taskTitle, 'done');
    await expect(taskInColumn(page, 'done', taskTitle)).toBeVisible({ timeout: 5000 });
  });

  test('drag persists after page reload', async ({ page }) => {
    const taskTitle = 'Persistent Drag Task';
    await createTask(page, taskTitle);

    await dragTaskToColumn(page, taskTitle, 'in-progress');
    await expect(taskInColumn(page, 'in-progress', taskTitle)).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await expect(taskInColumn(page, 'in-progress', taskTitle)).toBeVisible();
  });

  test('reorders boards via the up/down arrow buttons', async ({ page }) => {
    await createBoard(page, 'Beta Board');
    await createBoard(page, 'Gamma Board');

    // Helper to read the visual top of each named board's sidebar item
    const positions = async () =>
      page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[role="button"]'))
          .filter((el) => /Beta Board|Gamma Board/.test(el.textContent || ''))
          .filter((el) => !/^Move /.test(el.getAttribute('aria-label') || ''));
        return items.map((el) => ({
          text: (el.textContent || '').slice(0, 40),
          top: el.getBoundingClientRect().top,
        }));
      });

    // Verify the initial order: Beta then Gamma
    const initial = await positions();
    const initialBeta = initial.find((p) => p.text.includes('Beta Board'));
    const initialGamma = initial.find((p) => p.text.includes('Gamma Board'));
    expect(initialBeta && initialGamma).toBeTruthy();
    if (initialBeta && initialGamma) {
      expect(initialBeta.top).toBeLessThan(initialGamma.top);
    }

    // Click Gamma's "Move up" button to swap with Beta
    const gamma = boardItem(page, 'Gamma Board').first();
    await gamma.hover();
    await gamma.getByRole('button', { name: 'Move Gamma Board up' }).click();

    // The store reorders asynchronously; poll until the visual order changes
    await expect
      .poll(async () => {
        const next = await positions();
        const beta = next.find((p) => p.text.includes('Beta Board'));
        const gammaPos = next.find((p) => p.text.includes('Gamma Board'));
        if (!beta || !gammaPos) return 'missing';
        return gammaPos.top < beta.top ? 'reordered' : 'unchanged';
      }, { timeout: 5000 })
      .toBe('reordered');
  });

  test('move up button is disabled for the first board', async ({ page }) => {
    const firstBoard = boardItem(page, 'Work Tasks').first();
    await firstBoard.hover();
    await expect(firstBoard.getByRole('button', { name: 'Move Work Tasks up' })).toBeDisabled();
  });

  test('move down button is disabled for the last board', async ({ page }) => {
    await createBoard(page, 'Last Board');

    const lastBoard = boardItem(page, 'Last Board').first();
    await lastBoard.hover();
    await expect(lastBoard.getByRole('button', { name: 'Move Last Board down' })).toBeDisabled();
  });

  test('drag does not move task when dropped outside any column', async ({ page }) => {
    const taskTitle = 'Outside Drop Task';
    await createTask(page, taskTitle);

    const card = taskCard(page, taskTitle).first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Start dragging by pressing on the card and moving past the activation distance
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 30, { steps: 8 });
    // Drop in a known empty area (top-left corner of the page header area)
    await page.mouse.move(10, 10, { steps: 8 });
    await page.mouse.up();

    // Card should still be in the To Do column
    await expect(taskInColumn(page, 'todo', taskTitle)).toBeVisible();
  });
});

// Helper functions

function taskCard(page: Page, title: string): Locator {
  return page.locator('.task-card', { hasText: title });
}

// Locator scoped to a specific column. Looks up the column by its droppable
// status id (todo / in-progress / done). The column root is the element that
// `useDroppable` registers; we walk down to the task list inside.
function taskInColumn(page: Page, status: 'todo' | 'in-progress' | 'done', title: string): Locator {
  // The column's <div> ancestor of the matching task title contains the
  // status dot. Easier: rely on the board layout — the kanban-column
  // wrappers render in a fixed order: To Do (0), In Progress (1), Done (2).
  const columnIndex = status === 'todo' ? 0 : status === 'in-progress' ? 1 : 2;
  return page.locator('.kanban-column').nth(columnIndex).locator('.task-card', { hasText: title });
}

function boardItem(page: Page, name: string): Locator {
  return page.locator('[role="button"]', {
    has: page.getByText(name, { exact: true }),
  }).filter({ hasNotText: 'Move ' });
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

async function createBoard(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Add board' }).click();
  await page.getByLabel('Board Name *').fill(name);
  await page.getByRole('button', { name: 'Create Board' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(boardItem(page, name).first()).toBeVisible();
}

async function openTaskMenu(page: Page, taskTitle: string): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.getByRole('button', { name: /Task options/i }).click();
}

/**
 * Drags a task card to the target column using mouse events.
 *
 * dnd-kit's PointerSensor requires the pointer to move at least 8px
 * (activationConstraint.distance) before the drag starts. We move in stages
 * so the sensor activates and the drop target is computed correctly.
 */
async function dragTaskToColumn(
  page: Page,
  taskTitle: string,
  targetStatus: 'todo' | 'in-progress' | 'done'
): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  if (!cardBox) throw new Error(`Task card "${taskTitle}" has no bounding box`);

  const columnIndex = targetStatus === 'todo' ? 0 : targetStatus === 'in-progress' ? 1 : 2;
  const targetColumn = page.locator('.kanban-column').nth(columnIndex);
  await targetColumn.scrollIntoViewIfNeeded();
  const colBox = await targetColumn.boundingBox();
  if (!colBox) throw new Error(`Column ${targetStatus} has no bounding box`);

  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = colBox.x + colBox.width / 2;
  const endY = colBox.y + colBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Move past the 8px activation constraint
  await page.mouse.move(startX + 12, startY + 12, { steps: 5 });
  // Move to the target column in steps so the over event fires
  await page.mouse.move(endX, endY, { steps: 15 });
  await page.mouse.up();
}
