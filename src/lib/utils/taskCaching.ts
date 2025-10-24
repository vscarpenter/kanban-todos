import { Task, TaskFilters } from '@/lib/types';

// Cache configuration constants
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes - balance between performance and freshness
const MAX_CACHE_SIZE = 50; // Limit memory usage while supporting common search patterns
const CACHE_CLEANUP_PERCENTAGE = 0.2; // Remove 20% of oldest entries when at capacity

export type CacheEntry = {
  results: Task[];
  timestamp: number;
};

export type SearchCache = Map<string, CacheEntry>;

/**
 * Creates a cache key from task filters
 * Used to identify identical filter combinations for cache hits
 */
function createFilterCacheKey(filters: TaskFilters): string {
  const key = {
    search: filters.search,
    status: filters.status,
    priority: filters.priority,
    tags: [...filters.tags].sort(), // Sort for consistent keys regardless of tag order
    boardId: filters.boardId,
    crossBoardSearch: filters.crossBoardSearch,
    dateRange: filters.dateRange
      ? {
          start: filters.dateRange.start.getTime(),
          end: filters.dateRange.end.getTime()
        }
      : null
  };
  return JSON.stringify(key);
}

/**
 * Checks if cached results are still valid
 * Cached results become invalid when:
 * - Cache has expired (TTL exceeded)
 * - Tasks in cache have been deleted from the current task list
 */
function areCachedResultsValid(
  cachedEntry: CacheEntry,
  currentTasks: Task[]
): boolean {
  const now = Date.now();

  // Check expiration
  if (now - cachedEntry.timestamp >= CACHE_TTL) {
    return false;
  }

  // Validate cached tasks still exist in current task list
  const currentTaskIds = new Set(currentTasks.map(t => t.id));
  const allCachedTasksExist = cachedEntry.results.every(task =>
    currentTaskIds.has(task.id)
  );

  return allCachedTasksExist;
}

/**
 * Removes oldest cache entries when cache is at capacity
 * Uses FIFO eviction strategy to maintain manageable memory footprint
 */
function evictOldestEntries(cache: SearchCache): void {
  const entriesToRemove = Math.floor(MAX_CACHE_SIZE * CACHE_CLEANUP_PERCENTAGE);
  const keys = Array.from(cache.keys());

  for (let i = 0; i < entriesToRemove && i < keys.length; i++) {
    cache.delete(keys[i]);
  }
}

/**
 * Task search result cache manager
 * Prevents unnecessary re-filtering when users repeatedly search with same criteria
 *
 * Why caching matters:
 * - Users often toggle between same searches (e.g., "urgent", "bug", "login")
 * - Filtering 1000+ tasks can block UI thread for 50-100ms
 * - Cache hit provides instant results (<1ms)
 * - Memory overhead is minimal (stores task references, not copies)
 */
export class TaskCache {
  private cache: SearchCache;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Attempts to retrieve cached results for given filters
   * Returns null if cache miss or invalid cache entry
   */
  get(filters: TaskFilters, currentTasks: Task[]): Task[] | null {
    const cacheKey = createFilterCacheKey(filters);

    if (!this.cache.has(cacheKey)) {
      return null;
    }

    const cachedEntry = this.cache.get(cacheKey)!;

    if (!areCachedResultsValid(cachedEntry, currentTasks)) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cachedEntry.results;
  }

  /**
   * Stores search results in cache
   * Automatically manages cache size and handles storage errors
   */
  set(filters: TaskFilters, results: Task[]): void {
    try {
      // Evict old entries if at capacity
      if (this.cache.size >= MAX_CACHE_SIZE) {
        evictOldestEntries(this.cache);
      }

      const cacheKey = createFilterCacheKey(filters);
      this.cache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
    } catch (error: unknown) {
      console.warn('Failed to cache search results:', error);
      this.clear(); // Clear cache on error to prevent corruption
    }
  }

  /**
   * Removes all expired entries from cache
   * Should be called periodically to prevent memory bloat
   */
  cleanupExpired(): void {
    try {
      const now = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
          this.cache.delete(key);
        }
      }
    } catch (error: unknown) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Clears all cache entries
   * Use when task list changes significantly (imports, bulk deletes, etc.)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets current cache size
   * Useful for monitoring and debugging
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Gets the underlying cache Map for compatibility with existing code
   * @deprecated Prefer using the class methods instead of direct Map access
   */
  getRawCache(): SearchCache {
    return this.cache;
  }
}

/**
 * Determines if a search operation is complex enough to show loading state
 *
 * Why we need this:
 * - Simple searches on small datasets complete instantly (<10ms)
 * - Complex searches on large datasets can take 50-200ms
 * - Showing loading state for instant operations feels sluggish
 * - Not showing loading state for slow operations feels unresponsive
 *
 * @param tasks - Current task list
 * @param filters - Active filters
 * @returns true if search will likely take >50ms
 */
export function isComplexSearch(tasks: Task[], filters: TaskFilters): boolean {
  if (!filters.search) {
    return false;
  }

  return (
    tasks.length > 200 ||
    filters.crossBoardSearch ||
    (filters.tags && filters.tags.length > 0) ||
    !!filters.dateRange
  );
}
