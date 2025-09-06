# API Reference

Complete technical reference for the Kanban Todos application APIs and utilities.

## 📋 Table of Contents

- [Store APIs](#store-apis)
- [Utility Functions](#utility-functions)
- [Component APIs](#component-apis)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Performance APIs](#performance-apis)
- [Security APIs](#security-apis)
- [Monitoring APIs](#monitoring-apis)

## 🗃️ Store APIs

### Task Store

**Location**: `src/lib/stores/taskStore.ts`

#### State

```typescript
interface TaskStoreState {
  tasks: Task[];
  filteredTasks: Task[];
  searchQuery: string;
  selectedBoard: string;
  isLoading: boolean;
  error: string | null;
}
```

#### Actions

```typescript
interface TaskStoreActions {
  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
  
  // Task Operations
  moveTask: (id: string, newStatus: TaskStatus) => void;
  duplicateTask: (id: string) => void;
  archiveTask: (id: string) => void;
  
  // Search and Filter
  setSearchQuery: (query: string) => void;
  filterTasks: (filters: TaskFilters) => void;
  clearFilters: () => void;
  
  // Board Operations
  setSelectedBoard: (boardId: string) => void;
  loadTasksForBoard: (boardId: string) => Promise<void>;
  
  // Data Management
  exportTasks: (format: 'json' | 'csv') => Promise<string>;
  importTasks: (data: string, format: 'json' | 'csv') => Promise<void>;
  
  // Error Handling
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
}
```

#### Usage Examples

```typescript
import { useTaskStore } from '@/lib/stores/taskStore';

function TaskComponent() {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask,
    setSearchQuery 
  } = useTaskStore();
  
  // Add a new task
  const handleAddTask = () => {
    addTask({
      title: 'New Task',
      description: 'Task description',
      status: 'todo',
      priority: 'medium'
    });
  };
  
  // Update task
  const handleUpdateTask = (id: string) => {
    updateTask(id, { status: 'in-progress' });
  };
  
  // Search tasks
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
}
```

### Board Store

**Location**: `src/lib/stores/boardStore.ts`

#### State

```typescript
interface BoardStoreState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
}
```

#### Actions

```typescript
interface BoardStoreActions {
  // Board CRUD
  createBoard: (board: Omit<Board, 'id' | 'createdAt'>) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  getBoard: (id: string) => Board | undefined;
  
  // Board Operations
  setCurrentBoard: (id: string) => void;
  duplicateBoard: (id: string) => void;
  
  // Column Management
  addColumn: (boardId: string, column: Omit<Column, 'id'>) => void;
  updateColumn: (boardId: string, columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (boardId: string, columnId: string) => void;
  reorderColumns: (boardId: string, columnIds: string[]) => void;
  
  // Data Management
  exportBoard: (id: string, format: 'json' | 'csv') => Promise<string>;
  importBoard: (data: string, format: 'json' | 'csv') => Promise<void>;
}
```

### Settings Store

**Location**: `src/lib/stores/settingsStore.ts`

#### State

```typescript
interface SettingsStoreState {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  performance: PerformanceSettings;
  isLoaded: boolean;
}
```

#### Actions

```typescript
interface SettingsStoreActions {
  updateTheme: (theme: 'light' | 'dark' | 'auto') => void;
  updateLanguage: (language: string) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  updatePerformance: (settings: Partial<PerformanceSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => void;
}
```

## 🛠️ Utility Functions

### Security Utilities

**Location**: `src/lib/utils/security.ts`

#### Functions

```typescript
// Input sanitization
export function sanitizeInput(input: string): string;
export function sanitizeSearchQuery(query: string): string;
export function sanitizeTaskData(data: unknown): TaskData;
export function sanitizeBoardData(data: unknown): BoardData;

// Validation
export function validateImportFile(file: File): Promise<boolean>;
export function validateImportJson(data: string): boolean;
export function sanitizeTaskId(id: string): string;

// Rate limiting
export class RateLimiter {
  constructor(limit: number, window: number);
  isAllowed(key: string): boolean;
  reset(key: string): void;
}

// Instance
export const searchRateLimiter: RateLimiter;
```

#### Usage Examples

```typescript
import { 
  sanitizeInput, 
  sanitizeTaskData, 
  searchRateLimiter 
} from '@/lib/utils/security';

// Sanitize user input
const cleanInput = sanitizeInput(userInput);

// Validate task data
const validTask = sanitizeTaskData(taskData);

// Check rate limit
if (searchRateLimiter.isAllowed('user123')) {
  // Perform search
}
```

### Error Handling

**Location**: `src/lib/utils/errorHandling.ts`

#### Classes and Functions

```typescript
// Error codes
export const ERROR_CODES = {
  DATABASE_INIT_FAILED: 'DATABASE_INIT_FAILED',
  DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
  // ... more error codes
} as const;

// App error class
export class AppError extends Error {
  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    isRecoverable: boolean,
    severity: 'low' | 'medium' | 'high' | 'critical'
  );
}

// Error handling functions
export function createErrorContext(operation: string, component?: string): ErrorContext;
export function handleError(error: Error, context?: ErrorContext): void;
export function safeExecute<T>(fn: () => Promise<T>, context: ErrorContext): Promise<T>;
export function recoverFromDatabaseError(error: Error): Promise<void>;
```

#### Usage Examples

```typescript
import { 
  createErrorContext, 
  handleError, 
  safeExecute 
} from '@/lib/utils/errorHandling';

// Safe execution with error handling
const result = await safeExecute(
  async () => {
    // Risky operation
    return await api.getData();
  },
  createErrorContext('fetchData', 'DataComponent')
);

// Manual error handling
try {
  await riskyOperation();
} catch (error) {
  handleError(error, createErrorContext('riskyOperation'));
}
```

### Performance Utilities

**Location**: `src/lib/utils/performance.ts`

#### Classes

```typescript
// Performance monitor
export class PerformanceMonitor {
  static getInstance(): PerformanceMonitor;
  startTiming(operation: string): () => void;
  trackMemoryUsage(): void;
  getPerformanceEntries(): PerformanceEntry[];
  clearEntries(): void;
}

// Debounced search
export class DebouncedSearch {
  constructor(
    searchFn: (query: string) => Promise<unknown[]>,
    delay?: number
  );
  search(query: string): Promise<unknown[]>;
  cancel(): void;
}

// Search pagination
export class SearchPagination {
  constructor(pageSize?: number);
  paginate<T>(items: T[], page: number): T[];
  getTotalPages(itemCount: number): number;
}

// Database optimizer
export class DatabaseOptimizer {
  static cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T>;
  static clearCache(): void;
}
```

#### Usage Examples

```typescript
import { 
  PerformanceMonitor, 
  DebouncedSearch, 
  SearchPagination 
} from '@/lib/utils/performance';

// Performance monitoring
const monitor = PerformanceMonitor.getInstance();
const endTiming = monitor.startTiming('dataFetch');
// ... perform operation
endTiming();

// Debounced search
const search = new DebouncedSearch(async (query) => {
  return await api.searchTasks(query);
}, 300);

const results = await search.search('search term');

// Pagination
const pagination = new SearchPagination(10);
const pageItems = pagination.paginate(items, 1);
```

## 🧩 Component APIs

### Error Boundary

**Location**: `src/components/ErrorBoundary.tsx`

#### Props

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}
```

#### Usage

```typescript
<ErrorBoundary
  fallback={CustomErrorFallback}
  onError={(error, errorInfo) => {
    console.error('Error caught by boundary:', error);
  }}
>
  <App />
</ErrorBoundary>
```

### Performance Monitor

**Location**: `src/components/PerformanceMonitor.tsx`

#### Props

```typescript
interface PerformanceMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
```

### Accessibility Settings

**Location**: `src/components/AccessibilitySettingsDialog.tsx`

#### Props

```typescript
interface AccessibilitySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

## 📝 Type Definitions

### Core Types

```typescript
// Task types
interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assignee?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  boardId: string;
}

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

// Board types
interface Board {
  id: string;
  name: string;
  description?: string;
  columns: Column[];
  createdAt: Date;
  updatedAt: Date;
}

interface Column {
  id: string;
  name: string;
  order: number;
  color?: string;
}

// Filter types
interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: string[];
  tags?: string[];
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}
```

### Store Types

```typescript
// Store state types
interface TaskStoreState {
  tasks: Task[];
  filteredTasks: Task[];
  searchQuery: string;
  selectedBoard: string;
  isLoading: boolean;
  error: string | null;
}

// Action types
interface TaskStoreActions {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  // ... more actions
}
```

### Utility Types

```typescript
// Error types
interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

// Performance types
interface PerformanceEntry {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

```

## ⚠️ Error Handling

### Error Codes

```typescript
export const ERROR_CODES = {
  // Database errors
  DATABASE_INIT_FAILED: 'DATABASE_INIT_FAILED',
  DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
  DATABASE_WRITE_FAILED: 'DATABASE_WRITE_FAILED',
  DATABASE_READ_FAILED: 'DATABASE_READ_FAILED',
  DATABASE_CORRUPTED: 'DATABASE_CORRUPTED',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_FORMAT: 'INVALID_DATA_FORMAT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTED: 'STORAGE_CORRUPTED',
  
  // Search errors
  SEARCH_RATE_LIMITED: 'SEARCH_RATE_LIMITED',
  SEARCH_QUERY_INVALID: 'SEARCH_QUERY_INVALID',
  
  // Import/Export errors
  IMPORT_FILE_INVALID: 'IMPORT_FILE_INVALID',
  EXPORT_FAILED: 'EXPORT_FAILED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;
```

### Error Recovery

```typescript
// Error recovery strategies
export class ErrorRecovery {
  static registerStrategy(
    errorCode: string, 
    strategy: ErrorRecoveryStrategy
  ): void;
  
  static getStrategy(errorCode: string): ErrorRecoveryStrategy | undefined;
  
  static async recover(error: AppError): Promise<boolean>;
}

interface ErrorRecoveryStrategy {
  retryCount: number;
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: () => void;
}
```

## 📊 Performance Utilities

### Memory Optimization

```typescript
import { 
  debounce, 
  throttle, 
  getMemoryInfo,
  createCleanupManager 
} from '@/lib/utils/memoryOptimization';

// Debounce function calls
const debouncedSearch = debounce((query: string) => {
  // Search logic
}, 300);

// Throttle function calls
const throttledScroll = throttle((event: Event) => {
  // Scroll handling
}, 100);

// Get memory information (browser only)
const memoryInfo = getMemoryInfo();
if (memoryInfo) {
  console.log('Memory usage:', memoryInfo.used, 'MB');
}

// Cleanup management
const cleanup = createCleanupManager();
cleanup.addTimer(setTimeout(() => {}, 1000));
cleanup.cleanup(); // Clean up all timers and listeners
```

## 🔒 Security APIs

### Input Sanitization

```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
const cleanHtml = DOMPurify.sanitize(htmlContent, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: []
});

// Sanitize user input
const cleanInput = sanitizeInput(userInput);

// Validate data
const validData = sanitizeTaskData(taskData);
```

### Rate Limiting

```typescript
// Create rate limiter
const limiter = new RateLimiter(10, 60000); // 10 requests per minute

// Check if request is allowed
if (limiter.isAllowed('user123')) {
  // Process request
} else {
  // Rate limited
}

// Reset rate limiter
limiter.reset('user123');
```


---

*For more detailed examples and usage patterns, see the [Developer Guide](./developer-guide.md).*
