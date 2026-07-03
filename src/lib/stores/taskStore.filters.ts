/**
 * Task store filters and search operations
 * Consolidated module for filtering, search, and related utilities
 */

import { Task, TaskFilters, SearchScope } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { searchTasks } from '@/lib/utils/taskSearch';
import { validateTaskCollection } from '@/lib/utils/taskValidation';
import { logger } from '@/lib/utils/logger';

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

// Zustand setter type for partial state updates
export type StoreSetter = (
  partial: Partial<TaskStoreState> | ((state: TaskStoreState) => Partial<TaskStoreState>)
) => void;

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
    logger.error('Filter operation failed:', filterError);

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

export function createApplyFilters(get: () => TaskStoreState, set: StoreSetter) {
  return async () => {
    const { tasks, filters, searchCache } = get();

    try {
      // Validate tasks to prevent runtime errors
      let validTasks = validateTaskCollection(tasks, get().validateTaskIntegrity);
      let tasksChanged = validTasks.length !== tasks.length;

      // Validate board access for cross-board search
      if (filters.crossBoardSearch) {
        const beforeCount = validTasks.length;
        validTasks = await filterAccessibleTasks(validTasks);
        if (validTasks.length !== beforeCount) tasksChanged = true;
      }

      // Apply task validation changes in a single set()
      if (tasksChanged) {
        set({ tasks: validTasks });
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
      filteredTasks = validateTaskCollection(filteredTasks, get().validateTaskIntegrity);

      // Cache results — create a new Map so Zustand detects the change
      let updatedCache = searchCache;
      if (filters.search && filteredTasks.length > 0 && filteredTasks.length < 1000) {
        cacheResults(cacheKey, filteredTasks, searchCache);
        updatedCache = new Map(searchCache);
      }

      // Deterministic cache cleanup keeps behavior predictable for tests and
      // avoids random cache churn during normal searches.
      if (updatedCache.size > 0) {
        cleanupExpiredCache(updatedCache);
        updatedCache = new Map(updatedCache);
      }

      set({ filteredTasks, isSearching: false, error: get().error, searchCache: updatedCache });

    } catch (error: unknown) {
      logger.error('Filter application failed:', error);
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
      logger.error('Navigation to task board failed:', error);
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
      logger.warn('Failed to load search preferences:', error);
    }
  };
}

export function createSaveSearchScope() {
  return async (scope: SearchScope) => {
    try {
      // settingsStore is the single owner of Settings: persist the scope
      // through it (only when the user has opted to remember their scope)
      // instead of writing to the database directly behind its back.
      const { settings, setDefaultSearchScope } = useSettingsStore.getState();
      if (settings.searchPreferences.rememberScope) {
        await setDefaultSearchScope(scope);
      }
    } catch (error: unknown) {
      logger.warn('Failed to save search scope preference:', error);
    }
  };
}

// ---------------------------------------------------------------------------
// Search-result cache + filtering helpers
//
// These live here, beside the `searchCache` state they operate on and the
// `applyFilters` action that drives them, rather than in a separate utility
// module the store had to pass its own state into. taskSearch.ts stays a pure,
// reusable text-search module; only the cache lifecycle is co-located here.
// ---------------------------------------------------------------------------

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

type CacheEntry = { results: Task[]; timestamp: number };
export type SearchCache = Map<string, CacheEntry>;

/**
 * Filters a task list down to the ones whose board still exists and is not
 * archived — used by cross-board search to drop tasks from gone boards.
 */
export async function filterAccessibleTasks(tasks: Task[]): Promise<Task[]> {
  try {
    const boards = await taskDB.getBoards();
    const validBoardIds = new Set<string>();
    for (const b of boards) {
      if (!b.archivedAt) validBoardIds.add(b.id);
    }

    const accessibleTasks = tasks.filter(task => validBoardIds.has(task.boardId));
    if (accessibleTasks.length !== tasks.length) {
      logger.info('Filtered tasks from inaccessible boards', {
        filteredCount: tasks.length - accessibleTasks.length,
      });
    }
    return accessibleTasks;
  } catch (error: unknown) {
    logger.warn('Failed to validate board access, proceeding with existing tasks', error);
    return tasks;
  }
}

/**
 * Generates cache key for search filters
 */
export function generateCacheKey(filters: TaskFilters): string {
  const key = {
    search: filters.search,
    status: filters.status,
    priority: filters.priority,
    tags: filters.tags.toSorted(),
    boardId: filters.boardId,
    crossBoardSearch: filters.crossBoardSearch,
    dateRange: filters.dateRange ? {
      start: filters.dateRange.start.getTime(),
      end: filters.dateRange.end.getTime()
    } : null
  };
  return JSON.stringify(key);
}

/**
 * Checks cache for existing search results
 * Returns cached results if valid, null otherwise
 */
export function checkCache(
  cacheKey: string,
  searchCache: SearchCache,
  currentTasks: Task[]
): Task[] | null {
  if (!searchCache.has(cacheKey)) return null;

  const cached = searchCache.get(cacheKey);
  if (!cached) return null;
  const now = Date.now();

  // Check if cache is expired
  if (now - cached.timestamp >= CACHE_TTL) {
    searchCache.delete(cacheKey);
    return null;
  }

  // Validate cached results still exist
  const currentTaskIds = new Set(currentTasks.map(t => t.id));
  const validCachedResults = cached.results.filter(task => currentTaskIds.has(task.id));

  if (validCachedResults.length === cached.results.length) {
    return validCachedResults;
  }

  // Cache is stale
  searchCache.delete(cacheKey);
  return null;
}

/**
 * Caches search results
 * Manages cache size and cleans up old entries
 */
export function cacheResults(
  cacheKey: string,
  results: Task[],
  searchCache: SearchCache
): void {
  try {
    // Clean up old cache entries if at max size
    if (searchCache.size >= MAX_CACHE_SIZE) {
      const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2); // Remove 20% of entries
      const keys = Array.from(searchCache.keys());
      for (let i = 0; i < entriesToRemove; i++) {
        searchCache.delete(keys[i]);
      }
    }

    searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
  } catch (error: unknown) {
    logger.warn('Failed to cache search results', error);
    searchCache.clear();
  }
}

/**
 * Cleans up expired cache entries periodically
 */
export function cleanupExpiredCache(searchCache: SearchCache): void {
  try {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        searchCache.delete(key);
      }
    }
  } catch (error: unknown) {
    logger.warn('Cache cleanup failed', error);
  }
}

/**
 * Determines if search operation is complex
 */
export function isComplexSearch(tasks: Task[], filters: TaskFilters): boolean {
  return !!(filters.search && (
    tasks.length > 200 ||
    filters.crossBoardSearch ||
    (filters.tags && filters.tags.length > 0) ||
    !!filters.dateRange
  ));
}
