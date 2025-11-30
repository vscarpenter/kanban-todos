/**
 * Task filtering operations - filter management and application
 */

import { TaskFilters } from '@/lib/types';
import { sanitizeSearchQuery, searchRateLimiter } from '@/lib/utils/security';
import {
  validateTasks,
  validateBoardAccess,
  generateCacheKey,
  checkCache,
  cacheResults,
  cleanupExpiredCache,
  isComplexSearch,
} from '@/lib/utils/taskFiltering';
import type { TaskStoreState, StoreSetter, GlobalWithTimeout } from './types';
import { SEARCH_DEBOUNCE_MS } from './types';
import { applyFiltersToTasks, applyFiltersWithRecovery, handleFilterError } from './helpers';

/**
 * Creates the setFilters action
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
 * Creates the setBoardFilter action
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
 * Creates the setCrossBoardSearch action
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
 * Creates the setSearchQuery action
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
 * Creates the applyFilters action
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
 * Creates the clearFilters action
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
 * Creates the clearSearch action
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
