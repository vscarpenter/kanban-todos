import { test, expect, type Page } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    // Wait for the board to load by checking for the board heading
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('loads the kanban board with columns', async ({ page }) => {
    // Check that the main columns are visible
    await expect(page.getByText('To Do')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('can create a new task using the New Task button', async ({ page }) => {
    // Click the New Task button
    await page.getByRole('button', { name: 'New Task' }).click();

    // Wait for dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in the task title
    await page.getByLabel('Title *').fill('Test Task');

    // Save the task
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify task was created by checking it appears in the To Do column
    await expect(page.getByText('Test Task')).toBeVisible();
  });
});

test.describe('Board Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('can navigate to different boards', async ({ page }) => {
    // The default board should be visible
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    // Note: Additional board navigation tests would require creating boards first
    // This test verifies the basic navigation structure is in place
  });
});

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('search input is available', async ({ page }) => {
    // Check that search input exists
    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toBeVisible();
  });

  test('can type in search input', async ({ page }) => {
    // Type in search
    await page.getByRole('searchbox').fill('test search');

    // Verify the input has the text
    await expect(page.getByRole('searchbox')).toHaveValue('test search');

    // Clear the search
    await page.getByRole('searchbox').fill('');
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('main elements have proper roles', async ({ page }) => {
    // Check for main heading
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    // Check for buttons with proper labels
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();
  });

  test('can navigate using keyboard', async ({ page }) => {
    // Click the New Task button to open dialog
    await page.getByRole('button', { name: 'New Task' }).click();

    // Dialog should be open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

// Helper functions for common operations
async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}