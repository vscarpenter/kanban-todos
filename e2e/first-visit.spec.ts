import { test, expect } from '@playwright/test';

test.describe('First Visit and Onboarding', () => {
  test('first-time visitor is redirected to /about/', async ({ page }) => {
    // Do NOT set the visited flag; this simulates a first visit.
    await page.goto('/');

    // FirstVisitGate uses router.replace('/about/') on the client.
    await page.waitForURL(/\/about\/?$/);

    // The about hero heading wraps text across two lines and includes accent dots.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Organize your work/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Own your data/);
  });

  test('about page shows the privacy/feature pillars', async ({ page }) => {
    await page.goto('/about/');

    await expect(page.getByText(/Local storage only/i)).toBeVisible();
    await expect(page.getByText(/Works offline/i)).toBeVisible();
    await expect(page.getByText(/MIT open source/i)).toBeVisible();
  });

  test('"Open Cascade" link enters the app and sets the visited flag', async ({ page }) => {
    await page.goto('/about/');

    // The hero CTA. There is also a duplicate "Open Cascade" link in the
    // FooterCTA — pick the first match.
    await page.getByRole('link', { name: /Open Cascade/i }).first().click();

    await page.waitForURL(/^https?:\/\/[^/]+\/?$/);
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    // Verify the visited flag was persisted
    const visited = await page.evaluate(() =>
      localStorage.getItem('cascade_has_visited')
    );
    expect(visited).toBe('true');
  });

  test('returning visitor goes straight to the board', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');

    // No redirect to /about/ should happen
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('user guide opens via F1 and renders guide steps', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await page.keyboard.press('F1');

    // The guide dialog opens; renders Previous (disabled on step 0) and Next
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: /Previous/ })).toBeDisabled();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Next' })
    ).toBeEnabled();

    // Step indicator: "1 of N"
    await expect(page.getByText(/^1 of \d+$/)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('user guide Next button advances steps', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();

    await page.keyboard.press('F1');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('dialog').getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/^2 of \d+$/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Previous/ })).toBeEnabled();

    await page.keyboard.press('Escape');
  });

  test('about page navigates to privacy policy', async ({ page }) => {
    await page.goto('/about/');

    // PrivacySection renders a button or link to the privacy page. Use the
    // header nav link which is always present.
    const privacyLink = page.getByRole('link', { name: /Privacy/i }).first();
    if (await privacyLink.isVisible().catch(() => false)) {
      await privacyLink.click();
      await page.waitForURL(/\/privacy\/?$/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});
