# Testing Guide

Comprehensive guide for testing the Cascade (kanban-todos) application.

## 📋 Table of Contents

- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Test Setup](#test-setup)
- [Testing Utilities](#testing-utilities)
- [Best Practices](#best-practices)
- [Debugging Tests](#debugging-tests)

## 🧪 Testing Strategy

### Testing Pyramid

```
    /\
   /  \
  / E2E \     Few, high-level tests (Playwright, e2e/*.spec.ts)
 /______\
/        \
/Integration\  Some, focused tests (component + store integration)
/____________\
/              \
/    Unit Tests   \  Many, fast tests (Vitest)
/__________________\
```

### Test Types

1. **Unit Tests** (Vitest, `src/**/__tests__/*.test.{ts,tsx}`)
   - Component behavior
   - Utility functions
   - Store actions

2. **Integration Tests** (also Vitest, colocated with unit tests — e.g. `*.integration.test.tsx`)
   - Component + store interactions
   - Cross-module functionality

3. **End-to-End Tests** (Playwright, `e2e/*.spec.ts`)
   - Full user workflows against a running dev server
   - Chromium only (see [Playwright Setup](#playwright-setup))

## 🔬 Unit Testing

### Testing Framework

- **Vitest**: Fast unit test runner (`vitest.config.ts`)
- **@testing-library/react**: Component testing utilities
- **jsdom**: DOM environment for tests

### Component Testing

**Basic Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Component with State** — real pattern from `src/components/__tests__/SearchBar.integration.test.tsx`, which mocks the stores it depends on directly in the test file:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { useTaskStore } from '@/lib/stores/taskStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';

vi.mock('@/lib/stores/taskStore');
vi.mock('@/lib/stores/settingsStore');

describe('SearchBar', () => {
  it('updates the search query as the user types', async () => {
    const setSearchQuery = vi.fn();
    vi.mocked(useTaskStore).mockReturnValue({
      filters: { search: '', tags: [], crossBoardSearch: false },
      setSearchQuery,
    } as unknown as ReturnType<typeof useTaskStore>);

    render(<SearchBar />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'proposal' } });

    await waitFor(() => {
      expect(setSearchQuery).toHaveBeenCalledWith('proposal');
    });
  });
});
```

### Store Testing

**Zustand Store Test** — real pattern from `src/lib/stores/__tests__/boardStore.test.ts`: mock `@/lib/utils/database`, reset store state in `beforeEach` via `useStore.setState(...)`, and call actions through `useStore.getState()`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBoardStore } from '../boardStore';

vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addBoard: vi.fn().mockResolvedValue(undefined),
    getBoards: vi.fn().mockResolvedValue([]),
    updateBoard: vi.fn().mockResolvedValue(undefined),
    deleteBoard: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({ boards: [], currentBoardId: null, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('sets current board ID', async () => {
    const { setCurrentBoard } = useBoardStore.getState();

    await setCurrentBoard('board-123');

    expect(useBoardStore.getState().currentBoardId).toBe('board-123');
  });
});
```

### Utility Function Testing

**Pure Function Test** — real functions from `src/lib/utils/security.ts` (there is no `sanitizeInput`; the real name is `sanitizeTaskData`/`sanitizeTextInput`):
```typescript
import { sanitizeTaskData } from '../security';

describe('sanitizeTaskData', () => {
  it('strips angle brackets from the title', () => {
    const result = sanitizeTaskData({ title: '<script>alert(1)</script>Hello', tags: [] });
    expect(result.title).toBe('Hello');
  });

  it('truncates titles beyond the configured limit', () => {
    const result = sanitizeTaskData({ title: 'a'.repeat(300), tags: [] });
    expect(result.title.length).toBe(200); // INPUT_LIMITS.TASK_TITLE
  });
});
```

## 🔗 Integration Testing

### Component Integration

**Component with Store** — mock the store hook per test file (there is no shared test-only store mock module):
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { useTaskStore } from '@/lib/stores/taskStore';
import { TaskDialog } from '../TaskDialog';

vi.mock('@/lib/stores/taskStore');

describe('TaskDialog', () => {
  it('calls addTask when the form is submitted', async () => {
    const addTask = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useTaskStore).mockReturnValue({ addTask } as unknown as ReturnType<typeof useTaskStore>);

    render(<TaskDialog mode="create" open onOpenChange={() => {}} boardId="board-1" />);

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(addTask).toHaveBeenCalled();
  });
});
```

### Database Integration

**IndexedDB via fake-indexeddb** — real pattern from `src/lib/utils/__tests__/database.test.ts`. The global `src/test/setup.ts` mocks `@/lib/utils/database` by default, so database-layer tests must explicitly unmock it and install `fake-indexeddb`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';

// Unmock the database module since the global setup.ts mocks it
vi.unmock('@/lib/utils/database');

import { TaskDatabase } from '../database';

describe('TaskDatabase', () => {
  let db: TaskDatabase;

  beforeEach(async () => {
    db = new TaskDatabase();
    await db.init();
  });

  afterEach(async () => {
    await db.resetDatabase();
  });

  it('adds and retrieves a task', async () => {
    const task = createTestTask({ id: 'task-1' });
    await db.addTask(task);

    const tasks = await db.getTasks();
    expect(tasks).toHaveLength(1);
  });
});
```

## 🎭 End-to-End Testing

### Playwright Setup

**Configuration** (`playwright.config.ts` — this app runs a single Chromium project, not the full cross-browser matrix):
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

Specs live directly under `e2e/*.spec.ts` (`app.spec.ts`, `task-crud.spec.ts`, `board-management.spec.ts`, `drag-drop.spec.ts`, `search-filters.spec.ts`, `keyboard-shortcuts.spec.ts`, etc.) — there is no Page Object Model layer or `fixtures/` directory. Shared helpers live in `e2e/helpers/` (currently just `keyboard.ts`, a small `pressShortcutUntilVisible` retry helper).

### E2E Test Examples

Real tests use accessible queries (`getByRole`, `getByLabel`) rather than `data-testid` attributes — the app doesn't use `data-testid` selectors. Adapted from `e2e/task-crud.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Skip the first-visit onboarding flow
    await page.addInitScript(() => {
      localStorage.setItem('cascade_has_visited', 'true');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Tasks' })).toBeVisible();
  });

  test('creates and edits a task', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByLabel('Title *').fill('Test Task');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByText('Test Task')).toBeVisible();

    // Edit the task
    await page.getByText('Test Task').click();
    await page.getByLabel('Title *').fill('Updated Task');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Updated Task')).toBeVisible();
  });
});
```

**Search and Filter** (adapted from `e2e/search-filters.spec.ts`):
```typescript
test('searches tasks by title', async ({ page }) => {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill('High Priority Task');
  await page.getByRole('button', { name: 'Create Task' }).click();

  await page.getByRole('searchbox').fill('High Priority');
  await expect(page.getByText('High Priority Task')).toBeVisible();
});
```

**Keyboard Shortcuts** (adapted from `e2e/keyboard-shortcuts.spec.ts`, using the `pressShortcutUntilVisible` helper from `e2e/helpers/keyboard.ts` to retry against timing flakiness):
```typescript
import { pressShortcutUntilVisible } from './helpers/keyboard';

test('opens quick-add with n', async ({ page }) => {
  await pressShortcutUntilVisible(page, 'n', page.getByRole('dialog'));
  await expect(page.getByRole('dialog')).toBeVisible();
});
```

This app has no automated accessibility scanning dependency (no `axe-core`/`@axe-core/playwright` in `package.json`) — accessibility is covered by keyboard-navigation and ARIA-role assertions in the specs above, plus manual review (see `e2e/SPEC.md`).

## ⚙️ Test Setup

### Test Configuration

**Vitest Config** (`vitest.config.ts` — real coverage thresholds and excludes):
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/app/layout.tsx',
      ],
      thresholds: {
        lines: 55,
        functions: 55,
        branches: 50,
        statements: 55,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**Test Setup File** (`src/test/setup.ts` — real content, trimmed to the essentials):
```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Node 22+ ships a broken built-in localStorage; replace it with a proper
// Storage-inheriting in-memory implementation so vi.spyOn(Storage.prototype, ...)
// still works in tests.
// (full implementation swaps window.localStorage — see src/test/setup.ts)

// jsdom has no PointerEvent/pointer-capture support, which Radix UI's
// DropdownMenu/Select triggers rely on — polyfilled here so those components
// open under fireEvent.click in tests.

// Mock crypto.randomUUID so store tests get deterministic IDs
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: vi.fn(() => 'test-uuid-123') },
})

// Mock next-themes (ThemeProvider/useTheme)
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), themes: ['light', 'dark', 'system'] }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock @/lib/utils/database globally — tests that need real IndexedDB
// behavior (e.g. database.test.ts) call vi.unmock('@/lib/utils/database')
// and import 'fake-indexeddb/auto' instead.
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    getTasks: vi.fn().mockResolvedValue([]),
    addBoard: vi.fn().mockResolvedValue(undefined),
    getBoards: vi.fn().mockResolvedValue([]),
  },
}))
```

## 🛠️ Testing Utilities

This app doesn't have a shared `src/test/utils.tsx` custom-render wrapper, `factories.ts`, or `mocks.ts` module — there's no client-side router or global context provider that every test needs wrapped around it (Next.js App Router routes are plain files under `src/app/`, not a `<BrowserRouter>`-style provider). Instead, each test file:

- Renders directly with `@testing-library/react`'s own `render` — no custom wrapper needed
- Mocks the specific store(s) or `@/lib/utils/database` it depends on inline, with `vi.mock(...)`
- Builds its own local `createTestTask`/`createTestBoard` helper functions when it needs realistic fixtures (see `src/lib/utils/__tests__/database.test.ts` for the pattern), rather than importing from a shared factory module

**Example local test-data helper** (inline in the test file that needs it):
```typescript
import type { Task, Board } from '@/lib/types';

function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2, 9)}`,
    title: 'Test Task',
    description: 'A test task',
    status: 'todo',
    boardId: 'board-1',
    priority: 'medium',
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createTestBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: `board-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Test Board',
    description: 'A test board',
    color: '#3b82f6',
    isDefault: false,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

Note there's no `assignee` field and no `columns` array on `Board` — see [API Reference: Type Definitions](./api-reference.md#type-definitions).

## 📋 Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** - each test should be able to run alone
5. **Reset store/mock state** in `beforeEach` (`useStore.setState(...)`, `vi.clearAllMocks()`)

### Test Naming

```typescript
// Good test names
describe('TaskDialog', () => {
  it('calls addTask when the form is submitted with a valid title', () => {});
  it('disables the submit button when the title is empty', () => {});
});

// Bad test names
describe('TaskDialog', () => {
  it('works', () => {});
  it('test 1', () => {});
});
```

### Assertions

```typescript
// Good assertions
expect(screen.getByText('Test Task')).toBeInTheDocument();
expect(addTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test Task' }));

// Weaker assertions to avoid
expect(screen.getByText('Test Task')).toBeTruthy();
expect(addTask).toHaveBeenCalled();
```

### Async Testing

```typescript
// Good async testing
it('shows the task after it loads', async () => {
  render(<TaskList boardId="board-1" />);

  await waitFor(() => {
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

## 🐛 Debugging Tests

### Debugging Tools

**Vitest Debug Mode:**
```bash
bun run test -- --reporter=verbose
```

**Playwright Debug Mode:**
```bash
bunx playwright test --debug
```

**Component Testing Debug:**
```typescript
import { screen } from '@testing-library/react';

test('debug component', () => {
  render(<MyComponent />);
  screen.debug(); // Prints the component HTML
  screen.debug(screen.getByRole('button')); // Prints specific element
});
```

### Common Issues

1. **Timing Issues**: Use `waitFor` for async operations (especially search — `setSearchQuery` debounces 300ms)
2. **Mock Issues**: Ensure mocks are reset between tests (`vi.clearAllMocks()` in `beforeEach`)
3. **State Issues**: Reset store state in `beforeEach` via `useStore.setState(...)`
4. **Radix UI dropdown/select not opening in jsdom**: covered by the `PointerEvent` polyfill in `src/test/setup.ts` — if a new Radix primitive doesn't open under `fireEvent.click`, check whether it needs a similar polyfill

---

*For more testing examples and patterns, see the [Developer Guide](./developer-guide.md#testing-strategy).*
