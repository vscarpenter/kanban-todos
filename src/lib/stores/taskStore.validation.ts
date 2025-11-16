/**
 * Task store validation and error recovery operations
 * Handles board validation, data integrity, store initialization, and error recovery
 *
 * This file is kept separate from actions as it's less frequently modified
 * and focuses on data integrity and initialization concerns.
 */

import { Task, TaskFilters, SearchState } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { validateTaskIntegrity } from '@/lib/utils/taskValidation';

// ============================================================================
// Type Definitions
// ============================================================================

// Type for store state access
type ValidationStoreState = {
  tasks: Task[];
  filters: TaskFilters;
  filteredTasks: Task[];
  searchState: SearchState;
  error: string | null;
  applyFilters: () => Promise<void>;
  loadSearchPreferences: () => Promise<void>;
};

// Type for store setter - using any to avoid complex type inference issues
type StoreSetter = (state: any) => void;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates that a board exists and is not archived
 */
export function createValidateBoardAccess() {
  return async (boardId: string): Promise<boolean> => {
    try {
      const boards = await taskDB.getBoards();
      const board = boards.find(b => b.id === boardId);
      return board !== undefined && !board.archivedAt;
    } catch (error: unknown) {
      console.warn('Failed to validate board access:', error);
      return false;
    }
  };
}

/**
 * Handles board deletion by removing associated tasks from state
 * Cleans up filters and cache references
 */
export function createHandleBoardDeletion(
  get: () => ValidationStoreState,
  set: StoreSetter
) {
  return (deletedBoardId: string) => {
    const { tasks, filters, filteredTasks } = get();

    try {
      // Remove tasks from deleted board from current state
      const updatedTasks = tasks.filter(task => task.boardId !== deletedBoardId);
      const updatedFilteredTasks = filteredTasks.filter(task => task.boardId !== deletedBoardId);

      // Clear board filter if it was set to the deleted board
      const updatedFilters = filters.boardId === deletedBoardId
        ? { ...filters, boardId: undefined }
        : filters;

      // Clear search cache as it may contain references to deleted board
      set({
        tasks: updatedTasks,
        filteredTasks: updatedFilteredTasks,
        filters: updatedFilters,
        error: null
      } as Partial<ValidationStoreState>);

      console.info(`Cleaned up ${tasks.length - updatedTasks.length} tasks from deleted board ${deletedBoardId}`);
    } catch (error: unknown) {
      console.error('Failed to handle board deletion:', error);
      set({
        error: 'Failed to update tasks after board deletion. Please refresh the page.',
      });
    }
  };
}

/**
 * Recovers from search errors by resetting search state
 * Last resort recovery mechanism
 */
export function createRecoverFromSearchError(
  get: () => ValidationStoreState,
  set: StoreSetter
) {
  return () => {
    try {
      // Reset search state and clear problematic filters
      set((state: ValidationStoreState) => ({
        filters: {
          ...state.filters,
          search: '', // Clear search that might be causing issues
        },
        isSearching: false,
        error: null,
      } as Partial<ValidationStoreState>));

      // Reapply filters without search
      void get().applyFilters();

      console.info('Recovered from search error by clearing search filters');
    } catch (error: unknown) {
      console.error('Failed to recover from search error:', error);
      // Last resort: reset to minimal state
      set({
        filteredTasks: get().tasks,
        filters: {
          search: '',
          tags: [],
          crossBoardSearch: false,
        },
        isSearching: false,
        error: 'Search functionality temporarily unavailable. Please refresh the page.',
      } as Partial<ValidationStoreState>);
    }
  };
}

/**
 * Initializes the task store by loading data from database
 */
export function createInitializeStore(
  get: () => { loadSearchPreferences: () => Promise<void> },
  set: StoreSetter
) {
  return async () => {
    try {
      set({ isLoading: true, error: null });

      // Only initialize if we're in a browser environment
      if (typeof window === 'undefined') {
        set({ isLoading: false });
        return;
      }

      await taskDB.init();
      const tasks = await taskDB.getTasks();

      const processedTasks = tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        archivedAt: task.archivedAt ? new Date(task.archivedAt) : undefined,
      }));

      set({
        tasks: processedTasks,
        filteredTasks: processedTasks,
        isLoading: false
      });

      // Load search preferences after initializing tasks
      await get().loadSearchPreferences();
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize store',
        isLoading: false
      });
    }
  };
}

// ============================================================================
// Re-exports
// ============================================================================

// Re-export the validation function for use in the main store
export { validateTaskIntegrity };
