# Developer Guide

Complete guide for developers working on the Kanban Todos application.

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Code Organization](#code-organization)
- [State Management](#state-management)
- [Component Guidelines](#component-guidelines)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)
- [Security Guidelines](#security-guidelines)
- [Deployment Process](#deployment-process)
- [Contributing](#contributing)

## 🏗️ Project Structure

```
kanban-todos/
├── docs/                    # Documentation
├── e2e/                     # End-to-end tests
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── accessibility/   # Accessibility components
│   │   ├── ui/             # UI components
│   │   └── *.tsx           # Feature components
│   ├── lib/                # Utilities and configurations
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── test/               # Test setup
├── .github/                # GitHub workflows
├── .vscode/                # VS Code settings
├── playwright.config.ts    # Playwright config
├── vitest.config.ts        # Vitest config
├── next.config.ts          # Next.js config
├── package.json            # Dependencies
└── README.md               # Project overview
```

## 🚀 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- VS Code (recommended)

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-username/kanban-todos.git
   cd kanban-todos
   npm install
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
   npm run dev
   ```

4. **Run Tests**
   ```bash
   # Unit tests
   npm test
   
   # E2E tests
   npm run test:e2e
   
   # All tests
   npm run test:all
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

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Storage**: IndexedDB
- **Testing**: Vitest + Testing Library + Playwright
- **Deployment**: Static export to S3/CloudFront

### Core Principles

1. **Component-First**: Build reusable, composable components
2. **Type Safety**: Leverage TypeScript for better code quality
3. **Performance**: Optimize for speed and efficiency
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Security**: Implement defense-in-depth security
6. **Testing**: Maintain high test coverage

### Data Flow

```
User Interaction → Component → Store → Database → UI Update
     ↓
  Error Handling → State Validation → Performance Optimization
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

// Default export for easier imports
export default Component;
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

export class UtilityClass {
  // Class implementation
}

export function utilityFunction(): ReturnType {
  // Function implementation
}
```

## 🗃️ State Management

### Zustand Stores

**Task Store** (`src/lib/stores/taskStore.ts`)
- Manages task CRUD operations
- Handles task filtering and searching
- Implements performance optimizations (caching, debouncing)
- Includes error handling

**Board Store** (`src/lib/stores/boardStore.ts`)
- Manages board operations
- Handles board switching
- Implements data validation

**Settings Store** (`src/lib/stores/settingsStore.ts`)
- Manages user preferences
- Handles theme and language settings
- Implements data persistence

### Store Patterns

**Action Pattern:**
```typescript
const useStore = create((set, get) => ({
  // State
  items: [],
  
  // Actions
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  
  // Async actions
  fetchItems: async () => {
    const items = await api.getItems();
    set({ items });
  }
}));
```

**Selector Pattern:**
```typescript
// Select specific state
const items = useStore(state => state.items);

// Select with transformation
const itemCount = useStore(state => state.items.length);
```

## 🧩 Component Guidelines

### Component Design

**Functional Components:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
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
export function useTaskOperations() {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  
  const createTask = useCallback((taskData: TaskData) => {
    // Validation
    if (!taskData.title) {
      throw new Error('Title is required');
    }
    
    // Create task
    addTask(taskData);
  }, [addTask]);
  
  return { tasks, createTask, updateTask, deleteTask };
}
```

### Styling Guidelines

**Tailwind CSS Classes:**
```typescript
// Use cn utility for conditional classes
const buttonClass = cn(
  'px-4 py-2 rounded transition-colors',
  {
    'bg-blue-500 text-white': variant === 'primary',
    'bg-gray-200 text-gray-800': variant === 'secondary',
  },
  disabled && 'opacity-50 cursor-not-allowed'
);
```

**CSS Custom Properties:**
```css
:root {
  --color-primary: theme('colors.blue.500');
  --color-secondary: theme('colors.gray.200');
  --spacing-sm: theme('spacing.2');
  --spacing-md: theme('spacing.4');
}
```

## 🧪 Testing Strategy

### Unit Testing

**Component Testing:**
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
});
```

**Store Testing:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from './taskStore';

describe('TaskStore', () => {
  it('adds task correctly', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.addTask({
        id: '1',
        title: 'Test Task',
        status: 'todo'
      });
    });
    
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Test Task');
  });
});
```

### Integration Testing

**API Integration:**
```typescript
describe('Task API', () => {
  it('fetches tasks successfully', async () => {
    const mockTasks = [{ id: '1', title: 'Test' }];
    vi.mocked(api.getTasks).mockResolvedValue(mockTasks);
    
    const { result } = renderHook(() => useTaskStore());
    
    await act(async () => {
      await result.current.fetchTasks();
    });
    
    expect(result.current.tasks).toEqual(mockTasks);
  });
});
```

### E2E Testing

**Playwright Tests:**
```typescript
import { test, expect } from '@playwright/test';

test('creates and manages tasks', async ({ page }) => {
  await page.goto('/');
  
  // Create task
  await page.click('[data-testid="add-task"]');
  await page.fill('[data-testid="task-title"]', 'Test Task');
  await page.click('[data-testid="save-task"]');
  
  // Verify task created
  await expect(page.locator('[data-testid="task-card"]')).toContainText('Test Task');
  
  // Move task
  await page.dragAndDrop(
    '[data-testid="task-card"]',
    '[data-testid="in-progress-column"]'
  );
  
  // Verify task moved
  await expect(page.locator('[data-testid="in-progress-column"] [data-testid="task-card"]'))
    .toContainText('Test Task');
});
```

## ⚡ Performance Considerations

### React Performance

**Memoization:**
```typescript
const TaskCard = memo(({ task }: TaskCardProps) => {
  return (
    <div className="task-card">
      {task.title}
    </div>
  );
});

// Custom comparison
const TaskCard = memo(({ task }: TaskCardProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.task.id === nextProps.task.id;
});
```

**Lazy Loading:**
```typescript
const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Data Performance

**Virtual Scrolling:**
```typescript
import { FixedSizeList as List } from 'react-window';

function TaskList({ tasks }: { tasks: Task[] }) {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <TaskCard task={tasks[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
}
```

**Debounced Search:**
```typescript
const useDebouncedSearch = (query: string, delay: number = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  return debouncedQuery;
};
```

## 🔒 Security Guidelines

### Input Validation

**Sanitization:**
```typescript
import DOMPurify from 'dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
}
```

**Validation:**
```typescript
export function validateTaskData(data: unknown): TaskData {
  const schema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.date().optional()
  });
  
  return schema.parse(data);
}
```

### XSS Prevention

**Safe Rendering:**
```typescript
function TaskDescription({ description }: { description: string }) {
  const sanitized = useMemo(() => 
    DOMPurify.sanitize(description), 
    [description]
  );
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

### Rate Limiting

**API Rate Limiting:**
```typescript
class RateLimiter {
  private requests = new Map<string, number[]>();
  
  isAllowed(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}
```

## 🚀 Deployment Process

### Build Process

**Production Build:**
```bash
# Install dependencies
npm ci

# Run tests
npm run test

# Build application
npm run build

# Verify build
npm run start
```

**Environment Variables:**
```bash
# .env.production
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_BUILD_TIME=2024-12-01T00:00:00Z
NEXT_PUBLIC_BUILD_HASH=abc123
```

### Deployment Steps

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync out/ s3://your-bucket-name --delete
   ```

3. **Invalidate CloudFront**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

4. **Verify Deployment**
   - Check application loads correctly
   - Verify all features work
   - Run smoke tests

### CI/CD Pipeline

**GitHub Actions:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build
      - run: npm run deploy
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
   npm run test
   npm run test:e2e
   npm run lint
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

fix(auth): resolve login validation issue

docs(api): update authentication endpoints

test(task): add unit tests for task operations
```

---

*For more detailed information, see the [API Reference](./api-reference.md) and [Security Guide](./security-guide.md).*
