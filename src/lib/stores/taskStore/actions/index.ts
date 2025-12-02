/**
 * Task store actions - consolidated exports
 *
 * This module organizes task operations into focused sub-modules:
 * - types: Type definitions and configuration
 * - helpers: Filter application utilities
 * - crud: Create, read, update, delete, move, archive operations
 * - filtering: Filter management and application
 * - search: Search navigation and preferences
 */

// Re-export types and configuration
export { SEARCH_DEBOUNCE_MS } from './types';
export type { TaskStoreState, StoreSetter, GlobalWithTimeout } from './types';

// Re-export helper functions
export { applyFiltersToTasks, applyFiltersWithRecovery, handleFilterError } from './helpers';

// Re-export CRUD operations
export {
  createAddTask,
  createUpdateTask,
  createDeleteTask,
  createMoveTask,
  createMoveTaskToBoard,
  createArchiveTask,
  createUnarchiveTask,
} from './crud';

// Re-export filter operations
export {
  createSetFilters,
  createSetBoardFilter,
  createSetCrossBoardSearch,
  createSetSearchQuery,
  createApplyFilters,
  createClearFilters,
  createClearSearch,
} from './filtering';

// Re-export search operations
export {
  createSetHighlightedTask,
  createNavigateToTaskBoard,
  createLoadSearchPreferences,
  createSaveSearchScope,
} from './search';
