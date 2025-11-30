/**
 * Task store actions - Re-exports from modular structure
 *
 * This file maintains backward compatibility by re-exporting from the
 * new modular structure in taskStore/actions/
 *
 * Module structure:
 * - taskStore/actions/types.ts - Type definitions and configuration
 * - taskStore/actions/helpers.ts - Filter application utilities
 * - taskStore/actions/crud.ts - CRUD operations
 * - taskStore/actions/filtering.ts - Filter management
 * - taskStore/actions/search.ts - Search navigation and preferences
 */

export {
  // Configuration
  SEARCH_DEBOUNCE_MS,

  // Types
  type TaskStoreState,
  type StoreSetter,
  type GlobalWithTimeout,

  // Helper functions
  applyFiltersToTasks,
  applyFiltersWithRecovery,
  handleFilterError,

  // CRUD operations
  createAddTask,
  createUpdateTask,
  createDeleteTask,
  createMoveTask,
  createMoveTaskToBoard,
  createArchiveTask,
  createUnarchiveTask,

  // Filter operations
  createSetFilters,
  createSetBoardFilter,
  createSetCrossBoardSearch,
  createSetSearchQuery,
  createApplyFilters,
  createClearFilters,
  createClearSearch,

  // Search operations
  createSetHighlightedTask,
  createNavigateToTaskBoard,
  createLoadSearchPreferences,
  createSaveSearchScope,
} from './taskStore/actions';
