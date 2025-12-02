/**
 * Type definitions and configuration for task store actions
 */

import { Task, TaskFilters, SearchState } from '@/lib/types';
import type { SearchCache } from '@/lib/utils/taskFiltering';

// ============================================================================
// Configuration
// ============================================================================

export const SEARCH_DEBOUNCE_MS = 300;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Type for store state access - defines the shape of TaskStore state
 */
export type TaskStoreState = {
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
  saveSearchScope: (scope: 'current-board' | 'all-boards') => Promise<void>;
};

/**
 * Type for store setter - using any to avoid complex type inference issues
 * This is a pragmatic choice documented in the codebase
 */
export type StoreSetter = (state: any) => void;

/**
 * Type definition for global timeout handling
 * Used for search debouncing across the application
 */
export interface GlobalWithTimeout {
  __searchTimeout?: NodeJS.Timeout;
}
