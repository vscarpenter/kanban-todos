import { test, expect } from '@playwright/test';

test.describe('Cross-Board Search End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Ensure we have some test data by creating boards and tasks
    await setupTestData(page);
  });

  test('should perform complete cross-board search workflow', async ({ page }) => {
    // Step 1: Verify initial state - current board search
    const searchInput = page.getByPlaceholder('Search tasks...');
    await expect(searchInput).toBeVisible();
    
    // Step 2: Perform current board search
    await searchInput.fill('project');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should show results from current board only
    const currentBoardResults = page.locator('[data-testid="task-card"]');
    const currentBoardCount = await currentBoardResults.count();
    
    // Step 3: Enable cross-board search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click();
    
    // Verify placeholder changes
    await expect(page.getByPlaceholder('Search across all boards...')).toBeVisible();
    
    // Step 4: Perform cross-board search
    await searchInput.fill('task');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should show more results from all boards
    const crossBoardResults = page.locator('[data-testid="task-card"]');
    const crossBoardCount = await crossBoardResults.count();
    expect(crossBoardCount).toBeGreaterThan(currentBoardCount);
    
    // Step 5: Verify board indicators are shown
    const boardIndicators = page.locator('[data-testid="board-indicator"]');
    await expect(boardIndicators.first()).toBeVisible();
    
    // Step 6: Test navigation to task's board
    const firstTaskCard = crossBoardResults.first();
    await firstTaskCard.click();
    
    // Should navigate to the task's board and highlight the task
    await expect(page.locator('[data-testid="highlighted-task"]')).toBeVisible();
    
    // Step 7: Test filter combinations
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: /to do/i }).click();
    
    // Should filter cross-board results by status
    const filteredResults = page.locator('[data-testid="task-card"]');
    const filteredCount = await filteredResults.count();
    expect(filteredCount).toBeLessThanOrEqual(crossBoardCount);
    
    // Step 8: Test search scope persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Cross-board search should be remembered (if enabled in settings)
    await expect(page.getByPlaceholder('Search across all boards...')).toBeVisible();
  });

  test('should handle search performance with large datasets', async ({ page }) => {
    // Create a large number of tasks
    await createLargeDataset(page);
    
    // Enable cross-board search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click();
    
    // Perform search and measure performance
    const startTime = Date.now();
    
    await page.getByPlaceholder('Search across all boards...').fill('test');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for search to complete
    await page.waitForSelector('[data-testid="search-results-summary"]');
    
    const endTime = Date.now();
    const searchDuration = endTime - startTime;
    
    // Should complete within performance threshold (500ms + some buffer for UI)
    expect(searchDuration).toBeLessThan(1000);
    
    // Should show performance information
    await page.getByRole('button', { name: /filters/i }).click();
    await expect(page.getByRole('button', { name: /performance info/i })).toBeVisible();
    
    await page.getByRole('button', { name: /performance info/i }).click();
    await expect(page.getByText(/Dataset:/)).toBeVisible();
    await expect(page.getByText(/Last search:/)).toBeVisible();
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    // Enable cross-board search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click();
    
    // Simulate network error by intercepting requests
    await page.route('**/api/tasks**', route => route.abort());
    
    // Attempt search
    await page.getByPlaceholder('Search across all boards...').fill('error test');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should show error message
    await expect(page.getByText('Search Error')).toBeVisible();
    
    // Should show recovery options
    await expect(page.getByRole('button', { name: /clear search/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    
    // Test error recovery
    await page.getByRole('button', { name: /clear search/i }).click();
    
    // Error should be cleared
    await expect(page.getByText('Search Error')).not.toBeVisible();
    
    // Remove route interception
    await page.unroute('**/api/tasks**');
  });

  test('should handle board deletion during active search', async ({ page }) => {
    // Enable cross-board search and perform search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click();
    
    await page.getByPlaceholder('Search across all boards...').fill('task');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Get initial results count
    const initialResults = page.locator('[data-testid="task-card"]');
    const initialCount = await initialResults.count();
    
    // Delete a board (simulate through board management)
    await deleteBoardWithTasks(page, 'Test Board 2');
    
    // Results should be updated to exclude tasks from deleted board
    const updatedResults = page.locator('[data-testid="task-card"]');
    const updatedCount = await updatedResults.count();
    expect(updatedCount).toBeLessThan(initialCount);
    
    // Should show notification about board deletion
    await expect(page.getByText(/board deleted/i)).toBeVisible();
  });

  test('should validate search scope toggle behavior', async ({ page }) => {
    // Test initial state
    await expect(page.getByPlaceholder('Search tasks...')).toBeVisible();
    
    // Open filters and check initial toggle state
    await page.getByRole('button', { name: /filters/i }).click();
    const toggle = page.getByRole('switch', { name: /search all boards/i });
    await expect(toggle).not.toBeChecked();
    await expect(page.getByText('Searching current board only')).toBeVisible();
    
    // Enable cross-board search
    await toggle.click();
    await expect(toggle).toBeChecked();
    await expect(page.getByText('Searching across all boards')).toBeVisible();
    
    // Verify placeholder changes
    await expect(page.getByPlaceholder('Search across all boards...')).toBeVisible();
    
    // Verify globe icon appears
    await expect(page.locator('[data-testid="cross-board-indicator"]')).toBeVisible();
    
    // Disable cross-board search
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    await expect(page.getByPlaceholder('Search tasks...')).toBeVisible();
  });

  test('should handle complex filter combinations', async ({ page }) => {
    // Enable cross-board search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click();
    
    // Apply search filter
    await page.getByPlaceholder('Search across all boards...').fill('important');
    
    // Apply status filter
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: /in progress/i }).click();
    
    // Apply priority filter
    await page.getByRole('combobox', { name: /priority/i }).click();
    await page.getByRole('option', { name: /high/i }).click();
    
    // Perform search
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should show filtered results
    const results = page.locator('[data-testid="task-card"]');
    const resultCount = await results.count();
    
    // Verify all results match the filters
    for (let i = 0; i < resultCount; i++) {
      const taskCard = results.nth(i);
      await expect(taskCard).toContainText('important');
      await expect(taskCard.locator('[data-testid="task-status"]')).toContainText('In Progress');
      await expect(taskCard.locator('[data-testid="task-priority"]')).toContainText('High');
    }
    
    // Should show active filter badges
    await expect(page.getByText('Status: in-progress')).toBeVisible();
    await expect(page.getByText('Priority: high')).toBeVisible();
    
    // Test removing individual filters
    await page.getByRole('button', { name: /remove status filter/i }).click();
    
    // Should update results
    const updatedResults = page.locator('[data-testid="task-card"]');
    const updatedCount = await updatedResults.count();
    expect(updatedCount).toBeGreaterThanOrEqual(resultCount);
    
    // Test clear all filters
    await page.getByRole('button', { name: /clear all/i }).click();
    
    // Should show all tasks
    const allResults = page.locator('[data-testid="task-card"]');
    const allCount = await allResults.count();
    expect(allCount).toBeGreaterThan(updatedCount);
  });

  test('should show loading states during search', async ({ page }) => {
    // Enable cross-board search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click();
    
    // Slow down network to see loading states
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Start search
    const searchPromise = page.getByPlaceholder('Search across all boards...').fill('loading test');
    
    // Should show loading spinner
    await expect(page.locator('[data-testid="search-loading"]')).toBeVisible();
    
    // Should show loading overlay
    await expect(page.getByText('Searching all boards...')).toBeVisible();
    
    // Input should be disabled
    const searchInput = page.getByPlaceholder('Search across all boards...');
    await expect(searchInput).toBeDisabled();
    
    await searchPromise;
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Wait for loading to complete
    await expect(page.locator('[data-testid="search-loading"]')).not.toBeVisible();
    await expect(searchInput).toBeEnabled();
    
    // Remove route interception
    await page.unroute('**/api/**');
  });

  test('should display search results summary', async ({ page }) => {
    // Enable cross-board search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click();
    
    // Perform search
    await page.getByPlaceholder('Search across all boards...').fill('task');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should show results summary
    const summary = page.locator('[data-testid="search-results-summary"]');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(/Found \d+ tasks? across all boards/);
    
    // Should show performance timing
    await expect(summary).toContainText(/\(\d+ms\)/);
    
    // Test with current board search
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('switch', { name: /search all boards/i }).click(); // Disable
    
    await page.getByPlaceholder('Search tasks...').fill('project');
    await page.getByRole('button', { name: 'Search' }).click();
    
    // Should show current board summary
    await expect(summary).toContainText(/Found \d+ tasks? in current board/);
  });
});

// Helper functions for test setup
async function setupTestData(page: any) {
  // Create test boards
  await page.evaluate(() => {
    // This would typically interact with your app's API or state management
    // For now, we'll assume the app has some default test data
    console.log('Setting up test data...');
  });
}

async function createLargeDataset(page: any) {
  // Create a large number of tasks for performance testing
  await page.evaluate(() => {
    // This would create many tasks across multiple boards
    console.log('Creating large dataset...');
  });
}

async function deleteBoardWithTasks(page: any, boardName: string) {
  // Navigate to board management and delete a board
  await page.evaluate((name) => {
    // This would trigger board deletion through the app's interface
    console.log(`Deleting board: ${name}`);
  }, boardName);
}