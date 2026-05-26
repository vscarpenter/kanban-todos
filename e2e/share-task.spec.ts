import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('Share Task Dialog', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions for the copy-to-clipboard tests
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('opens share dialog from task menu', async ({ page }) => {
    const taskTitle = 'Shareable Task';
    await createTask(page, taskTitle);

    await openShareDialog(page, taskTitle);

    await expect(
      page.getByRole('heading', { name: new RegExp(`Share Task: ${taskTitle}`) })
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Copy Details' })).toBeVisible();
  });

  test('email tab shows recipient input and preview', async ({ page }) => {
    const taskTitle = 'Email Task';
    await createTask(page, taskTitle);

    await openShareDialog(page, taskTitle);

    await expect(page.getByLabel('Recipient Email (optional)')).toBeVisible();
    await expect(page.getByRole('button', { name: /Open Email Client/i })).toBeVisible();

    // Email preview textarea should contain the task title
    const preview = page.getByRole('dialog').getByRole('textbox').nth(1);
    await expect(preview).toContainText(taskTitle);
  });

  test('switches to Copy Details tab and shows plain + markdown previews', async ({ page }) => {
    const taskTitle = 'Copy Task';
    const description = 'Some description here';
    await createTaskWithDescription(page, taskTitle, description);

    await openShareDialog(page, taskTitle);

    await page.getByRole('tab', { name: 'Copy Details' }).click();

    await expect(page.getByText('Plain Text')).toBeVisible();
    await expect(page.getByText('Markdown', { exact: true })).toBeVisible();

    // Both textareas should contain the task title
    const textareas = page.getByRole('dialog').getByRole('textbox');
    await expect(textareas.nth(0)).toContainText(taskTitle);
    await expect(textareas.nth(1)).toContainText(taskTitle);
  });

  test('copies plain text to clipboard', async ({ page }) => {
    const taskTitle = 'Clipboard Plain Task';
    await createTask(page, taskTitle);

    await openShareDialog(page, taskTitle);
    await page.getByRole('tab', { name: 'Copy Details' }).click();

    // The Copy Details tab renders two columns. Each column has a Label
    // (Plain Text / Markdown) followed by a div containing the textarea
    // and an absolutely-positioned copy button. Anchor on the textareas
    // to disambiguate; the button is the sibling button of each textarea.
    const dialog = page.getByRole('dialog');
    const textareas = dialog.getByRole('textbox', { includeHidden: false });

    // The plain-text textarea is the first textarea in the Copy Details tab.
    // Its sibling button is the copy trigger.
    const plainCopyBtn = textareas.first().locator('xpath=following-sibling::button[1]');
    await plainCopyBtn.click();

    // Toast confirms the action
    await expect(page.locator('[data-sonner-toast]')).toContainText(
      /Task details copied to clipboard \(plain\)/i,
      { timeout: 3000 }
    );

    // Clipboard contains the plain-text preview
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(taskTitle);
  });

  test('copies markdown to clipboard', async ({ page }) => {
    const taskTitle = 'Clipboard Markdown Task';
    await createTask(page, taskTitle);

    await openShareDialog(page, taskTitle);
    await page.getByRole('tab', { name: 'Copy Details' }).click();

    const dialog = page.getByRole('dialog');
    const textareas = dialog.getByRole('textbox', { includeHidden: false });
    const markdownCopyBtn = textareas.nth(1).locator('xpath=following-sibling::button[1]');
    await markdownCopyBtn.click();

    await expect(page.locator('[data-sonner-toast]')).toContainText(
      /Task details copied to clipboard \(markdown\)/i,
      { timeout: 3000 }
    );

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(taskTitle);
    // Markdown variant includes a heading marker
    expect(clipboardText).toMatch(/^#\s|\n#\s/);
  });

  test('cancel button closes the share dialog', async ({ page }) => {
    const taskTitle = 'Cancellable Task';
    await createTask(page, taskTitle);

    await openShareDialog(page, taskTitle);
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('Escape closes the share dialog', async ({ page }) => {
    const taskTitle = 'Escapable Task';
    await createTask(page, taskTitle);

    await openShareDialog(page, taskTitle);
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

// Helper functions

function taskCard(page: Page, title: string): Locator {
  return page.locator('.task-card', { hasText: title });
}

async function createTask(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

async function createTaskWithDescription(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill(title);
  await page.getByRole('button', { name: 'Show Details' }).click();
  await page.getByLabel('Description').fill(description);
  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(taskCard(page, title).first()).toBeVisible();
}

async function openShareDialog(page: Page, taskTitle: string): Promise<void> {
  const card = taskCard(page, taskTitle).first();
  await card.getByRole('button', { name: /Task options/i }).click();
  await page.getByRole('menuitem', { name: 'Share Task' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
