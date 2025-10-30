/**
 * Helper functions for task store operations
 * Extracted to improve code organization and maintainability
 */

import { Task, TaskFilters } from '@/lib/types';
import { searchTasks } from '@/lib/utils/taskSearch';

// Search configuration
export const SEARCH_DEBOUNCE_MS = 300;

// Type for store getter/setter (to avoid circular dependency)
type StoreGetter = () => { tasks: Task[]; validateTaskIntegrity: (task: Task) => boolean };
type StoreSetter = (state: Partial<{
  tasks: Task[];
  error: string | null;
  filters: TaskFilters;
  filteredTasks: Task[];
  isSearching: boolean;
}>) => void;

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
export async function applyFiltersWithRecovery(
  tasks: Task[],
  filters: TaskFilters,
  get: StoreGetter,
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
export function handleFilterError(
  get: () => { tasks: Task[]; recoverFromSearchError: () => void },
  set: StoreSetter
): void {
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
