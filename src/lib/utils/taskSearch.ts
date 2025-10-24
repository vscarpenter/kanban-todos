import { Task } from '@/lib/types';

/**
 * Performance threshold - datasets larger than this use optimized search
 * to avoid UI blocking on large task lists
 */
const LARGE_DATASET_THRESHOLD = 500;

/**
 * Builds searchable text from task fields for matching
 */
function buildSearchableText(task: Task): string {
  return [
    task.title.toLowerCase(),
    task.description?.toLowerCase() || '',
    ...task.tags.map(tag => tag.toLowerCase())
  ].join(' ');
}

/**
 * Checks if a task matches all search words
 * Uses early return optimization - checks title first since it's the most common match
 */
function taskMatchesSearch(task: Task, searchLower: string, searchWords: string[]): boolean {
  const titleLower = task.title.toLowerCase();

  // Quick title check first - most common match case
  if (titleLower.includes(searchLower)) {
    return true;
  }

  // Only build full searchable text if title doesn't match
  // This avoids unnecessary string operations for most searches
  const searchableText = buildSearchableText(task);
  return searchWords.every(word => searchableText.includes(word));
}

/**
 * Optimized search for large datasets (>500 tasks)
 * Uses imperative loop instead of filter to reduce function call overhead
 * and allow for more aggressive early returns
 */
function performOptimizedSearch(tasks: Task[], searchLower: string, searchWords: string[]): Task[] {
  const results: Task[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    if (taskMatchesSearch(task, searchLower, searchWords)) {
      results.push(task);
    }
  }

  return results;
}

/**
 * Standard search for smaller datasets
 * Uses functional filter approach for cleaner code when performance isn't critical
 */
function performStandardSearch(tasks: Task[], searchLower: string, searchWords: string[]): Task[] {
  return tasks.filter(task => taskMatchesSearch(task, searchLower, searchWords));
}

/**
 * Searches tasks by matching against title, description, and tags
 * Automatically optimizes based on dataset size to prevent UI blocking
 *
 * Performance considerations:
 * - For large datasets (>500 tasks), uses imperative loop to reduce overhead
 * - Title is checked first as it's the most common match location
 * - Full searchable text is only built when title doesn't match
 * - Multi-word searches require all words to be present (AND logic)
 *
 * @param tasks - Array of tasks to search through
 * @param searchTerm - Search query string (case-insensitive, supports multi-word)
 * @returns Filtered array of tasks matching the search criteria
 */
export function searchTasks(tasks: Task[], searchTerm: string): Task[] {
  if (!searchTerm.trim()) {
    return tasks;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  const searchWords = searchLower.split(/\s+/);

  // Use optimized search for large datasets to prevent UI blocking
  const isLargeDataset = tasks.length > LARGE_DATASET_THRESHOLD;

  return isLargeDataset
    ? performOptimizedSearch(tasks, searchLower, searchWords)
    : performStandardSearch(tasks, searchLower, searchWords);
}
