/**
 * Task store filters and search operations
 * Consolidated module for filtering, search, and related utilities
 */

import { Task, TaskFilters, SearchScope } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { sanitizeSearchQuery, searchRateLimiter } from '@/lib/utils/security';
import { searchTasks } from '@/lib/utils/taskSearch';
import {
  validateTasks,
  validateBoardAccess,
  generateCacheKey,
  checkCache,
  cacheResults,
  cleanupExpiredCache,
  isComplexSearch,
  type SearchCache,
} from '@/lib/utils/taskFiltering';

// ============================================================================
// Configuration
// ============================================================================

export const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// Type Definitions
// ============================================================================

export type TaskStoreState = {
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  searchState: { scope: SearchScope; highlightedTaskId?: string };
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

// Zustand setter type - using any to avoid complex type inference issues
// This is a pragmatic choice - actual type safety comes from the store definition
export type StoreSetter = (partial: any) => void;

interface GlobalWithTimeout {
  __searchTimeout?: NodeJS.Timeout;
}

// ============================================================================
// Filter Helpers
// ============================================================================

/**
 * Applies filters to a task list with performance optimizations
 * Uses early exit strategy to reduce unnecessary processing
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
 */
async function applyFiltersWithRecovery(
  tasks: Task[],
  filters: TaskFilters,
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
    } catch {
      set({
        error: 'Filter operation failed. Showing all tasks.',
        filters: { search: '', tags: [], crossBoardSearch: filters.crossBoardSearch }
      });
      return tasks;
    }
  }
}

// ============================================================================
// Filter Actions
// ============================================================================

export function createSetFilters(get: () => TaskStoreState, set: StoreSetter) {
  return (filters: Partial<TaskFilters>) => {
    set((state: TaskStoreState) => ({ filters: { ...state.filters, ...filters } }));
    void get().applyFilters();
  };
}

export function createSetBoardFilter(get: () => TaskStoreState, set: StoreSetter) {
  return (boardId: string | null) => {
    set((state: TaskStoreState) => ({ filters: { ...state.filters, boardId: boardId || undefined } }));
    void get().applyFilters();
  };
}

export function createSetCrossBoardSearch(get: () => TaskStoreState, set: StoreSetter) {
  return (enabled: boolean) => {
    set((state: TaskStoreState) => ({
      filters: { ...state.filters, crossBoardSearch: enabled },
      searchState: { ...state.searchState, scope: enabled ? 'all-boards' : 'current-board' }
    }));
    void get().applyFilters();
    void get().saveSearchScope(enabled ? 'all-boards' : 'current-board');
  };
}

export function createSetSearchQuery(get: () => TaskStoreState, set: StoreSetter) {
  return (query: string) => {
    const sanitizedQuery = sanitizeSearchQuery(query);

    // Rate limiting for search operations
    if (sanitizedQuery.trim() && !searchRateLimiter.isAllowed('search')) {
      set({
        error: 'Search rate limit exceeded. Please wait a moment before searching again.',
        isSearching: false
      });
      return;
    }

    set((state: TaskStoreState) => ({ filters: { ...state.filters, search: sanitizedQuery } }));

    // Clear any existing timeout
    if ((globalThis as GlobalWithTimeout).__searchTimeout) {
      clearTimeout((globalThis as GlobalWithTimeout).__searchTimeout);
    }

    // Handle empty queries immediately
    if (!sanitizedQuery.trim()) {
      set({ isSearching: false });
      void get().applyFilters();
      return;
    }

    // Show loading state and debounce filter application
    set({ isSearching: true, error: null });

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

export function createApplyFilters(get: () => TaskStoreState, set: StoreSetter) {
  return async () => {
    const { tasks, filters, searchCache } = get();

    try {
      // Validate tasks to prevent runtime errors
      let validTasks = validateTasks(tasks, get().validateTaskIntegrity);
      if (validTasks.length !== tasks.length) {
        set({ tasks: validTasks });
      }

      // Validate board access for cross-board search
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

      // Show loading for complex searches
      const currentTasks = get().tasks;
      if (isComplexSearch(currentTasks, filters) && !get().isSearching) {
        set({ isSearching: true });
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Apply filters with recovery
      let filteredTasks = await applyFiltersWithRecovery(currentTasks, filters, set);
      filteredTasks = validateTasks(filteredTasks, get().validateTaskIntegrity);

      // Cache results
      if (filters.search && filteredTasks.length > 0 && filteredTasks.length < 1000) {
        cacheResults(cacheKey, filteredTasks, searchCache);
      }

      // Probabilistic cache cleanup
      if (Math.random() < 0.1) {
        cleanupExpiredCache(searchCache);
      }

      set({ filteredTasks, isSearching: false, error: get().error, searchCache });

    } catch (error: unknown) {
      console.error('Filter application failed:', error);
      try {
        get().recoverFromSearchError();
      } catch {
        set({
          error: 'Search functionality is temporarily unavailable. Please refresh the page.',
          isSearching: false,
          filteredTasks: get().tasks
        });
      }
    }
  };
}

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

export function createClearSearch(get: () => TaskStoreState, set: StoreSetter) {
  return () => {
    set((state: TaskStoreState) => ({
      filters: { ...state.filters, search: '' },
      searchState: { ...state.searchState, highlightedTaskId: undefined }
    }));
    void get().applyFilters();
  };
}

// ============================================================================
// Search Navigation Actions
// ============================================================================

export function createSetHighlightedTask(set: StoreSetter) {
  return (taskId: string | undefined) => {
    set((state: TaskStoreState) => ({ searchState: { ...state.searchState, highlightedTaskId: taskId } }));
  };
}

export function createNavigateToTaskBoard(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string): Promise<{ success: boolean; boardId?: string; error?: string }> => {
    try {
      const task = get().tasks.find(t => t.id === taskId);

      if (!task) {
        return { success: false, error: 'Task not found. It may have been deleted.' };
      }

      const boardExists = await get().validateBoardAccess(task.boardId);
      if (!boardExists) {
        return { success: false, error: 'The board containing this task no longer exists or has been archived.' };
      }

      set((state: TaskStoreState) => ({ searchState: { ...state.searchState, highlightedTaskId: taskId } }));
      return { success: true, boardId: task.boardId };

    } catch (error: unknown) {
      console.error('Navigation to task board failed:', error);
      return { success: false, error: 'Failed to navigate to task. Please try again.' };
    }
  };
}

export function createLoadSearchPreferences(get: () => TaskStoreState, set: StoreSetter) {
  return async () => {
    try {
      const settings = await taskDB.getSettings();
      if (settings?.searchPreferences) {
        const { defaultScope } = settings.searchPreferences;
        const crossBoardSearch = defaultScope === 'all-boards';

        set((state: TaskStoreState) => ({
          filters: { ...state.filters, crossBoardSearch },
          searchState: { ...state.searchState, scope: defaultScope }
        }));
      }
    } catch (error: unknown) {
      console.warn('Failed to load search preferences:', error);
    }
  };
}

export function createSaveSearchScope() {
  return async (scope: SearchScope) => {
    try {
      const settings = await taskDB.getSettings();
      if (settings?.searchPreferences?.rememberScope) {
        await taskDB.updateSettings({
          ...settings,
          searchPreferences: { ...settings.searchPreferences, defaultScope: scope },
        });
      }
    } catch (error: unknown) {
      console.warn('Failed to save search scope preference:', error);
    }
  };
}
