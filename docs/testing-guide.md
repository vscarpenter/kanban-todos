# Testing Guide

Comprehensive guide for testing the Kanban Todos application.

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
  / E2E \     Few, high-level tests
 /______\
/        \
/Integration\  Some, focused tests
/____________\
/              \
/    Unit Tests   \  Many, fast tests
/__________________\
```

### Test Types

1. **Unit Tests** (70%)
   - Component behavior
   - Utility functions
   - Store actions
   - Business logic

2. **Integration Tests** (20%)
   - Component interactions
   - API integrations
   - Store integrations
   - Cross-module functionality

3. **End-to-End Tests** (10%)
   - User workflows
   - Critical paths
   - Cross-browser compatibility
   - Performance scenarios

## 🔬 Unit Testing

### Testing Framework

- **Vitest**: Fast unit test runner
- **Testing Library**: Component testing utilities
- **jsdom**: DOM environment for tests

### Component Testing

**Basic Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

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
  
  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-500');
  });
});
```

**Component with State:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  it('submits form with correct data', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Task' }
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium'
      });
    });
  });
});
```

### Store Testing

**Zustand Store Test:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from './taskStore';

describe('TaskStore', () => {
  beforeEach(() => {
    // Reset store state
    useTaskStore.getState().clearTasks();
  });
  
  it('adds task correctly', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask({
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium'
      });
    });
    
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Test Task');
  });
  
  it('updates task correctly', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Add task first
    act(() => {
      result.current.addTask({
        title: 'Test Task',
        status: 'todo',
        priority: 'medium'
      });
    });
    
    const taskId = result.current.tasks[0].id;
    
    // Update task
    act(() => {
      result.current.updateTask(taskId, { status: 'in-progress' });
    });
    
    expect(result.current.tasks[0].status).toBe('in-progress');
  });
});
```

### Utility Function Testing

**Pure Function Test:**
```typescript
import { sanitizeInput, validateTaskData } from './utils';

describe('sanitizeInput', () => {
  it('removes HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello');
  });
  
  it('preserves allowed tags', () => {
    const input = '<b>Bold</b> and <i>italic</i>';
    const result = sanitizeInput(input);
    expect(result).toBe('<b>Bold</b> and <i>italic</i>');
  });
});

describe('validateTaskData', () => {
  it('validates correct task data', () => {
    const validData = {
      title: 'Test Task',
      status: 'todo',
      priority: 'medium'
    };
    
    expect(() => validateTaskData(validData)).not.toThrow();
  });
  
  it('throws error for invalid data', () => {
    const invalidData = {
      title: '', // Empty title
      status: 'invalid-status',
      priority: 'invalid-priority'
    };
    
    expect(() => validateTaskData(invalidData)).toThrow();
  });
});
```

## 🔗 Integration Testing

### Component Integration

**Component with Store:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskList } from './TaskList';
import { useTaskStore } from './taskStore';

// Mock the store
vi.mock('./taskStore', () => ({
  useTaskStore: vi.fn()
}));

describe('TaskList Integration', () => {
  const mockTasks = [
    { id: '1', title: 'Task 1', status: 'todo', priority: 'medium' },
    { id: '2', title: 'Task 2', status: 'in-progress', priority: 'high' }
  ];
  
  beforeEach(() => {
    (useTaskStore as any).mockReturnValue({
      tasks: mockTasks,
      updateTask: vi.fn(),
      deleteTask: vi.fn()
    });
  });
  
  it('renders tasks from store', () => {
    render(<TaskList />);
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });
  
  it('calls store actions when task is updated', async () => {
    const mockUpdateTask = vi.fn();
    (useTaskStore as any).mockReturnValue({
      tasks: mockTasks,
      updateTask: mockUpdateTask,
      deleteTask: vi.fn()
    });
    
    render(<TaskList />);
    
    // Click on task to edit
    fireEvent.click(screen.getByText('Task 1'));
    
    // Update task
    fireEvent.change(screen.getByDisplayValue('Task 1'), {
      target: { value: 'Updated Task 1' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    
    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('1', {
        title: 'Updated Task 1'
      });
    });
  });
});
```

### API Integration

**API Mocking:**
```typescript
import { vi } from 'vitest';
import { api } from './api';

// Mock API
vi.mock('./api', () => ({
  api: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn()
  }
}));

describe('API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('fetches tasks on component mount', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'todo' }
    ];
    
    (api.getTasks as any).mockResolvedValue(mockTasks);
    
    const { result } = renderHook(() => useTaskStore());
    
    await act(async () => {
      await result.current.fetchTasks();
    });
    
    expect(api.getTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks).toEqual(mockTasks);
  });
});
```

## 🎭 End-to-End Testing

### Playwright Setup

**Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

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
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

**Basic User Flow:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test('creates and manages tasks', async ({ page }) => {
    await page.goto('/');
    
    // Create a new task
    await page.click('[data-testid="add-task"]');
    await page.fill('[data-testid="task-title"]', 'Test Task');
    await page.fill('[data-testid="task-description"]', 'Test Description');
    await page.selectOption('[data-testid="task-priority"]', 'high');
    await page.click('[data-testid="save-task"]');
    
    // Verify task was created
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Test Task');
    
    // Edit task
    await page.click('[data-testid="task-card"]');
    await page.fill('[data-testid="task-title"]', 'Updated Task');
    await page.click('[data-testid="save-task"]');
    
    // Verify task was updated
    await expect(page.locator('[data-testid="task-card"]')).toContainText('Updated Task');
    
    // Move task
    await page.dragAndDrop(
      '[data-testid="task-card"]',
      '[data-testid="in-progress-column"]'
    );
    
    // Verify task was moved
    await expect(page.locator('[data-testid="in-progress-column"] [data-testid="task-card"]'))
      .toContainText('Updated Task');
    
    // Delete task
    await page.click('[data-testid="task-menu"]');
    await page.click('[data-testid="delete-task"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify task was deleted
    await expect(page.locator('[data-testid="task-card"]')).not.toBeVisible();
  });
});
```

**Search and Filter:**
```typescript
test('searches and filters tasks', async ({ page }) => {
  await page.goto('/');
  
  // Create multiple tasks
  await createTask(page, 'High Priority Task', 'high');
  await createTask(page, 'Low Priority Task', 'low');
  await createTask(page, 'Medium Priority Task', 'medium');
  
  // Search for specific task
  await page.fill('[data-testid="search-input"]', 'High Priority');
  await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="task-card"]')).toContainText('High Priority Task');
  
  // Clear search
  await page.fill('[data-testid="search-input"]', '');
  
  // Filter by priority
  await page.click('[data-testid="filter-button"]');
  await page.check('[data-testid="filter-high"]');
  await page.click('[data-testid="apply-filter"]');
  
  await expect(page.locator('[data-testid="task-card"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="task-card"]')).toContainText('High Priority Task');
});
```

**Accessibility Testing:**
```typescript
test('is accessible', async ({ page }) => {
  await page.goto('/');
  
  // Check for accessibility issues
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  
  // Test screen reader announcements
  await page.click('[data-testid="add-task"]');
  await expect(page.locator('[role="dialog"]')).toBeVisible();
});
```

## ⚙️ Test Setup

### Test Configuration

**Vitest Config:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Test Setup File:**
```typescript
// src/test/setup.ts
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB,
});
```

## 🛠️ Testing Utilities

### Custom Render Function

```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Test Data Factories

```typescript
// src/test/factories.ts
import { Task, Board } from '@/lib/types';

export const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'todo',
  priority: 'medium',
  dueDate: undefined,
  assignee: undefined,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  boardId: 'board-1',
  ...overrides,
});

export const createBoard = (overrides: Partial<Board> = {}): Board => ({
  id: 'board-1',
  name: 'Test Board',
  description: 'Test Description',
  columns: [
    { id: 'col-1', name: 'To Do', order: 0 },
    { id: 'col-2', name: 'In Progress', order: 1 },
    { id: 'col-3', name: 'Done', order: 2 },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

### Mock Functions

```typescript
// src/test/mocks.ts
import { vi } from 'vitest';

export const mockTaskStore = {
  tasks: [],
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  setSearchQuery: vi.fn(),
  clearError: vi.fn(),
};

export const mockApi = {
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
};
```

## 📋 Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** - each test should be able to run alone
5. **Clean up after tests** using `beforeEach` and `afterEach`

### Test Naming

```typescript
// Good test names
describe('TaskForm', () => {
  it('should create task when form is submitted with valid data', () => {});
  it('should show error message when title is empty', () => {});
  it('should disable submit button when form is invalid', () => {});
});

// Bad test names
describe('TaskForm', () => {
  it('works', () => {});
  it('test 1', () => {});
  it('should do stuff', () => {});
});
```

### Assertions

```typescript
// Good assertions
expect(screen.getByText('Task created')).toBeInTheDocument();
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
expect(component).toHaveClass('active');

// Bad assertions
expect(screen.getByText('Task created')).toBeTruthy();
expect(mockFunction).toHaveBeenCalled();
expect(component.className).toContain('active');
```

### Async Testing

```typescript
// Good async testing
it('loads data on mount', async () => {
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});

// Bad async testing
it('loads data on mount', () => {
  render(<DataComponent />);
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

## 🐛 Debugging Tests

### Debugging Tools

**Vitest Debug Mode:**
```bash
npm run test -- --reporter=verbose
```

**Playwright Debug Mode:**
```bash
npx playwright test --debug
```

**Component Testing Debug:**
```typescript
import { screen, debug } from '@testing-library/react';

test('debug component', () => {
  render(<MyComponent />);
  debug(); // Prints the component HTML
  debug(screen.getByRole('button')); // Prints specific element
});
```

### Common Issues

1. **Timing Issues**: Use `waitFor` for async operations
2. **Mock Issues**: Ensure mocks are properly reset between tests
3. **State Issues**: Reset store state in `beforeEach`
4. **DOM Issues**: Use proper queries and wait for elements

---

*For more testing examples and patterns, see the [Developer Guide](./developer-guide.md#testing-strategy).*
