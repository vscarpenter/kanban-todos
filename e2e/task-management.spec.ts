import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test('should create, edit, and delete tasks', async ({ page }) => {
    // Create a new task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Test Task');
    await page.fill('[data-testid="task-description-input"]', 'Test Description');
    await page.selectOption('[data-testid="task-priority-select"]', 'high');
    await page.click('[data-testid="save-task-button"]');

    // Verify task was created
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Test Task');
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Test Description');

    // Edit the task
    await page.click('[data-testid="task-card"]');
    await page.fill('[data-testid="task-title-input"]', 'Updated Task');
    await page.fill('[data-testid="task-description-input"]', 'Updated Description');
    await page.click('[data-testid="save-task-button"]');

    // Verify task was updated
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Updated Task');
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Updated Description');

    // Delete the task
    await page.click('[data-testid="task-menu-button"]');
    await page.click('[data-testid="delete-task-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify task was deleted
    await expect(page.locator('[data-testid="task-card"]')).not.toBeVisible();
  });

  test('should move tasks between columns', async ({ page }) => {
    // Create a task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Movable Task');
    await page.click('[data-testid="save-task-button"]');

    // Verify task is in "To Do" column
    await expect(page.locator('[data-testid="todo-column"] [data-testid="task-card"]'))
      .toContainText('Movable Task');

    // Move task to "In Progress"
    await page.dragAndDrop(
      '[data-testid="task-card"]',
      '[data-testid="in-progress-column"]'
    );

    // Verify task moved
    await expect(page.locator('[data-testid="in-progress-column"] [data-testid="task-card"]'))
      .toContainText('Movable Task');
    await expect(page.locator('[data-testid="todo-column"] [data-testid="task-card"]'))
      .not.toBeVisible();

    // Move task to "Done"
    await page.dragAndDrop(
      '[data-testid="task-card"]',
      '[data-testid="done-column"]'
    );

    // Verify task moved to done
    await expect(page.locator('[data-testid="done-column"] [data-testid="task-card"]'))
      .toContainText('Movable Task');
  });

  test('should search and filter tasks', async ({ page }) => {
    // Create multiple tasks with different properties
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'High Priority Task');
    await page.selectOption('[data-testid="task-priority-select"]', 'high');
    await page.click('[data-testid="save-task-button"]');

    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Low Priority Task');
    await page.selectOption('[data-testid="task-priority-select"]', 'low');
    await page.click('[data-testid="save-task-button"]');

    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Medium Priority Task');
    await page.selectOption('[data-testid="task-priority-select"]', 'medium');
    await page.click('[data-testid="save-task-button"]');

    // Search for specific task
    await page.fill('[data-testid="search-input"]', 'High Priority');
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="task-card"]')).toContainText('High Priority Task');

    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(3);

    // Filter by priority
    await page.click('[data-testid="filter-button"]');
    await page.check('[data-testid="filter-high-priority"]');
    await page.click('[data-testid="apply-filter-button"]');

    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="task-card"]')).toContainText('High Priority Task');

    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(3);
  });

  test('should handle task validation', async ({ page }) => {
    // Try to create task without title
    await page.click('[data-testid="add-task-button"]');
    await page.click('[data-testid="save-task-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Title is required');

    // Fill in title and save
    await page.fill('[data-testid="task-title-input"]', 'Valid Task');
    await page.click('[data-testid="save-task-button"]');

    // Should create task successfully
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Valid Task');
  });

  test('should duplicate tasks', async ({ page }) => {
    // Create a task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Original Task');
    await page.fill('[data-testid="task-description-input"]', 'Original Description');
    await page.selectOption('[data-testid="task-priority-select"]', 'high');
    await page.click('[data-testid="save-task-button"]');

    // Duplicate the task
    await page.click('[data-testid="task-menu-button"]');
    await page.click('[data-testid="duplicate-task-button"]');

    // Verify both tasks exist
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="task-card"]').first()).toContainText('Original Task');
    await expect(page.locator('[data-testid="task-card"]').last()).toContainText('Original Task (Copy)');
  });

  test('should archive tasks', async ({ page }) => {
    // Create a task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Task to Archive');
    await page.click('[data-testid="save-task-button"]');

    // Archive the task
    await page.click('[data-testid="task-menu-button"]');
    await page.click('[data-testid="archive-task-button"]');

    // Verify task is archived (should not be visible in main board)
    await expect(page.locator('[data-testid="task-card"]')).not.toBeVisible();

    // Check archived tasks view
    await page.click('[data-testid="archived-tasks-button"]');
    await expect(page.locator('[data-testid="archived-task-card"]')).toContainText('Task to Archive');
  });
});

test.describe('Board Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test('should create and switch between boards', async ({ page }) => {
    // Create a new board
    await page.click('[data-testid="add-board-button"]');
    await page.fill('[data-testid="board-name-input"]', 'Test Board');
    await page.fill('[data-testid="board-description-input"]', 'Test Board Description');
    await page.click('[data-testid="save-board-button"]');

    // Verify board was created
    await expect(page.locator('[data-testid="board-list"]')).toContainText('Test Board');

    // Switch to the new board
    await page.click('[data-testid="board-item"]:has-text("Test Board")');

    // Verify we're on the new board
    await expect(page.locator('[data-testid="board-title"]')).toContainText('Test Board');
  });

  test('should edit board details', async ({ page }) => {
    // Create a board first
    await page.click('[data-testid="add-board-button"]');
    await page.fill('[data-testid="board-name-input"]', 'Editable Board');
    await page.click('[data-testid="save-board-button"]');

    // Edit the board
    await page.click('[data-testid="board-menu-button"]');
    await page.click('[data-testid="edit-board-button"]');
    await page.fill('[data-testid="board-name-input"]', 'Updated Board Name');
    await page.fill('[data-testid="board-description-input"]', 'Updated Description');
    await page.click('[data-testid="save-board-button"]');

    // Verify board was updated
    await expect(page.locator('[data-testid="board-title"]')).toContainText('Updated Board Name');
  });

  test('should delete boards', async ({ page }) => {
    // Create a board
    await page.click('[data-testid="add-board-button"]');
    await page.fill('[data-testid="board-name-input"]', 'Board to Delete');
    await page.click('[data-testid="save-board-button"]');

    // Delete the board
    await page.click('[data-testid="board-menu-button"]');
    await page.click('[data-testid="delete-board-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify board was deleted
    await expect(page.locator('[data-testid="board-list"]')).not.toContainText('Board to Delete');
  });

  test('should manage board columns', async ({ page }) => {
    // Add a new column
    await page.click('[data-testid="add-column-button"]');
    await page.fill('[data-testid="column-name-input"]', 'Review');
    await page.click('[data-testid="save-column-button"]');

    // Verify column was added
    await expect(page.locator('[data-testid="column-header"]')).toContainText('Review');

    // Rename the column
    await page.dblclick('[data-testid="column-header"]:has-text("Review")');
    await page.fill('[data-testid="column-name-input"]', 'Code Review');
    await page.press('[data-testid="column-name-input"]', 'Enter');

    // Verify column was renamed
    await expect(page.locator('[data-testid="column-header"]')).toContainText('Code Review');

    // Delete the column
    await page.click('[data-testid="column-menu-button"]');
    await page.click('[data-testid="delete-column-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify column was deleted
    await expect(page.locator('[data-testid="column-header"]')).not.toContainText('Code Review');
  });
});

test.describe('Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test('should export and import data', async ({ page }) => {
    // Create some test data
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Export Test Task');
    await page.click('[data-testid="save-task-button"]');

    // Export data
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-json-option"]');

    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export-button"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('.json');

    // Clear current data
    await page.click('[data-testid="clear-data-button"]');
    await page.click('[data-testid="confirm-clear-button"]');

    // Verify data is cleared
    await expect(page.locator('[data-testid="task-card"]')).not.toBeVisible();

    // Import data
    await page.click('[data-testid="import-button"]');
    await page.setInputFiles('[data-testid="import-file-input"]', 'test-data.json');
    await page.click('[data-testid="confirm-import-button"]');

    // Verify data was imported
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Export Test Task');
  });

  test('should handle import validation', async ({ page }) => {
    // Try to import invalid file
    await page.click('[data-testid="import-button"]');
    await page.setInputFiles('[data-testid="import-file-input"]', 'invalid-file.txt');
    await page.click('[data-testid="confirm-import-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error"]')).toContainText('Invalid file format');
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through the interface
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Navigate to add task button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Should open task creation dialog
    await expect(page.locator('[data-testid="task-creation-dialog"]')).toBeVisible();

    // Close dialog with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="task-creation-dialog"]')).not.toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for ARIA labels on interactive elements
    await expect(page.locator('[data-testid="add-task-button"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="kanban-board"]')).toHaveAttribute('role', 'main');
  });

  test('should announce task changes to screen readers', async ({ page }) => {
    // Create a task
    await page.click('[data-testid="add-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Accessible Task');
    await page.click('[data-testid="save-task-button"]');

    // Check for live region announcement
    await expect(page.locator('[aria-live="polite"]')).toContainText('Task created');
  });

  test('should support high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="accessibility-settings"]');
    await page.check('[data-testid="high-contrast-toggle"]');
    await page.click('[data-testid="save-settings-button"]');

    // Verify high contrast styles are applied
    const taskCard = page.locator('[data-testid="task-card"]');
    await expect(taskCard).toHaveClass(/high-contrast/);
  });
});

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test('should handle large number of tasks', async ({ page }) => {
    // Create many tasks
    for (let i = 0; i < 100; i++) {
      await page.click('[data-testid="add-task-button"]');
      await page.fill('[data-testid="task-title-input"]', `Task ${i}`);
      await page.click('[data-testid="save-task-button"]');
    }

    // Verify all tasks are visible
    await expect(page.locator('[data-testid="task-card"]')).toHaveCount(100);

    // Test search performance
    const startTime = Date.now();
    await page.fill('[data-testid="search-input"]', 'Task 50');
    await page.waitForSelector('[data-testid="task-card"]:has-text("Task 50")');
    const endTime = Date.now();

    // Search should complete within reasonable time
    expect(endTime - startTime).toBeLessThan(1000);
  });

  test('should show performance metrics', async ({ page }) => {
    // Open performance monitor
    await page.click('[data-testid="performance-monitor-button"]');

    // Verify performance metrics are displayed
    await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="operation-timing"]')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="kanban-board"]');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/**', route => route.abort());

    // Try to perform an operation that requires network
    await page.click('[data-testid="sync-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
  });

  test('should recover from errors', async ({ page }) => {
    // Simulate error
    await page.click('[data-testid="trigger-error-button"]');

    // Should show error boundary
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();

    // Try to recover
    await page.click('[data-testid="retry-button"]');

    // Should recover successfully
    await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible();
  });
});
