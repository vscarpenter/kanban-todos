import { test, expect, type Page } from '@playwright/test';
import { resetAppStorage } from './fixtures';

async function boot(page: Page): Promise<void> {
  await resetAppStorage(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
}

test.describe('PWA Features', () => {
  test('links to the web app manifest', async ({ page }) => {
    await boot(page);

    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/manifest.json');
  });

  test('displays version indicator in the sidebar footer', async ({ page }) => {
    await boot(page);

    await expect(page.getByText(/^Cascade v/)).toBeVisible();
    await expect(page.getByText(/\d{4}/)).toBeVisible();
  });

  test('version footer theme toggle switches the document theme', async ({ page }) => {
    await boot(page);

    await page.getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Light theme' }).click();
    await expect(page.locator('html')).toHaveClass(/light/);

    await page.getByRole('button', { name: 'System theme' }).click();
  });

  test('does not show a service worker update banner on a fresh dev load', async ({ page }) => {
    await boot(page);

    await expect(page.getByText(/Update available/i)).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('manifest.json is served with expected PWA metadata', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBe(true);

    const manifest = (await response.json()) as {
      name?: string;
      short_name?: string;
      display?: string;
    };

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.display).toBe('standalone');
  });
});
