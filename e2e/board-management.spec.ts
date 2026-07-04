import type { Page } from '@playwright/test';
import { test, expect, createBoard, selectBoard, boardItem, createTask } from './fixtures';

test.describe('Board Management', () => {
  test('creates new board with valid name', async ({ page }) => {
    const boardName = 'Test Board';

    await createBoard(page, boardName);

    await expect(boardItem(page, boardName)).toBeVisible();
  });

  test('creates board with description', async ({ page }) => {
    const boardName = 'Test Board';
    const description = 'This is a test board description';

    await createBoard(page, boardName, description);

    const item = boardItem(page, boardName);
    await expect(item).toBeVisible();
    await expect(item).toContainText(description);
  });

  test('validates empty board name', async ({ page }) => {
    await page.getByRole('button', { name: 'Add board' }).click();

    const createButton = page.getByRole('button', { name: 'Create Board' });
    await expect(createButton).toBeDisabled();

    await page.getByLabel('Board Name *').fill('Test Board');
    await expect(createButton).toBeEnabled();
  });

  test('edits board name', async ({ page }) => {
    const originalName = 'Original Board';
    const newName = 'Updated Board';

    await createBoard(page, originalName);
    await selectBoard(page, originalName);
    await openBoardSettings(page, originalName);

    await page.getByLabel('Board Name *').fill(newName);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(boardItem(page, newName)).toBeVisible();
    await expect(page.getByRole('heading', { name: newName })).toBeVisible();
  });

  test('edits board description', async ({ page }) => {
    const boardName = 'Test Board';
    const newDescription = 'Updated description';

    await createBoard(page, boardName);
    await openBoardSettings(page, boardName);

    await page.getByLabel('Description').fill(newDescription);
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(boardItem(page, boardName)).toContainText(newDescription);
  });

  test('deletes empty board with confirmation', async ({ page }) => {
    const boardName = 'Board to Delete';

    await createBoard(page, boardName);
    await deleteBoard(page, boardName);

    await expect(boardItem(page, boardName)).toHaveCount(0);
  });

  test('deletes board with tasks after confirmation', async ({ page }) => {
    const boardName = 'Board With Tasks';

    await createBoard(page, boardName);
    await selectBoard(page, boardName);
    await createTask(page, 'Task on Board');
    await createTask(page, 'Second Task');

    await deleteBoard(page, boardName);

    await expect(boardItem(page, boardName)).toHaveCount(0);
    await expect(page.locator('.task-card', { hasText: 'Task on Board' })).toHaveCount(0);
    await expect(page.locator('.task-card', { hasText: 'Second Task' })).toHaveCount(0);

    await page.reload();
    await expect(boardItem(page, boardName)).toHaveCount(0);
  });

  test('cannot delete default board', async ({ page }) => {
    await openBoardMenu(page, 'Work Tasks');
    await expect(page.getByRole('menuitem', { name: 'Delete Board' })).toBeDisabled();
    await page.keyboard.press('Escape');
  });

  test('switches between multiple boards', async ({ page }) => {
    const board1 = 'Board 1';
    const board2 = 'Board 2';

    await createBoard(page, board1);
    await createBoard(page, board2);

    await selectBoard(page, board1);
    await expect(page.getByRole('heading', { name: board1 })).toBeVisible();

    await selectBoard(page, board2);
    await expect(page.getByRole('heading', { name: board2 })).toBeVisible();

    await selectBoard(page, 'Work Tasks');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('duplicates board', async ({ page }) => {
    const boardName = 'Original Board';

    await createBoard(page, boardName);
    await openBoardMenu(page, boardName);
    await page.getByRole('menuitem', { name: 'Duplicate Board' }).click();

    await expect(boardItem(page, `${boardName} (Copy)`)).toBeVisible();
    await expect(boardItem(page, boardName)).toBeVisible();
  });

  test('board selection persists after page reload', async ({ page }) => {
    const boardName = 'Test Board';

    await createBoard(page, boardName);
    await selectBoard(page, boardName);

    await page.reload();
    await expect(page.getByRole('heading', { name: boardName })).toBeVisible();
  });

  test('board count badge shows correct task count', async ({ page }) => {
    const boardName = 'Task Board';

    await createBoard(page, boardName);
    await selectBoard(page, boardName);

    await createTask(page, 'Task 1');
    await createTask(page, 'Task 2');
    await createTask(page, 'Task 3');

    await expect(boardItem(page, boardName)).toContainText('3');
  });

  test('cancels board creation', async ({ page }) => {
    await page.getByRole('button', { name: 'Add board' }).click();
    await page.getByLabel('Board Name *').fill('Test Board');

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(boardItem(page, 'Test Board')).toHaveCount(0);
  });

  test('cancels board editing', async ({ page }) => {
    const boardName = 'Test Board';

    await createBoard(page, boardName);
    await openBoardSettings(page, boardName);

    await page.getByLabel('Board Name *').fill('Changed Name');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(boardItem(page, boardName)).toBeVisible();
    await expect(boardItem(page, 'Changed Name')).toHaveCount(0);
  });

  test('cancels board deletion', async ({ page }) => {
    const boardName = 'Test Board';

    await createBoard(page, boardName);

    await openBoardMenu(page, boardName);
    await page.getByRole('menuitem', { name: 'Delete Board' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

    await expect(boardItem(page, boardName)).toBeVisible();
  });

  test('shows error when trying to delete board with wrong confirmation', async ({ page }) => {
    const boardName = 'Test Board';

    await createBoard(page, boardName);

    await openBoardMenu(page, boardName);
    await page.getByRole('menuitem', { name: 'Delete Board' }).click();

    await page.getByLabel(/Type.*to confirm deletion/i).fill('Wrong Name');
    await expect(page.getByRole('button', { name: 'Delete Board' })).toBeDisabled();

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  });
});

// Helper functions

async function openBoardMenu(page: Page, boardName: string): Promise<void> {
  const item = boardItem(page, boardName).first();
  await item.hover();
  await item.getByRole('button', { name: 'Board options' }).click();
}

async function openBoardSettings(page: Page, boardName: string): Promise<void> {
  await openBoardMenu(page, boardName);
  await page.getByRole('menuitem', { name: 'Edit Board' }).click();
  await expect(page.getByRole('heading', { name: 'Board Settings' })).toBeVisible();
}

async function deleteBoard(page: Page, boardName: string): Promise<void> {
  await openBoardMenu(page, boardName);
  await page.getByRole('menuitem', { name: 'Delete Board' }).click();
  await page.getByLabel(/Type.*to confirm deletion/i).fill(boardName);
  await page.getByRole('button', { name: 'Delete Board' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}
