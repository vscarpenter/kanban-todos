import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('Board Appearance', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('appearance picker is visible in Create Board dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add board' }).click();

    await expect(page.getByText('Icon', { exact: true })).toBeVisible();
    await expect(page.getByText('Accent dot', { exact: true })).toBeVisible();

    // Default selections (Layers icon + plum dot) are aria-pressed=true
    const layersBtn = page.getByRole('button', { name: 'Layers', exact: true });
    await expect(layersBtn).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Escape');
  });

  test('selects a different icon when creating a board', async ({ page }) => {
    await page.getByRole('button', { name: 'Add board' }).click();

    // Pick the "Work" icon (Briefcase)
    const workIcon = page.getByRole('button', { name: 'Work', exact: true });
    await workIcon.click();
    await expect(workIcon).toHaveAttribute('aria-pressed', 'true');

    // Default Layers should no longer be selected
    await expect(page.getByRole('button', { name: 'Layers', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    await page.keyboard.press('Escape');
  });

  test('selects a different accent color when creating a board', async ({ page }) => {
    await page.getByRole('button', { name: 'Add board' }).click();

    const blueDot = page.getByRole('button', { name: 'Blue', exact: true });
    await blueDot.click();
    await expect(blueDot).toHaveAttribute('aria-pressed', 'true');

    // Default plum should no longer be selected
    await expect(page.getByRole('button', { name: 'Plum', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    await page.keyboard.press('Escape');
  });

  test('creates a board with custom appearance and persists across reload', async ({ page }) => {
    const boardName = 'Customized Board';

    await page.getByRole('button', { name: 'Add board' }).click();
    await page.getByLabel('Board Name *').fill(boardName);
    await page.getByRole('button', { name: 'Code', exact: true }).click();
    await page.getByRole('button', { name: 'Green', exact: true }).click();
    await page.getByRole('button', { name: 'Create Board' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await expect(boardItem(page, boardName)).toBeVisible();

    await page.reload();
    await expect(boardItem(page, boardName).first()).toBeVisible();

    // Open Edit on the board to verify the saved appearance round-tripped
    const item = boardItem(page, boardName).first();
    await item.hover();
    await item.getByRole('button', { name: 'Board options' }).click();
    await page.getByRole('menuitem', { name: 'Edit Board' }).click();
    await expect(page.getByRole('heading', { name: 'Board Settings' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Code', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.getByRole('button', { name: 'Green', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  });

  test('changes appearance when editing an existing board', async ({ page }) => {
    const boardName = 'Edit Appearance Board';

    await createBoard(page, boardName);

    const item = boardItem(page, boardName).first();
    await item.hover();
    await item.getByRole('button', { name: 'Board options' }).click();
    await page.getByRole('menuitem', { name: 'Edit Board' }).click();
    await expect(page.getByRole('heading', { name: 'Board Settings' })).toBeVisible();

    await page.getByRole('button', { name: 'Marketing', exact: true }).click();
    await page.getByRole('button', { name: 'Amber', exact: true }).click();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // Verify by re-opening the edit dialog
    await item.hover();
    await item.getByRole('button', { name: 'Board options' }).click();
    await page.getByRole('menuitem', { name: 'Edit Board' }).click();

    await expect(page.getByRole('button', { name: 'Marketing', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.getByRole('button', { name: 'Amber', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  });

  test('all 12 icon options are rendered', async ({ page }) => {
    await page.getByRole('button', { name: 'Add board' }).click();

    const labels = [
      'Layers',
      'Work',
      'Launch',
      'Marketing',
      'Home',
      'Side project',
      'Learning',
      'Code',
      'Design',
      'Goals',
      'Ideas',
      'Tagged',
    ];
    for (const label of labels) {
      await expect(
        page.getByRole('button', { name: label, exact: true })
      ).toBeVisible();
    }

    await page.keyboard.press('Escape');
  });

  test('all 7 accent dot colors are rendered', async ({ page }) => {
    await page.getByRole('button', { name: 'Add board' }).click();

    const labels = ['Blue', 'Amber', 'Green', 'Rose', 'Plum', 'Clay', 'Moss'];
    for (const label of labels) {
      await expect(
        page.getByRole('button', { name: label, exact: true })
      ).toBeVisible();
    }

    await page.keyboard.press('Escape');
  });
});

// Helper functions

function boardItem(page: Page, name: string): Locator {
  return page.locator('[role="button"]', {
    has: page.getByText(name, { exact: true }),
  }).filter({ hasNotText: 'Move ' });
}

async function createBoard(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Add board' }).click();
  await page.getByLabel('Board Name *').fill(name);
  await page.getByRole('button', { name: 'Create Board' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(boardItem(page, name).first()).toBeVisible();
}
