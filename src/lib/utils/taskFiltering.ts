import { Task, TaskFilters } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;

export type CacheEntry = { results: Task[]; timestamp: number };
export type SearchCache = Map<string, CacheEntry>;

/**
 * Validates task integrity before filtering
 * Returns only tasks with valid required fields
 */
export function validateTasks(
  tasks: Task[],
  validateFn: (task: Task) => boolean
): Task[] {
  const validTasks = tasks.filter(validateFn);
  if (validTasks.length !== tasks.length) {
    console.warn(`Filtered out ${tasks.length - validTasks.length} invalid tasks`);
  }
  return validTasks;
}

/**
 * Validates board access for cross-board search
 * Filters out tasks from deleted or archived boards
 */
export async function validateBoardAccess(tasks: Task[]): Promise<Task[]> {
  try {
    const boards = await taskDB.getBoards();
    const validBoardIds = new Set(boards.filter(b => !b.archivedAt).map(b => b.id));

    const accessibleTasks = tasks.filter(task => validBoardIds.has(task.boardId));
    if (accessibleTasks.length !== tasks.length) {
      console.info(`Filtered out ${tasks.length - accessibleTasks.length} tasks from inaccessible boards`);
    }
    return accessibleTasks;
  } catch (error: unknown) {
    console.warn('Failed to validate board access, proceeding with existing tasks:', error);
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
    tags: [...filters.tags].sort(),
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

  const cached = searchCache.get(cacheKey)!;
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
    console.warn('Failed to cache search results:', error);
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
    console.warn('Cache cleanup failed:', error);
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
