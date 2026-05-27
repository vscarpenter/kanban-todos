import { expect, type Locator, type Page } from '@playwright/test';

export async function pressShortcutUntilVisible(
  page: Page,
  shortcut: string,
  target: Locator
): Promise<void> {
  await expect(async () => {
    await page.keyboard.press(shortcut);
    await expect(target).toBeVisible({ timeout: 500 });
  }).toPass({
    timeout: 5000,
    intervals: [100, 250, 500],
  });
}
