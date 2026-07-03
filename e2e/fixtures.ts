import { test as base, expect, type Page, type Locator } from '@playwright/test';

/**
 * Clears IndexedDB and localStorage, then marks the app as "already
 * visited" so the test lands on the board instead of the onboarding page.
 *
 * This runs via `page.addInitScript`, which Playwright re-executes on every
 * navigation in the page — including a test's own `page.reload()`. Tests
 * that reload mid-test to verify persistence (there are many) would
 * otherwise wipe the very data they just created. `window.name` survives
 * same-origin navigations and reloads (it belongs to the tab, not the
 * document), so it's used here as a "have we already reset this test?"
 * marker: the clear only runs the first time the init script fires.
 *
 * Exported standalone (not just baked into the `page` fixture below) for
 * specs that need isolation but can't use the default auto-navigate
 * behavior — e.g. a test that must call `page.emulateMedia()` before its
 * first `page.goto()`.
 */
export async function resetAppStorage(page: Page): Promise<void> {
  const resetToken = `e2e-reset-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await page.addInitScript((token: string) => {
    if (window.name !== token) {
      window.name = token;

      try {
        localStorage.clear();
      } catch {
        // localStorage unavailable (private browsing) - nothing to clear.
      }

      if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
        indexedDB
          .databases()
          .then((dbs) => Promise.all(dbs.map((db) => db.name && indexedDB.deleteDatabase(db.name))))
          .catch(() => {
            // Best-effort cleanup; a failure here shouldn't fail the test.
          });
      }
    }

    // Skip the first-visit onboarding redirect on every navigation
    // (including the reload that immediately follows a real reset above).
    localStorage.setItem('cascade_has_visited', 'true');
  }, resetToken);
}

/**
 * `test` with isolation baked in: every test gets a page with IndexedDB and
 * localStorage cleared, the onboarding flag pre-set, and the default "Work
 * Tasks" board already loaded and visible before the test body runs.
 *
 * Specs whose setup genuinely differs (custom viewport before navigating,
 * `emulateMedia` before navigating, testing the onboarding redirect itself,
 * a non-default ready-check, etc.) should import `test`/`expect` from
 * '@playwright/test' directly and call `resetAppStorage(page)` manually.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await resetAppStorage(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
    await use(page);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Shared helpers
//
// These were copy-pasted (with small drifts) across most spec files. Kept as
// plain functions rather than fixtures, since every call site already passes
// `page` explicitly - that keeps migrated spec files close to what they
// looked like before.
// ---------------------------------------------------------------------------

export function taskCard(page: Page, title: string): Locator {
  return page.locator('.task-card', { hasText: title });
}

export function column(page: Page, title: string): Locator {
  return page
    .locator('.kanban-column')
    .filter({ has: page.locator('.kanban-column__header').filter({ hasText: title }) })
    .first();
}

// BoardItem is a <div role="button"> that wraps nested reorder buttons and a
// menu trigger. Plain role-based selectors match multiple elements; this
// helper scopes to the outer item by anchoring on the exact board-name text
// node.
export function boardItem(page: Page, name: string): Locator {
  return page
    .locator('[role="button"]', { has: page.getByText(name, { exact: true }) })
    .filter({ hasNotText: 'Move ' });
}

export async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

export async function createBoard(page: Page, name: string, description?: string): Promise<void> {
  await page.getByRole('button', { name: 'Add board' }).click();
  await page.getByLabel('Board Name *').fill(name);
  if (description) {
    await page.getByLabel('Description').fill(description);
  }
  await page.getByRole('button', { name: 'Create Board' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(boardItem(page, name).first()).toBeVisible();
}

export async function selectBoard(page: Page, name: string): Promise<void> {
  await boardItem(page, name).first().click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

export async function createTaskWithDetails(
  page: Page,
  title: string,
  options: {
    description?: string;
    priority?: 'Low' | 'Medium' | 'High';
    tags?: string;
    dueDatePreset?: 'Today' | 'Tomorrow' | 'Next Week' | 'No Date';
  } = {}
): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);

  if (options.dueDatePreset) {
    await page.getByRole('button', { name: options.dueDatePreset, exact: true }).click();
  }

  if (options.description || options.priority || options.tags) {
    await page.getByRole('button', { name: 'Show Details' }).click();

    if (options.description) {
      await page.getByLabel('Description').fill(options.description);
    }

    if (options.priority) {
      // Shadcn Select components have no accessible name from the htmlFor
      // label, so we walk from the label text to the sibling combobox trigger.
      const trigger = page.getByText('Priority', { exact: true }).locator('xpath=..').getByRole('combobox');
      await trigger.click();
      await page.getByRole('option', { name: options.priority, exact: true }).click();
    }

    if (options.tags) {
      await page.getByLabel('Tags').fill(options.tags);
    }
  }

  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}
