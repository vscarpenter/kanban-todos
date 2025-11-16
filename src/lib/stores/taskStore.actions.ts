/**
 * Task store actions - CRUD, filters, and search operations
 * Consolidated from taskStoreActions, taskStoreFilters, taskStoreSearch, and taskStoreHelpers
 *
 * This file combines related task operations for better maintainability:
 * - CRUD operations (add, update, delete, move, archive)
 * - Filter and search operations
 * - Search preferences and navigation
 * - Helper utilities for filtering
 */

import { Task, TaskFilters, SearchScope, SearchState } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { sanitizeTaskData, sanitizeSearchQuery, searchRateLimiter } from '@/lib/utils/security';
import { searchTasks } from '@/lib/utils/taskSearch';
import { ExportData } from '@/lib/utils/exportImport';
import {
  validateTasks,
  validateBoardAccess,
  generateCacheKey,
  checkCache,
  cacheResults,
  cleanupExpiredCache,
  isComplexSearch,
  type SearchCache
} from '@/lib/utils/taskFiltering';

// ============================================================================
// Configuration
// ============================================================================

export const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// Type Definitions
// ============================================================================

// Type for store state access
type TaskStoreState = {
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  searchState: SearchState;
  searchCache: SearchCache;
  isSearching: boolean;
  isLoading: boolean;
  error: string | null;
  validateTaskIntegrity: (task: Task) => boolean;
  validateBoardAccess: (boardId: string) => Promise<boolean>;
  recoverFromSearchError: () => void;
  applyFilters: () => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  saveSearchScope: (scope: SearchScope) => Promise<void>;
};

// Type for store setter - using any to avoid complex type inference issues
type StoreSetter = (state: any) => void;

// Type definition for global timeout handling
interface GlobalWithTimeout {
  __searchTimeout?: NodeJS.Timeout;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Applies filters to a task list with performance optimizations
 * Early exit strategy reduces unnecessary processing
 */
export function applyFiltersToTasks(tasks: Task[], filters: TaskFilters): Task[] {
  if (tasks.length === 0) return tasks;

  let filteredTasks = tasks;

  // Filter by board first (most selective) - only apply if not doing cross-board search
  if (filters.boardId && !filters.crossBoardSearch) {
    filteredTasks = filteredTasks.filter(task => task.boardId === filters.boardId);
    if (filteredTasks.length === 0) return filteredTasks;
  }

  // Apply status filter (usually selective)
  if (filters.status) {
    filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    if (filteredTasks.length === 0) return filteredTasks;
  }

  // Apply priority filter
  if (filters.priority) {
    filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    if (filteredTasks.length === 0) return filteredTasks;
  }

  // Apply tag filters (can be expensive with many tags)
  if (filters.tags.length > 0) {
    const filterTags = new Set(filters.tags);
    filteredTasks = filteredTasks.filter(task =>
      task.tags.some(tag => filterTags.has(tag))
    );
    if (filteredTasks.length === 0) return filteredTasks;
  }

  // Apply date range filter
  if (filters.dateRange) {
    const startTime = filters.dateRange.start.getTime();
    const endTime = filters.dateRange.end.getTime();
    filteredTasks = filteredTasks.filter(task => {
      const taskTime = task.createdAt.getTime();
      return taskTime >= startTime && taskTime <= endTime;
    });
    if (filteredTasks.length === 0) return filteredTasks;
  }

  // Apply search last (can be expensive)
  if (filters.search) {
    filteredTasks = searchTasks(filteredTasks, filters.search);
  }

  return filteredTasks;
}

/**
 * Applies filters with error recovery fallback
 * Gracefully degrades to simplified filters if primary filtering fails
 */
async function applyFiltersWithRecovery(
  tasks: Task[],
  filters: TaskFilters,
  get: () => TaskStoreState,
  set: StoreSetter
): Promise<Task[]> {
  try {
    return applyFiltersToTasks(tasks, filters);
  } catch (filterError: unknown) {
    console.error('Filter operation failed:', filterError);

    // Attempt recovery with simplified filters
    const simplifiedFilters = { ...filters, search: '', tags: [] };
    try {
      const results = applyFiltersToTasks(tasks, simplifiedFilters);
      set({
        error: 'Search temporarily simplified due to an error. Please try again.',
        filters: simplifiedFilters
      });
      return results;
    } catch (recoveryError: unknown) {
      console.error('Filter recovery failed:', recoveryError);
      set({
        error: 'Filter operation failed. Showing all tasks.',
        filters: { search: '', tags: [], crossBoardSearch: filters.crossBoardSearch }
      });
      return tasks;
    }
  }
}

/**
 * Handles filter errors with graceful recovery
 * Last resort error handling to maintain application stability
 */
function handleFilterError(get: () => TaskStoreState, set: StoreSetter): void {
  try {
    get().recoverFromSearchError();
  } catch (recoveryError: unknown) {
    console.error('Recovery from filter error failed:', recoveryError);
    set({
      error: 'Search functionality is temporarily unavailable. Please refresh the page.',
      isSearching: false,
      filteredTasks: get().tasks
    });
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Adds a new task to the store and database
 */
export function createAddTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ isLoading: true, error: null });

      // Sanitize and validate input data
      const sanitizedData = sanitizeTaskData({
        title: taskData.title,
        description: taskData.description,
        tags: taskData.tags,
      });

      // Validate required fields
      if (!sanitizedData.title.trim()) {
        throw new Error('Task title is required');
      }

      const newTask: Task = {
        ...taskData,
        ...sanitizedData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await taskDB.addTask(newTask);

      const { tasks, filters } = get();
      const updatedTasks = [...tasks, newTask];
      const filteredTasks = applyFiltersToTasks(updatedTasks, filters);

      set({
        tasks: updatedTasks,
        filteredTasks: filteredTasks,
        isLoading: false,
        searchCache: new Map(), // Clear cache when tasks change
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add task',
        isLoading: false
      });
    }
  };
}

/**
 * Updates an existing task in the store and database
 */
export function createUpdateTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string, updates: Partial<Task>) => {
    try {
      set({ isLoading: true, error: null });

      const updatedTask = {
        ...get().tasks.find(t => t.id === taskId)!,
        ...updates,
        updatedAt: new Date(),
      };

      await taskDB.updateTask(updatedTask);

      const { tasks, filters } = get();
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? updatedTask : t
      );
      const filteredTasks = applyFiltersToTasks(updatedTasks, filters);

      set({
        tasks: updatedTasks,
        filteredTasks: filteredTasks,
        isLoading: false,
        searchCache: new Map(), // Clear cache when tasks change
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false
      });
    }
  };
}

/**
 * Deletes a task from the store and database
 */
export function createDeleteTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      set({ isLoading: true, error: null });

      await taskDB.deleteTask(taskId);

      const { tasks, filters } = get();
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      const filteredTasks = applyFiltersToTasks(updatedTasks, filters);

      set({
        tasks: updatedTasks,
        filteredTasks: filteredTasks,
        isLoading: false,
        searchCache: new Map(), // Clear cache when tasks change
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false
      });
    }
  };
}

/**
 * Moves a task to a different status column
 * Handles progress tracking and completion timestamps
 */
export function createMoveTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string, newStatus: Task['status']) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<Task> = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Handle progress tracking based on status
      if (newStatus === 'done') {
        updates.progress = 100;
        if (!task.completedAt) {
          updates.completedAt = new Date();
        }
      } else if (newStatus === 'in-progress') {
        // Keep existing progress or set to 0 if moving from todo
        if (task.status === 'todo') {
          updates.progress = 0;
        }
        updates.completedAt = undefined;
      } else if (newStatus === 'todo') {
        // Clear progress when moving back to todo
        updates.progress = undefined;
        updates.completedAt = undefined;
      }

      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move task'
      });
    }
  };
}

/**
 * Moves a task to a different board
 */
export function createMoveTaskToBoard(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string, targetBoardId: string) => {
    try {
      set({ isLoading: true, error: null });

      const task = get().tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      if (task.boardId === targetBoardId) {
        throw new Error('Task is already on this board');
      }

      const updates: Partial<Task> = {
        boardId: targetBoardId,
        updatedAt: new Date(),
      };

      await get().updateTask(taskId, updates);

      // Refresh filtered tasks to reflect board change
      await get().applyFilters();

    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move task to board'
      });
      throw error; // Re-throw so UI can handle it
    } finally {
      set({ isLoading: false });
    }
  };
}

/**
 * Archives a task (soft delete)
 */
export function createArchiveTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<Task> = {
        archivedAt: new Date(),
        updatedAt: new Date(),
      };

      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to archive task'
      });
    }
  };
}

/**
 * Unarchives a task
 */
export function createUnarchiveTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<Task> = {
        archivedAt: undefined,
        updatedAt: new Date(),
      };

      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unarchive task'
      });
    }
  };
}

// ============================================================================
// Filter Operations
// ============================================================================

/**
 * Sets filter values and triggers filter application
 */
export function createSetFilters(get: () => TaskStoreState, set: StoreSetter) {
  return (filters: Partial<TaskFilters>) => {
    set((state: any) => ({
      filters: { ...state.filters, ...filters }
    }));
    void get().applyFilters();
  };
}

/**
 * Sets board filter and triggers filter application
 */
export function createSetBoardFilter(get: () => TaskStoreState, set: StoreSetter) {
  return (boardId: string | null) => {
    set((state: any) => ({
      filters: { ...state.filters, boardId: boardId || undefined }
    }));
    void get().applyFilters();
  };
}

/**
 * Toggles cross-board search mode
 */
export function createSetCrossBoardSearch(get: () => TaskStoreState, set: StoreSetter) {
  return (enabled: boolean) => {
    set((state: any) => ({
      filters: { ...state.filters, crossBoardSearch: enabled },
      searchState: {
        ...state.searchState,
        scope: enabled ? 'all-boards' : 'current-board'
      }
    }));
    void get().applyFilters();

    // Save the scope preference if remember is enabled
    void get().saveSearchScope(enabled ? 'all-boards' : 'current-board');
  };
}

/**
 * Sets search query with rate limiting and debouncing
 */
export function createSetSearchQuery(get: () => TaskStoreState, set: StoreSetter) {
  return (query: string) => {
    // Sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(query);

    // Rate limiting for search operations
    if (sanitizedQuery.trim() && !searchRateLimiter.isAllowed('search')) {
      set({
        error: 'Search rate limit exceeded. Please wait a moment before searching again.',
        isSearching: false
      });
      return;
    }

    set((state: TaskStoreState) => ({
      filters: { ...state.filters, search: sanitizedQuery }
    }));

    // Clear any existing timeout
    if ((globalThis as GlobalWithTimeout).__searchTimeout) {
      clearTimeout((globalThis as GlobalWithTimeout).__searchTimeout);
    }

    // Show loading state for non-empty searches
    if (sanitizedQuery.trim()) {
      set({ isSearching: true, error: null });
    } else {
      // Clear search immediately for empty queries
      set({ isSearching: false });
      void get().applyFilters();
      return;
    }

    // Debounce the filter application for search
    const timeoutId = setTimeout(async () => {
      try {
        await get().applyFilters();
      } catch (error: unknown) {
        console.error('Search operation failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Search failed',
          isSearching: false
        });
      }
    }, SEARCH_DEBOUNCE_MS);

    (globalThis as GlobalWithTimeout).__searchTimeout = timeoutId;
  };
}

/**
 * Applies all filters to tasks with caching and error recovery
 * This is the main filtering orchestration function
 */
export function createApplyFilters(get: () => TaskStoreState, set: StoreSetter) {
  return async () => {
    const { tasks, filters, searchCache } = get();

    try {
      // Prevent runtime errors from corrupted IndexedDB data
      let validTasks = validateTasks(tasks, get().validateTaskIntegrity);
      if (validTasks.length !== tasks.length) {
        set({ tasks: validTasks });
      }

      // Filter out tasks from deleted/archived boards to prevent UI errors
      if (filters.crossBoardSearch) {
        validTasks = await validateBoardAccess(validTasks);
        if (validTasks.length !== tasks.length) {
          set({ tasks: validTasks });
        }
      }

      // Check cache for repeated searches
      const cacheKey = generateCacheKey(filters);
      if (filters.search) {
        const cachedResults = checkCache(cacheKey, searchCache, get().tasks);
        if (cachedResults) {
          set({ filteredTasks: cachedResults, isSearching: false, error: null });
          return;
        }
      }

      // Provide visual feedback for complex searches
      const currentTasks = get().tasks;
      if (isComplexSearch(currentTasks, filters) && !get().isSearching) {
        set({ isSearching: true });
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Apply filters with error recovery
      let filteredTasks = await applyFiltersWithRecovery(currentTasks, filters, get, set);

      // Additional validation after filtering
      filteredTasks = validateTasks(filteredTasks, get().validateTaskIntegrity);

      // Cache results for repeated searches
      if (filters.search && filteredTasks.length > 0 && filteredTasks.length < 1000) {
        cacheResults(cacheKey, filteredTasks, searchCache);
      }

      // Probabilistic cache cleanup
      if (Math.random() < 0.1) {
        cleanupExpiredCache(searchCache);
      }

      set({
        filteredTasks,
        isSearching: false,
        error: get().error,
        searchCache
      });

    } catch (error: unknown) {
      console.error('Filter application failed:', error);
      handleFilterError(get, set);
    }
  };
}

/**
 * Clears all filters except board and cross-board search settings
 */
export function createClearFilters(get: () => TaskStoreState, set: StoreSetter) {
  return () => {
    const { filters } = get();
    set({
      filters: {
        search: '',
        tags: [],
        boardId: filters.boardId,
        crossBoardSearch: filters.crossBoardSearch
      }
    });
    void get().applyFilters();
  };
}

/**
 * Clears search query and highlighted task
 */
export function createClearSearch(get: () => TaskStoreState, set: StoreSetter) {
  return () => {
    set((state: any) => ({
      filters: { ...state.filters, search: '' },
      searchState: { ...state.searchState, highlightedTaskId: undefined }
    }));
    void get().applyFilters();
  };
}

// ============================================================================
// Search Operations
// ============================================================================

/**
 * Sets the highlighted task for search navigation
 */
export function createSetHighlightedTask(set: StoreSetter) {
  return (taskId: string | undefined) => {
    set((state: TaskStoreState) => ({
      searchState: { ...state.searchState, highlightedTaskId: taskId }
    }));
  };
}

/**
 * Navigates to a task's board with validation
 * Returns navigation result with board ID or error message
 */
export function createNavigateToTaskBoard(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string): Promise<{ success: boolean; boardId?: string; error?: string }> => {
    try {
      const { tasks } = get();
      const task = tasks.find(t => t.id === taskId);

      if (!task) {
        return {
          success: false,
          error: 'Task not found. It may have been deleted.'
        };
      }

      // Validate that the board still exists
      const boardExists = await get().validateBoardAccess(task.boardId);
      if (!boardExists) {
        return {
          success: false,
          error: 'The board containing this task no longer exists or has been archived.'
        };
      }

      // Set the highlighted task for navigation
      set((state: TaskStoreState) => ({
        searchState: { ...state.searchState, highlightedTaskId: taskId }
      }));

      return {
        success: true,
        boardId: task.boardId
      };

    } catch (error: unknown) {
      console.error('Navigation to task board failed:', error);
      return {
        success: false,
        error: 'Failed to navigate to task. Please try again.'
      };
    }
  };
}

/**
 * Loads search preferences from database
 * Restores user's preferred search scope
 */
export function createLoadSearchPreferences(get: () => TaskStoreState, set: any) {
  return async () => {
    try {
      const settings = await taskDB.getSettings();
      if (settings?.searchPreferences) {
        const { defaultScope } = settings.searchPreferences;
        const crossBoardSearch = defaultScope === 'all-boards';

        set((state: any) => ({
          filters: { ...state.filters, crossBoardSearch },
          searchState: { ...state.searchState, scope: defaultScope }
        }));
      }
    } catch (error: unknown) {
      console.warn('Failed to load search preferences:', error);
    }
  };
}

/**
 * Saves search scope preference to database
 * Persists user's choice between sessions if remember is enabled
 */
export function createSaveSearchScope() {
  return async (scope: SearchScope) => {
    try {
      const settings = await taskDB.getSettings();
      if (settings?.searchPreferences?.rememberScope) {
        const updatedSettings = {
          ...settings,
          searchPreferences: {
            ...settings.searchPreferences,
            defaultScope: scope,
          },
        };
        await taskDB.updateSettings(updatedSettings);
      }
    } catch (error: unknown) {
      console.warn('Failed to save search scope preference:', error);
    }
  };
}
