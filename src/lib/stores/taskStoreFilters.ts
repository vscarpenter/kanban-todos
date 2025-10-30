/**
 * Filter and search operations for task store
 * Handles search queries, filter application, and cache management
 */

import { Task, TaskFilters, SearchScope } from '@/lib/types';
import { sanitizeSearchQuery, searchRateLimiter } from '@/lib/utils/security';
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
import {
  applyFiltersWithRecovery,
  handleFilterError,
  SEARCH_DEBOUNCE_MS
} from './taskStoreHelpers';

// Type definition for global timeout handling
interface GlobalWithTimeout {
  __searchTimeout?: NodeJS.Timeout;
}

// Type for store state access
type FilterStoreState = {
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  searchCache: SearchCache;
  isSearching: boolean;
  error: string | null;
  validateTaskIntegrity: (task: Task) => boolean;
  recoverFromSearchError: () => void;
  applyFilters: () => Promise<void>;
  saveSearchScope: (scope: SearchScope) => Promise<void>;
};

// Type for store setter - using any to avoid complex type inference issues
type StoreSetter = (state: any) => void;

/**
 * Sets filter values and triggers filter application
 */
export function createSetFilters(
  get: () => FilterStoreState,
  set: StoreSetter
) {
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
export function createSetBoardFilter(
  get: () => FilterStoreState,
  set: StoreSetter
) {
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
export function createSetCrossBoardSearch(
  get: () => FilterStoreState,
  set: StoreSetter
) {
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
export function createSetSearchQuery(
  get: () => FilterStoreState,
  set: StoreSetter
) {
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

    set((state: FilterStoreState) => ({
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
export function createApplyFilters(
  get: () => FilterStoreState,
  set: StoreSetter
) {
  return async () => {
    const { tasks, filters, searchCache } = get();

    try {
      // Prevent runtime errors from corrupted IndexedDB data
      // Users occasionally experience data corruption from browser crashes or storage limits
      let validTasks = validateTasks(tasks, get().validateTaskIntegrity);
      if (validTasks.length !== tasks.length) {
        set({ tasks: validTasks });
      }

      // Filter out tasks from deleted/archived boards to prevent UI errors
      // Cross-board search may reference boards that no longer exist
      if (filters.crossBoardSearch) {
        validTasks = await validateBoardAccess(validTasks);
        if (validTasks.length !== tasks.length) {
          set({ tasks: validTasks });
        }
      }

      // Prevent unnecessary re-filtering when users toggle between same searches
      // Users often search for same terms repeatedly (e.g., "urgent", "bug", "login")
      const cacheKey = generateCacheKey(filters);
      if (filters.search) {
        const cachedResults = checkCache(cacheKey, searchCache, get().tasks);
        if (cachedResults) {
          set({ filteredTasks: cachedResults, isSearching: false, error: null });
          return;
        }
      }

      // Provide visual feedback for searches that will block UI thread >50ms
      // Without loading state, complex searches feel unresponsive to users
      const currentTasks = get().tasks;
      if (isComplexSearch(currentTasks, filters) && !get().isSearching) {
        set({ isSearching: true });
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Gracefully degrade to simplified filters if primary filtering fails
      // Better to show partial results than a blank screen after search errors
      let filteredTasks = await applyFiltersWithRecovery(currentTasks, filters, get, set);

      // Remove any corrupted tasks that slipped through initial validation
      // Additional validation after filtering catches edge cases
      filteredTasks = validateTasks(filteredTasks, get().validateTaskIntegrity);

      // Cache results to speed up repeated searches (instant vs 50-200ms)
      // Skip caching for huge result sets (>1000) to avoid memory bloat
      if (filters.search && filteredTasks.length > 0 && filteredTasks.length < 1000) {
        cacheResults(cacheKey, filteredTasks, searchCache);
      }

      // Prevent memory leaks from expired cache entries accumulating over time
      // Probabilistic cleanup (10%) balances performance vs memory usage
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
export function createClearFilters(
  get: () => FilterStoreState,
  set: StoreSetter
) {
  return () => {
    const { filters } = get();
    set({
      filters: {
        search: '',
        tags: [],
        boardId: filters.boardId, // Keep board filter when clearing other filters
        crossBoardSearch: filters.crossBoardSearch // Keep cross-board search setting
      }
    });
    void get().applyFilters();
  };
}

/**
 * Clears search query and highlighted task
 */
export function createClearSearch(
  get: () => FilterStoreState,
  set: StoreSetter
) {
  return () => {
    set((state: any) => ({
      filters: { ...state.filters, search: '' },
      searchState: { ...state.searchState, highlightedTaskId: undefined }
    }));
    void get().applyFilters();
  };
}
