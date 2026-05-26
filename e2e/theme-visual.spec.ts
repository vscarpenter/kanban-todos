import { test, expect, type Page, type Locator } from '@playwright/test';

test.describe('Theme Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
  });

  test('default theme respects the system color scheme (light)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    const html = page.locator('html');
    // next-themes adds .light when system → light. It may also add .dark for
    // dark, depending on the resolved value. The class should be one of these.
    await expect(html).toHaveClass(/light/);
  });

  test('default theme respects the system color scheme (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('selecting Dark theme adds .dark class to <html>', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await openSettings(page);
    await selectByLabel(page, 'Theme', 'Dark');
    await saveSettings(page);

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('selecting Light theme adds .light class to <html>', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await openSettings(page);
    await selectByLabel(page, 'Theme', 'Light');
    await saveSettings(page);

    await expect(page.locator('html')).toHaveClass(/light/);
  });

  test('theme class persists across page reloads', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await openSettings(page);
    await selectByLabel(page, 'Theme', 'Dark');
    await saveSettings(page);
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('background color changes between light and dark themes', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    // Force light
    await openSettings(page);
    await selectByLabel(page, 'Theme', 'Light');
    await saveSettings(page);

    const lightBg = await getBackgroundColor(page);

    // Switch to dark
    await openSettings(page);
    await selectByLabel(page, 'Theme', 'Dark');
    await saveSettings(page);

    // Background-color transition is 200ms in globals.css; wait briefly for it
    await page.waitForTimeout(300);
    const darkBg = await getBackgroundColor(page);

    expect(lightBg).not.toBe(darkBg);
  });

  test('high contrast setting persists across reloads (no DOM class side-effect)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await openSettings(page);
    const highContrast = page.getByRole('switch', { name: 'High contrast mode' });
    await highContrast.click();
    await saveSettings(page);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await openSettings(page);
    await expect(page.getByRole('switch', { name: 'High contrast mode' })).toBeChecked();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

// Helper functions

async function openSettings(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: /Open sidebar/i });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}

function comboboxFor(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator('xpath=..').getByRole('combobox');
}

async function selectByLabel(page: Page, label: string, optionText: string): Promise<void> {
  await comboboxFor(page, label).click();
  await page.getByRole('option', { name: optionText, exact: true }).click();
}

async function saveSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

async function getBackgroundColor(page: Page): Promise<string> {
  return page.evaluate(() => {
    return getComputedStyle(document.body).backgroundColor;
  });
}
