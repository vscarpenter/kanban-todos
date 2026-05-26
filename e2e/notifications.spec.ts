import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('Toast Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('shows "Task completed" toast when dragging a task to Done', async ({ page }) => {
    const taskTitle = 'Drag Complete Task';
    await createTask(page, taskTitle);

    await dragTaskToColumn(page, taskTitle, 'done');

    // Wait for the column move + celebrate toast
    await expect(page.locator('.kanban-column').nth(2).locator('.task-card', { hasText: taskTitle }))
      .toBeVisible({ timeout: 5000 });
    await expect(toastWithText(page, /Task completed/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows "Task moved" toast when moving to another board', async ({ page }) => {
    const sourceTask = 'Movable Task';
    // Avoid the word "Move" in the board name — the boardItem helper filters
    // it out because the reorder controls render Move {name} aria-labels.
    const targetBoard = 'Target Destination';

    await createBoard(page, targetBoard);
    await createTask(page, sourceTask);

    await openTaskMenu(page, sourceTask);
    await page.getByRole('menuitem', { name: 'Move to Board' }).click();

    // The MoveTaskDialog opens. Pick the target board from inside the dialog.
    await expect(page.getByRole('heading', { name: 'Move Task to Board' })).toBeVisible();
    const dialog = page.getByRole('dialog');
    await dialog.getByText(targetBoard, { exact: true }).first().click();
    await dialog.getByRole('button', { name: /^Move Task$/ }).click();

    // Moving from the default "Work Tasks" board requires a confirmation step.
    // The dialog re-renders with title "Confirm Move" and a "Confirm Move"
    // submit button.
    const confirmHeading = page.getByRole('heading', { name: 'Confirm Move' });
    if (await confirmHeading.isVisible({ timeout: 1000 }).catch(() => false)) {
      await dialog.getByRole('button', { name: /Confirm Move/ }).click();
    }

    await expect(toastWithText(page, new RegExp(`Task moved to "${targetBoard}"`))).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows success toast after copying task details', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const taskTitle = 'Toast Share Task';
    await createTask(page, taskTitle);

    const card = page.locator('.task-card', { hasText: taskTitle }).first();
    await card.getByRole('button', { name: /Task options/i }).click();
    await page.getByRole('menuitem', { name: 'Share Task' }).click();
    await page.getByRole('tab', { name: 'Copy Details' }).click();

    // Click the first copy button (next to the plain-text textarea)
    const dialog = page.getByRole('dialog');
    const textareas = dialog.getByRole('textbox', { includeHidden: false });
    await textareas.first().locator('xpath=following-sibling::button[1]').click();

    await expect(toastWithText(page, /Task details copied to clipboard/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test('cross-board navigation switches the active board', async ({ page }) => {
    const otherBoard = 'Research Board';
    const taskTitle = 'Cross-board Task Toast';

    await createBoard(page, otherBoard);
    await selectBoard(page, otherBoard);
    await createTask(page, taskTitle);

    await selectBoard(page, 'Work Tasks');

    // Enable cross-board search and search
    await page.getByRole('button', { name: /Open filters menu/i }).click();
    await page.getByRole('switch', { name: /Toggle cross-board search/i }).click();
    await page.keyboard.press('Escape');

    const searchbox = page.getByRole('searchbox');
    await searchbox.fill(taskTitle);
    await searchbox.press('Enter');

    // Click the cross-board task card to navigate
    const crossBoardCard = page.locator('.task-card', { hasText: taskTitle }).first();
    await expect(crossBoardCard).toBeVisible();
    await crossBoardCard.click();

    // BoardView's handleNavigateToBoard fires (changes the active board);
    // it does not emit a toast — the toast variant is wired through a
    // separate custom-event handler in CrossBoardNavigationHandler that
    // task cards don't trigger directly. Verify the board switch instead.
    await expect(page.getByRole('heading', { name: otherBoard })).toBeVisible({
      timeout: 5000,
    });
  });

  test('toast disappears automatically', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Trigger a copy-to-clipboard toast (default sonner duration ~4s)
    const taskTitle = 'Auto-dismiss Task';
    await createTask(page, taskTitle);

    const card = page.locator('.task-card', { hasText: taskTitle }).first();
    await card.getByRole('button', { name: /Task options/i }).click();
    await page.getByRole('menuitem', { name: 'Share Task' }).click();
    await page.getByRole('tab', { name: 'Copy Details' }).click();

    const dialog = page.getByRole('dialog');
    const textareas = dialog.getByRole('textbox', { includeHidden: false });
    await textareas.first().locator('xpath=following-sibling::button[1]').click();

    const toast = toastWithText(page, /Task details copied to clipboard/i);
    await expect(toast).toBeVisible({ timeout: 3000 });

    // Sonner default duration is ~4s; allow up to 12s for the toast to clear.
    await expect(toast).toHaveCount(0, { timeout: 12_000 });
  });

  test('Sonner Toaster region is mounted after a toast fires', async ({ page }) => {
    // Sonner mounts the data-sonner-toaster region lazily on first toast.
    // Trigger an export to fire a "Export Successful" toast and verify the
    // toaster region renders.
    await page.getByRole('button', { name: 'Export Data', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Export Data' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('dialog').getByRole('button', { name: /^Export Data$/ }).click();
    await downloadPromise;

    await expect(page.locator('[data-sonner-toaster]')).toHaveCount(1, { timeout: 5000 });
  });
});

// Helper functions

function taskCard(page: Page, title: string): Locator {
  return page.locator('.task-card', { hasText: title });
}

function boardItem(page: Page, name: string): Locator {
  return page.locator('[role="button"]', {
    has: page.getByText(name, { exact: true }),
  }).filter({ hasNotText: 'Move ' });
}

function toastWithText(page: Page, text: RegExp | string): Locator {
  return page.locator('[data-sonner-toast]').filter({ hasText: text });
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

async function selectBoard(page: Page, name: string): Promise<void> {
  await boardItem(page, name).first().click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

async function openTaskMenu(page: Page, taskTitle: string): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.getByRole('button', { name: /Task options/i }).click();
}

async function dragTaskToColumn(
  page: Page,
  taskTitle: string,
  targetStatus: 'todo' | 'in-progress' | 'done'
): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.scrollIntoViewIfNeeded();
  const cardBox = await card.boundingBox();
  if (!cardBox) throw new Error(`Card "${taskTitle}" missing box`);

  const idx = targetStatus === 'todo' ? 0 : targetStatus === 'in-progress' ? 1 : 2;
  const col = page.locator('.kanban-column').nth(idx);
  await col.scrollIntoViewIfNeeded();
  const colBox = await col.boundingBox();
  if (!colBox) throw new Error(`Column ${targetStatus} missing box`);

  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = colBox.x + colBox.width / 2;
  const endY = colBox.y + colBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 12, startY + 12, { steps: 5 });
  await page.mouse.move(endX, endY, { steps: 15 });
  await page.mouse.up();
}
