import { test, expect } from '@playwright/test'

test.describe('Kanban App', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
  });

  test('loads homepage and shows kanban board', async ({ page }) => {
    await page.goto('/')
    
    // Check that the app loads with basic structure
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible()
    
    // Check for basic kanban structure
    await expect(page.getByText('To Do')).toBeVisible()
    await expect(page.getByText('In Progress')).toBeVisible() 
    await expect(page.getByText('Done')).toBeVisible()
  })
})