# Developer Guide

Complete guide for developers working on the Cascade (kanban-todos) application.

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Code Organization](#code-organization)
- [State Management](#state-management)
- [Component Guidelines](#component-guidelines)
- [Testing Strategy](#testing-strategy)
- [Security Guidelines](#security-guidelines)
- [Deployment Process](#deployment-process)
- [Contributing](#contributing)

## 🏗️ Project Structure

```
kanban-todos/
├── docs/                    # Documentation
├── e2e/                     # Playwright end-to-end tests
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── error.tsx        # App Router error boundary
│   ├── components/          # React components
│   │   ├── accessibility/   # Accessibility components
│   │   ├── ui/               # shadcn/ui base components
│   │   └── *.tsx             # Feature components
│   ├── lib/                 # Utilities and configurations
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── test/                # Vitest setup
├── .github/                 # GitHub workflows
├── .vscode/                 # VS Code settings
├── playwright.config.ts     # Playwright config
├── vitest.config.ts         # Vitest config
├── next.config.ts           # Next.js config
├── package.json             # Dependencies
└── README.md                # Project overview
```

## 🚀 Development Setup

### Prerequisites

- [Bun](https://bun.sh) (package manager and script runner — this project is bun-only; `package.json` pins `packageManager: bun@1.3.5`)
- Git
- VS Code (recommended)

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-username/kanban-todos.git
   cd kanban-todos
   bun install
   ```

2. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Edit environment variables
   nano .env.local
   ```

3. **Start Development Server**
   ```bash
   bun run dev
   ```

4. **Run Tests**
   ```bash
   # Unit/component tests (Vitest)
   bun run test

   # Unit tests with coverage
   bun run test:coverage

   # Unit tests in watch mode
   bun run test:watch

   # E2E tests (Playwright)
   bun run test:e2e
   ```

### VS Code Setup

1. **Install Extensions**
   - ES7+ React/Redux/React-Native snippets
   - TypeScript Importer
   - Tailwind CSS IntelliSense
   - Prettier - Code formatter
   - ESLint

2. **Configure Settings**
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "typescript.preferences.importModuleSpecifier": "relative"
   }
   ```

## 🏛️ Architecture Overview

### Technology Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Language**: TypeScript (strict)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4, shadcn/ui
- **State Management**: Zustand
- **Data Storage**: IndexedDB (custom `TaskDatabase` wrapper in `src/lib/utils/database.ts`)
- **Testing**: Vitest + Testing Library + Playwright
- **Deployment**: Static export to S3/CloudFront (`todos.vinny.dev` and `cascade.vinny.dev`)

### Core Principles

1. **Component-First**: Build reusable, composable components
2. **Type Safety**: Leverage TypeScript for better code quality
3. **Performance**: Optimize for speed and efficiency (lazy-loaded drag-and-drop, `React.memo`, dynamic imports)
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Security**: Input sanitization and XSS defense (see [Security Guidelines](#security-guidelines))
6. **Testing**: Maintain meaningful test coverage (see `vitest.config.ts` thresholds)
7. **Code Quality**:
   - Functions under 30 lines for readability
   - Single Responsibility Principle
   - YAGNI (You Aren't Gonna Need It)
   - DRY (Don't Repeat Yourself)
   - Modular architecture with focused modules

### Data Flow

```
User Interaction → Component → Store → IndexedDB → UI Update
     ↓
  Store-level error handling (try/catch → set({ error }))
```

## 📁 Code Organization

### Component Structure

```typescript
// Component file structure
export interface ComponentProps {
  // Props interface
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Store Structure

```typescript
// Store file structure
interface StoreState {
  // State interface
}

interface StoreActions {
  // Actions interface
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  // State
  // Actions
}));
```

### Utility Structure

```typescript
// Utility file structure
export interface UtilityConfig {
  // Configuration interface
}

export function utilityFunction(): ReturnType {
  // Function implementation
}
```

## 🗃️ State Management

### Zustand Stores

The application uses three Zustand stores, each persisted to IndexedDB through `src/lib/utils/database.ts`:

**Task Store** (split across 4 files in `src/lib/stores/` for maintainability)
- **Main Store** (`taskStore.ts`) — composition layer: owns the `TaskState`/`TaskActions` interfaces, initial state, and wires the action creators from the other three files into one `create()` call
- **CRUD Actions** (`taskStore.crudActions.ts`) — `addTask`, `updateTask`, `deleteTask`, `moveTask`, `moveTaskToBoard`, `archiveTask`, `unarchiveTask`
- **Filters** (`taskStore.filters.ts`) — search/filter state, debounced search query handling, the search-result cache (`SearchCache`), and cross-board search navigation
- **Import/Export** (`taskStore.import.ts`) — `exportTasks`, `importTasks`, `bulkAddTasks`

**Board Store** (`src/lib/stores/boardStore.ts`, with import/export actions extracted to `boardStore.importActions.ts`)
- Board CRUD, reordering, and selection (`currentBoardId`)
- Ensures a default board always exists on init
- Deleting a board removes its tasks from `useTaskStore` too (see [API Reference](./api-reference.md#board-store))

**Settings Store** (`src/lib/stores/settingsStore.ts`)
- Theme, auto-archive, keyboard shortcuts, accessibility, and search preferences
- Persists to the `settings` IndexedDB object store under a single `'default'` record

See the [API Reference](./api-reference.md#store-apis) for the exact `State`/`Actions` interfaces of each store.

### Store Patterns

**Action Creator Pattern** — each store's mutating actions are built by factory functions that close over `get`/`set`, then composed in the main store file. This is the real pattern from `taskStore.crudActions.ts`:

```typescript
// taskStore.crudActions.ts
export function createAddTask(_get: GetState, set: StoreSetter) {
  return async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ isLoading: true, error: null });

      const sanitizedData = sanitizeTaskData({
        title: taskData.title,
        description: taskData.description,
        tags: taskData.tags,
      });

      const newTask: Task = {
        ...taskData,
        ...sanitizedData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await taskDB.addTask(newTask);

      // Functional updater avoids stale state after the await above
      set((state) => ({
        tasks: [...state.tasks, newTask],
        filteredTasks: applyFiltersToTasks([...state.tasks, newTask], state.filters),
        isLoading: false,
        searchCache: new Map(),
      }));
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add task',
        isLoading: false,
      });
      throw error;
    }
  };
}

// taskStore.ts
export const useTaskStore = create<TaskState & TaskActions>()(
  devtools((set, get) => ({
    ...initialState,
    addTask: createAddTask(get, set),
    updateTask: createUpdateTask(get, set),
    // ...composed from taskStore.crudActions.ts / .filters.ts / .import.ts
  }))
);
```

**Selector Pattern:**
```typescript
// Select specific state
const tasks = useTaskStore(state => state.tasks);

// Select with transformation
const taskCount = useTaskStore(state => state.tasks.length);

// Derived state
const activeTasks = useTaskStore(state =>
  state.tasks.filter(task => !task.archivedAt)
);
```

## 🧩 Component Guidelines

### Component Design

**Functional Components** (following the real `src/components/ui/button.tsx` pattern):
```typescript
interface ButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'default',
  size = 'default',
  children,
  onClick
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors',
        variants[variant],
        sizes[size]
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**Custom Hooks:**
```typescript
export function useTaskOperations(boardId: string) {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();

  const createTask = useCallback((title: string) => {
    if (!title.trim()) {
      throw new Error('Title is required');
    }

    addTask({
      title,
      status: 'todo',
      priority: 'medium',
      tags: [],
      boardId,
    });
  }, [addTask, boardId]);

  return { tasks, createTask, updateTask, deleteTask };
}
```

### Styling Guidelines

**Tailwind CSS Classes:**
```typescript
// Use the cn() utility (src/lib/utils.ts) for conditional classes
const buttonClass = cn(
  'px-4 py-2 rounded transition-colors',
  {
    'bg-primary text-primary-foreground': variant === 'primary',
    'bg-secondary text-secondary-foreground': variant === 'secondary',
  },
  disabled && 'opacity-50 cursor-not-allowed'
);
```

**CSS Custom Properties (Tailwind v4 theme):**
```css
:root {
  --color-primary: theme('colors.blue.500');
  --color-secondary: theme('colors.gray.200');
  --spacing-sm: theme('spacing.2');
  --spacing-md: theme('spacing.4');
}
```

## 🧪 Testing Strategy

See the [Testing Guide](./testing-guide.md) for full detail — this section is a summary.

**Unit/component tests** run with Vitest + Testing Library against `jsdom`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Store tests** mock `@/lib/utils/database` per-file (the global `src/test/setup.ts` also mocks it by default) and call store actions directly via `useTaskStore.getState()`:
```typescript
import { useTaskStore } from '@/lib/stores/taskStore';

describe('taskStore', () => {
  it('adds a task', async () => {
    const { addTask } = useTaskStore.getState();

    await addTask({
      title: 'Test Task',
      status: 'todo',
      priority: 'medium',
      tags: [],
      boardId: 'board-1',
    });

    expect(useTaskStore.getState().tasks).toHaveLength(1);
  });
});
```

**E2E tests** run with Playwright against `e2e/*.spec.ts`, using accessible queries (`getByRole`, `getByLabel`) rather than `data-testid` selectors:
```typescript
import { test, expect } from '@playwright/test';

test('creates a task', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.getByLabel('Title *').fill('Test Task');
  await page.getByRole('button', { name: 'Create Task' }).click();

  await expect(page.getByText('Test Task')).toBeVisible();
});
```

Run everything with `bun run test`, `bun run test:coverage`, or `bun run test:e2e` — see [Development Setup](#development-setup).

## 🔒 Security Guidelines

### Input Sanitization

This app does not use DOMPurify or a schema library like zod. Two layers do the work instead:

1. **React's automatic escaping** — the real XSS defense. Any value rendered as JSX text or an attribute is escaped by React; `dangerouslySetInnerHTML` is forbidden by the `react/no-danger` ESLint rule.
2. **`src/lib/utils/security.ts`** — a defence-in-depth layer that strips raw `<`/`>` characters and enforces per-field length limits before user text (task titles/descriptions/tags, board names/descriptions, search queries) is written to IndexedDB:

```typescript
import { sanitizeTaskData } from '@/lib/utils/security';

export function createAddTask(/* ... */) {
  return async (taskData) => {
    const sanitized = sanitizeTaskData({
      title: taskData.title,
      description: taskData.description,
      tags: taskData.tags,
    });
    // ...persist `sanitized` fields, not the raw input
  };
}
```

Import/export payloads are validated with a hand-written schema validator instead — see `src/lib/utils/validation.ts` and `validationSchemas.ts`, and [API Reference: Data Validation](./api-reference.md#data-validation).

### Rate Limiting

```typescript
import { searchRateLimiter } from '@/lib/utils/security';

if (searchRateLimiter.isAllowed('search')) {
  // Perform search
} else {
  // Rate limited
}
```

`searchRateLimiter` is a pre-configured instance (10 requests / 1-second window); the `RateLimiter` class backing it is not exported. See [API Reference: Security APIs](./api-reference.md#security-apis) for the full sanitization/rate-limiting surface.

## 🚀 Deployment Process

### Build Process

**Production Build:**
```bash
# Install dependencies
bun install

# Run tests
bun run test

# Build application (static export to ./out)
bun run build

# Verify build locally
bun run start
```

`bun run build` cleans `.next`/`out`, then runs `next build` with `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_BUILD_TIME`, `NEXT_PUBLIC_BUILD_HASH`, and `NEXT_PUBLIC_BUILD_TIMESTAMP` populated from `package.json` and `git rev-parse`.

### Deployment Steps

This project ships prebuilt scripts rather than raw AWS CLI calls — use these instead of hand-rolling `aws s3 sync`:

```bash
# Single-environment deploy (todos.vinny.dev)
bun run deploy

# Interactive multi-environment deploy
bun run deploy:multi

# Deploy to a specific environment
bun run deploy:cascade   # cascade.vinny.dev
bun run deploy:all       # every configured environment

# Verify a deployment
bun run deploy:check           # todos.vinny.dev
bun run deploy:check:cascade   # cascade.vinny.dev
```

Under the hood, `deploy:s3` syncs `./out` to S3 (long-cache for static assets, no-cache for HTML) and `deploy:invalidate`/`invalidate` issue a CloudFront invalidation — see `scripts/deploy.sh` and `scripts/deploy-multi.sh`.

### CI/CD Pipeline

**GitHub Actions** (bun-based, not npm):
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run test
      - run: bun run build
      - run: bun run deploy
```

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Write code following guidelines
   - Add tests for new features
   - Update documentation

3. **Test Changes**
   ```bash
   bun run test
   bun run test:e2e
   bun run lint
   ```

4. **Submit Pull Request**
   - Describe changes clearly
   - Link to related issues
   - Request code review

### Code Review Process

**Review Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Accessibility requirements met

**Review Guidelines:**
- Be constructive and helpful
- Focus on code quality, not personal preferences
- Ask questions if something is unclear
- Suggest improvements, don't just point out problems

### Commit Guidelines

**Commit Message Format:**
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(task): add drag and drop functionality

fix(board): resolve board deletion race condition

docs(api): update store action signatures

test(task): add unit tests for task operations
```

---

*For more detailed information, see the [API Reference](./api-reference.md) and [Testing Guide](./testing-guide.md).*
