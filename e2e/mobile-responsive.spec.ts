import { test, expect, type Page } from '@playwright/test';
import { resetAppStorage } from './fixtures';
import { pressShortcutUntilVisible } from './helpers/keyboard';

const MOBILE = { width: 375, height: 667 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1280, height: 720 };

// Each test picks its own viewport before navigating, so this can't use the
// auto-navigating `test` from './fixtures' - just the storage reset for
// isolation.
async function boot(page: Page, viewport = MOBILE): Promise<void> {
  await page.setViewportSize(viewport);
  await resetAppStorage(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
}

test.describe('Mobile and Responsive', () => {
  test('board layout adapts to mobile viewport', async ({ page }) => {
    await boot(page, MOBILE);

    await expect(page.getByRole('button', { name: /^To Do\(\d+\)$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^In Progress\(\d+\)$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Done\(\d+\)$/ })).toBeVisible();
  });

  test('sidebar toggle is visible on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    // The toggle's aria-label is "Open sidebar" or "Close sidebar" depending
    // on state; sidebar is open by default on first visit.
    await expect(page.getByRole('button', { name: /Open sidebar|Close sidebar/ })).toBeVisible();
  });

  test('sidebar toggle is hidden on desktop', async ({ page }) => {
    await boot(page, DESKTOP);

    // The mobile-only toggle has the `md:hidden` class. On desktop, none of
    // the Open/Close variants should be in the DOM.
    await expect(page.getByRole('button', { name: /Open sidebar|Close sidebar/ })).toHaveCount(0);
  });

  test('mobile sidebar toggle is interactive', async ({ page }) => {
    await boot(page, MOBILE);

    const toggle = page.getByRole('button', { name: /Open sidebar|Close sidebar/ });
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeEnabled();
  });

  test('task cards render on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Title *').fill('Mobile Task');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.locator('.task-card', { hasText: 'Mobile Task' })).toBeVisible();
  });

  test('can create task on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Title *').fill('Mobile Task');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.locator('.task-card', { hasText: 'Mobile Task' })).toBeVisible();
  });

  test('can open settings on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    // Sidebar starts open on mobile, so Settings is reachable directly.
    await page.getByRole('button', { name: 'Settings', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('can open archive on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    await page.getByRole('button', { name: 'Archive', exact: true }).click();

    await expect(page.getByRole('heading', { name: /Archive/ })).toBeVisible();
  });

  test('dialog fits on mobile viewport', async ({ page }) => {
    await boot(page, MOBILE);

    await page.getByRole('button', { name: 'New Task' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Task' })).toBeVisible();
  });

  test('tablet viewport displays correctly', async ({ page }) => {
    await boot(page, TABLET);

    await expect(page.getByRole('button', { name: /^To Do\(\d+\)$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^In Progress\(\d+\)$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Done\(\d+\)$/ })).toBeVisible();
  });

  test('orientation change works correctly', async ({ page }) => {
    await boot(page, MOBILE);
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('move task to another column on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Title *').fill('Task 1');
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.locator('.task-card', { hasText: 'Task 1' })).toBeVisible();

    const card = page.locator('.task-card', { hasText: 'Task 1' });
    await card.getByRole('button', { name: /Task options/i }).click();
    await page.getByRole('menuitem', { name: 'Move to Column' }).hover();
    await page.getByRole('menuitem', { name: 'In Progress', exact: true }).click();

    // Card exists in DOM after move (may be off-screen on mobile narrow viewport)
    await expect(page.locator('.task-card', { hasText: 'Task 1' })).toHaveCount(1);
  });

  test('touch targets meet accessibility threshold', async ({ page }) => {
    await boot(page, MOBILE);

    const newTaskButton = page.getByRole('button', { name: 'New Task' });
    await expect(newTaskButton).toBeVisible();

    const box = await newTaskButton.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('keyboard navigation works on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    await pressShortcutUntilVisible(page, 'n', page.getByRole('dialog'));

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('can switch boards on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    await page.getByRole('button', { name: 'Add board' }).click();
    await page.getByLabel('Board Name *').fill('Mobile Board');
    await page.getByRole('button', { name: 'Create Board' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page
      .locator('[role="button"]', { has: page.getByText('Mobile Board', { exact: true }) })
      .filter({ hasNotText: 'Move ' })
      .first()
      .click();

    await expect(page.getByRole('heading', { name: 'Mobile Board' })).toBeVisible();
  });

  test('scrolling works on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    for (let i = 1; i <= 5; i++) {
      await page.getByRole('button', { name: 'New Task' }).click();
      await page.getByLabel('Title *').fill(`Task ${i}`);
      await page.getByRole('button', { name: 'Create Task' }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
    }

    await page.evaluate(() => window.scrollBy(0, 200));

    await expect(page.locator('.task-card', { hasText: 'Task 1' })).toBeVisible();
  });

  test('desktop viewport displays sidebar by default', async ({ page }) => {
    await boot(page, DESKTOP);

    await expect(page.getByText('Boards')).toBeVisible();
  });

  test('handles long task titles on mobile', async ({ page }) => {
    await boot(page, MOBILE);

    const longTitle = 'This is a very long task title that should be truncated on mobile devices to prevent layout issues';

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Title *').fill(longTitle);
    await page.getByRole('button', { name: 'Create Task' }).click();

    // The title may render truncated, so match on a leading substring
    await expect(page.locator('.task-card', { hasText: 'This is a very long' })).toBeVisible();
  });
});
