# E2E Test Specification for Kanban Todos App

## Goal
Implement comprehensive end-to-end tests using Playwright to cover all major user flows and features of the Kanban Todos application, ensuring high confidence in releases and preventing regressions.

## Current Coverage Analysis
**Existing Tests (3 files):**
- `app.spec.ts` - Basic app loading and kanban board structure
- `crossBoardSearch.spec.ts` - Cross-board search with scope toggle
- `task-management.spec.ts` - Task creation, basic navigation, search input, accessibility

**Coverage Gaps:**
- Board management (CRUD operations, color coding)
- Task editing, deletion, and drag-drop between columns
- Archive system (manual/auto-archive, restore)
- Settings management (theme, auto-archive, accessibility settings)
- Import/Export functionality
- Keyboard shortcuts
- Mobile/responsive behavior
- Error handling and validation
- PWA features (service worker updates, notifications)

## Test Organization Structure

### 1. Board Management Tests (`board-management.spec.ts`)
**Scope:** Board CRUD operations, color coding, board switching

**Test Cases:**
- Create new board with valid name
- Create board with color selection
- Edit board name
- Edit board color
- Delete empty board
- Delete board with tasks (confirmation dialog)
- Switch between multiple boards
- Board switching via keyboard shortcuts (Ctrl/Cmd + 1-9)
- Board color coding visibility in UI
- Board validation (empty names, duplicate names)

**Helper Functions:**
- `createBoard(name, color)`
- `editBoard(name, newName, newColor)`
- `deleteBoard(name)`
- `switchToBoard(name)`
- `getBoardColor(name)`

### 2. Task CRUD and Drag-Drop Tests (`task-crud.spec.ts`)
**Scope:** Task creation, editing, deletion, moving between columns

**Test Cases:**
- Create task with title only
- Create task with title and description
- Create task with due date
- Create task with priority
- Edit task title
- Edit task description
- Edit task due date
- Edit task priority
- Delete task with confirmation
- Move task between columns via drag-and-drop
- Move task to different position within column
- Task persistence after page reload
- Task validation (empty title, invalid dates)

**Helper Functions:**
- `createTask(title, description, dueDate, priority)`
- `editTask(taskTitle, updates)`
- `deleteTask(taskTitle)`
- `dragTaskToColumn(taskTitle, columnName)`
- `reorderTask(taskTitle, newPosition)`
- `getTaskCount(columnName)`

### 3. Archive System Tests (`archive-system.spec.ts`)
**Scope:** Manual archiving, auto-archive, restore from archive

**Test Cases:**
- Manually archive completed task
- Manually archive uncompleted task
- Restore task from archive
- View archived tasks list
- Auto-archive completed tasks (when enabled in settings)
- Auto-archive disabled tasks remain on board
- Archive persistence after page reload
- Archive filter/search functionality

**Helper Functions:**
- `archiveTask(taskTitle)`
- `restoreTask(taskTitle)`
- `openArchive()`
- `getArchivedTaskCount()`
- `enableAutoArchive()`
- `disableAutoArchive()`

### 4. Settings Management Tests (`settings-management.spec.ts`)
**Scope:** Theme switching, auto-archive configuration, accessibility settings

**Test Cases:**
- Switch between light and dark theme
- Theme persistence after page reload
- Enable auto-archive with custom days
- Disable auto-archive
- Toggle accessibility mode
- Toggle debug mode
- Reset all settings to defaults
- Settings validation (invalid auto-archive days)

**Helper Functions:**
- `openSettings()`
- `setTheme(theme)`
- `getTheme()`
- `setAutoArchiveDays(days)`
- `toggleAccessibilityMode()`
- `toggleDebugMode()`
- `resetSettings()`

### 5. Import/Export Tests (`import-export.spec.ts`)
**Scope:** Data export, import, validation

**Test Cases:**
- Export board data to JSON
- Export multiple boards
- Import valid board data
- Import data overwrites existing data (confirmation)
- Import invalid JSON (error handling)
- Import data with missing required fields
- Import data with invalid task IDs
- Cancel import operation
- Import preserves board colors and settings

**Helper Functions:**
- `exportData()`
- `importData(jsonData)`
- `getExportedData()`
- `validateImportData(data)`

### 6. Keyboard Shortcuts Tests (`keyboard-shortcuts.spec.ts`)
**Scope:** All keyboard shortcuts and accessibility

**Test Cases:**
- Press 'N' opens new task dialog
- Press 'Ctrl/Cmd + K' opens new task dialog
- Press 'Ctrl/Cmd + 1-9' switches to respective board
- Press 'H' opens keyboard shortcuts help
- Press 'F1' opens user guide
- Press 'Ctrl/Cmd + ,' opens settings
- Press 'Escape' closes dialogs
- Keyboard navigation within task cards
- Keyboard navigation within columns

**Helper Functions:**
- `pressKey(key)`
- `pressShortcut(keys)`
- `verifyDialogOpen(dialogName)`
- `verifyBoardSwitched(boardName)`

### 7. Mobile/Responsive Tests (`mobile-responsive.spec.ts`)
**Scope:** Mobile layout, touch interactions, responsive behavior

**Test Cases:**
- Board layout on mobile viewport
- Task cards responsive sizing
- Sidebar hamburger menu on mobile
- Touch interactions for drag-and-drop
- Mobile keyboard support
- Orientation changes (portrait/landscape)
- Mobile-specific UI elements
- Touch target sizes meet accessibility standards

**Helper Functions:**
- `setViewport(width, height)`
- `setMobileViewport()`
- `setTabletViewport()`
- `touchDrag(element, target)`
- `openMobileMenu()`

### 8. Error Handling and Validation Tests (`error-handling.spec.ts`)
**Scope:** Input validation, error messages, recovery scenarios

**Test Cases:**
- Create task with empty title (validation error)
- Create board with empty name (validation error)
- Edit task with invalid due date (validation error)
- Import malformed JSON (error message)
- Network error handling (if applicable)
- IndexedDB error handling
- Error boundary scenarios
- Recovery from error states

**Helper Functions:**
- `expectErrorMessage(message)`
- `simulateNetworkError()`
- `simulateDatabaseError()`
- `clearErrors()`

### 9. PWA Features Tests (`pwa-features.spec.ts`)
**Scope:** Service worker, update notifications, offline behavior

**Test Cases:**
- Service worker registration
- Update notification display
- Update application to new version
- Cache invalidation on update
- Version indicator display
- PWA install prompt (if applicable)
- Offline functionality (if supported)

**Helper Functions:**
- `waitForServiceWorker()`
- `triggerUpdate()`
- `checkVersion()`
- `simulateOffline()`

## Test Utilities and Helpers

### Common Setup
- Browser cleanup between tests
- LocalStorage reset
- IndexedDB cleanup
- Default board creation for tests that need it

### Page Objects
- `KanbanBoard` - Main board interactions
- `TaskCard` - Individual task operations
- `BoardManager` - Board CRUD operations
- `SettingsPanel` - Settings interactions
- `ArchivePanel` - Archive operations
- `ImportExportDialog` - Import/export operations

### Test Data Fixtures
- Sample board names
- Sample task data (valid/invalid)
- Sample import/export JSON
- Color palette for boards

## Constraints
- Tests must run in CI/CD pipeline
- Test execution time should be < 5 minutes
- Tests should be deterministic (no flaky tests)
- Tests must work across different viewports
- Tests should not depend on external services
- Must handle the first-visit redirect via localStorage

## Edge Cases
- Empty board state
- Single task on board
- Maximum number of boards (if limit exists)
- Very long task titles/descriptions
- Special characters in task names
- Unicode characters in board names
- Rapid successive operations
- Browser refresh during operations
- Multiple users (if applicable)

## Out of Scope
- Performance/load testing (use separate tools)
- Visual regression testing (use separate tools)
- Cross-browser testing beyond Chromium (unless specifically requested)
- Accessibility automated testing (use separate tools like axe)
- Security penetration testing

## Acceptance Criteria
- All major user flows have test coverage
- Tests are reliable and pass consistently
- Test execution time is acceptable
- Tests follow existing patterns and conventions
- Helper functions are reusable across test files
- Test failures provide clear, actionable error messages
- Tests can be run locally and in CI
- Code coverage report shows significant improvement

## Test Stubs (Skeleton)

```typescript
// board-management.spec.ts
test.describe('Board Management', () => {
  test('creates new board with valid name', async ({ page }) => {})
  test('creates board with color selection', async ({ page }) => {})
  // ... additional tests
})

// task-crud.spec.ts
test.describe('Task CRUD and Drag-Drop', () => {
  test('creates task with title only', async ({ page }) => {})
  test('creates task with full details', async ({ page }) => {})
  test('moves task between columns via drag-drop', async ({ page }) => {})
  // ... additional tests
})

// archive-system.spec.ts
test.describe('Archive System', () => {
  test('manually archives completed task', async ({ page }) => {})
  test('restores task from archive', async ({ page }) => {})
  // ... additional tests
})

// settings-management.spec.ts
test.describe('Settings Management', () => {
  test('switches between light and dark theme', async ({ page }) => {})
  test('enables auto-archive with custom days', async ({ page }) => {})
  // ... additional tests
})

// import-export.spec.ts
test.describe('Import/Export', () => {
  test('exports board data to JSON', async ({ page }) => {})
  test('imports valid board data', async ({ page }) => {})
  // ... additional tests
})

// keyboard-shortcuts.spec.ts
test.describe('Keyboard Shortcuts', () => {
  test('press N opens new task dialog', async ({ page }) => {})
  test('press Ctrl+1 switches to first board', async ({ page }) => {})
  // ... additional tests
})

// mobile-responsive.spec.ts
test.describe('Mobile and Responsive', () => {
  test('board layout adapts to mobile viewport', async ({ page }) => {})
  test('sidebar hamburger menu works on mobile', async ({ page }) => {})
  // ... additional tests
})

// error-handling.spec.ts
test.describe('Error Handling and Validation', () => {
  test('shows validation error for empty task title', async ({ page }) => {})
  test('handles invalid JSON import gracefully', async ({ page }) => {})
  // ... additional tests
})

// pwa-features.spec.ts
test.describe('PWA Features', () => {
  test('service worker registers successfully', async ({ page }) => {})
  test('update notification displays correctly', async ({ page }) => {})
  // ... additional tests
})
```

## Implementation Order
1. Board Management (foundation for other tests)
2. Task CRUD and Drag-Drop (core functionality)
3. Archive System (depends on tasks)
4. Settings Management (independent)
5. Import/Export (depends on boards/tasks)
6. Keyboard Shortcuts (depends on UI elements)
7. Mobile/Responsive (depends on layout)
8. Error Handling (depends on all features)
9. PWA Features (independent)

## Success Metrics
- Test coverage increases from ~20% to >80% of user flows
- All tests pass consistently in CI
- Test execution time < 5 minutes
- Zero flaky tests
- Clear test organization and documentation