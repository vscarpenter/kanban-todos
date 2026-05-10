import { expect, test, type Page } from '@playwright/test';

test.describe('Cross-board search', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Add board' })).toBeVisible();
  });

  test('searches within the current board before cross-board search is enabled', async ({ page }) => {
    await createTask(page, 'Project Alpha');
    await createBoard(page, 'Research Board');
    await selectBoard(page, 'Research Board');
    await createTask(page, 'Project Beta');

    await selectBoard(page, 'Work Tasks');
    await searchFor(page, 'Project');

    await expect(page.locator('#search-results')).toContainText('Found 1 task in current board');
    await expect(page.locator('.task-card')).toHaveCount(1);
  });

  test('expands the same search across boards when the scope toggle is enabled', async ({ page }) => {
    await createTask(page, 'Project Alpha');
    await createBoard(page, 'Research Board');
    await selectBoard(page, 'Research Board');
    await createTask(page, 'Project Beta');

    await selectBoard(page, 'Work Tasks');
    await searchFor(page, 'Project');
    await expect(page.locator('#search-results')).toContainText('Found 1 task in current board');

    await openFilters(page);
    await page.getByRole('switch', { name: /toggle cross-board search/i }).click();
    await expect(page.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search across all boards');

    await searchFor(page, 'Project');
    await expect(page.locator('#search-results')).toContainText('Found 2 tasks across all boards');
    await expect(page.locator('.task-card')).toHaveCount(2);
  });
});

async function createBoard(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Add board' }).click();
  await page.getByLabel('Board Name *').fill(name);
  await page.getByRole('button', { name: 'Create Board' }).click();
  await expect(page.getByRole('button', { name: new RegExp(name, 'i') })).toBeVisible();
}

async function selectBoard(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(name, 'i') }).click();
  await expect(page.getByRole('heading', { name: new RegExp(name, 'i') })).toBeVisible();
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: /new task/i }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(page.locator('.task-card')).toContainText(title);
}

async function openFilters(page: Page): Promise<void> {
  await page.getByRole('button', { name: /open filters menu/i }).click();
  await expect(page.getByRole('switch', { name: /toggle cross-board search/i })).toBeVisible();
}

async function searchFor(page: Page, query: string): Promise<void> {
  const searchbox = page.getByRole('searchbox');
  await searchbox.fill(query);
  await searchbox.press('Enter');
}
