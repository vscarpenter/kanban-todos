/**
 * Main task store - Composition of focused modules
 * Maintains backward compatibility while improving internal organization
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskFilters, SearchState, SearchScope } from '@/lib/types';
import { ExportData } from '@/lib/utils/exportImport';
import { type SearchCache } from '@/lib/utils/taskFiltering';

// Import action creators from focused modules
import {
  createAddTask,
  createUpdateTask,
  createDeleteTask,
  createMoveTask,
  createMoveTaskToBoard,
  createArchiveTask,
  createUnarchiveTask
} from './taskStoreActions';

import {
  createSetFilters,
  createSetBoardFilter,
  createSetCrossBoardSearch,
  createSetSearchQuery,
  createApplyFilters,
  createClearFilters,
  createClearSearch
} from './taskStoreFilters';

import {
  createSetHighlightedTask,
  createNavigateToTaskBoard,
  createLoadSearchPreferences,
  createSaveSearchScope
} from './taskStoreSearch';

import {
  createExportTasks,
  createImportTasks,
  createBulkAddTasks
} from './taskStoreImportExport';

import {
  createValidateBoardAccess,
  createHandleBoardDeletion,
  createRecoverFromSearchError,
  createInitializeStore,
  validateTaskIntegrity
} from './taskStoreValidation';

// State interface
interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  searchState: SearchState;
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  searchCache: SearchCache;
}

// Actions interface
interface TaskActions {
  // State management
  setTasks: (tasks: Task[]) => void;
  setFilteredTasks: (tasks: Task[]) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setBoardFilter: (boardId: string | null) => void;
  setCrossBoardSearch: (enabled: boolean) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setError: (error: string | null) => void;
  clearSearchCache: () => void;

  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: Task['status']) => Promise<void>;
  moveTaskToBoard: (taskId: string, targetBoardId: string) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  unarchiveTask: (taskId: string) => Promise<void>;

  // Filtering and search
  applyFilters: () => Promise<void>;
  clearFilters: () => void;

  // Search state management
  setHighlightedTask: (taskId: string | undefined) => void;
  clearSearch: () => void;
  navigateToTaskBoard: (taskId: string) => Promise<{ success: boolean; boardId?: string; error?: string }>;

  // Search preference integration
  loadSearchPreferences: () => Promise<void>;
  saveSearchScope: (scope: SearchScope) => Promise<void>;

  // Error handling and validation
  validateBoardAccess: (boardId: string) => Promise<boolean>;
  handleBoardDeletion: (deletedBoardId: string) => void;
  recoverFromSearchError: () => void;
  validateTaskIntegrity: (task: Task) => boolean;

  // Import/Export operations
  exportTasks: (options?: { includeArchived: boolean; boardIds?: string[] }) => ExportData;
  importTasks: (tasks: Task[]) => Promise<void>;
  bulkAddTasks: (tasks: Task[]) => Promise<void>;

  // Store initialization
  initializeStore: () => Promise<void>;
}

const initialState: TaskState = {
  tasks: [],
  filteredTasks: [],
  filters: {
    search: '',
    tags: [],
    crossBoardSearch: false,
  },
  searchState: {
    scope: 'current-board',
    highlightedTaskId: undefined,
  },
  isLoading: false,
  isSearching: false,
  error: null,
  searchCache: new Map(),
};

/**
 * Main task store
 * Composed from focused modules for better maintainability
 */
export const useTaskStore = create<TaskState & TaskActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Simple setters
      setTasks: (tasks) => set({ tasks, searchCache: new Map() }),
      setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),
      setLoading: (isLoading) => set({ isLoading }),
      setSearching: (isSearching) => set({ isSearching }),
      setError: (error) => set({ error }),
      clearSearchCache: () => set({ searchCache: new Map() }),

      // CRUD operations (from taskStoreActions)
      addTask: createAddTask(get, set),
      updateTask: createUpdateTask(get, set),
      deleteTask: createDeleteTask(get, set),
      moveTask: createMoveTask(get, set),
      moveTaskToBoard: createMoveTaskToBoard(get, set),
      archiveTask: createArchiveTask(get, set),
      unarchiveTask: createUnarchiveTask(get, set),

      // Filter operations (from taskStoreFilters)
      setFilters: createSetFilters(get, set),
      setBoardFilter: createSetBoardFilter(get, set),
      setCrossBoardSearch: createSetCrossBoardSearch(get, set),
      setSearchQuery: createSetSearchQuery(get, set),
      applyFilters: createApplyFilters(get, set),
      clearFilters: createClearFilters(get, set),
      clearSearch: createClearSearch(get, set),

      // Search operations (from taskStoreSearch)
      setHighlightedTask: createSetHighlightedTask(set),
      navigateToTaskBoard: createNavigateToTaskBoard(get, set),
      loadSearchPreferences: createLoadSearchPreferences(get, set),
      saveSearchScope: createSaveSearchScope(),

      // Import/Export operations (from taskStoreImportExport)
      exportTasks: createExportTasks(get),
      importTasks: createImportTasks(get, set),
      bulkAddTasks: createBulkAddTasks(get, set),

      // Validation and error handling (from taskStoreValidation)
      validateBoardAccess: createValidateBoardAccess(),
      handleBoardDeletion: createHandleBoardDeletion(get, set),
      recoverFromSearchError: createRecoverFromSearchError(get, set),
      validateTaskIntegrity,
      initializeStore: createInitializeStore(get, set),
    })
  )
);
