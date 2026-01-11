/**
 * Main task store - Consolidated architecture
 * Simplified to 3 files for better maintainability:
 * - taskStore.ts (this file) - Main store with CRUD and validation
 * - taskStore.filters.ts - Filtering, search, and related operations
 * - taskStore.import.ts - Import/export operations
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskFilters, SearchState, SearchScope } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { sanitizeTaskData } from '@/lib/utils/security';
import { validateTaskIntegrity } from '@/lib/utils/taskValidation';
import { ExportData } from '@/lib/utils/exportImport';
import { type SearchCache } from '@/lib/utils/taskFiltering';

// Import from consolidated filter module
import {
  applyFiltersToTasks,
  createSetFilters,
  createSetBoardFilter,
  createSetCrossBoardSearch,
  createSetSearchQuery,
  createApplyFilters,
  createClearFilters,
  createClearSearch,
  createSetHighlightedTask,
  createNavigateToTaskBoard,
  createLoadSearchPreferences,
  createSaveSearchScope,
} from './taskStore.filters';

// Import from consolidated import module
import {
  createExportTasks,
  createImportTasks,
  createBulkAddTasks
} from './taskStore.import';

// ============================================================================
// State & Action Interfaces
// ============================================================================

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
  setHighlightedTask: (taskId: string | undefined) => void;
  clearSearch: () => void;
  navigateToTaskBoard: (taskId: string) => Promise<{ success: boolean; boardId?: string; error?: string }>;

  // Search preference integration
  loadSearchPreferences: () => Promise<void>;
  saveSearchScope: (scope: SearchScope) => Promise<void>;

  // Validation
  validateBoardAccess: (boardId: string) => Promise<boolean>;
  handleBoardDeletion: (deletedBoardId: string) => void;
  recoverFromSearchError: () => void;
  validateTaskIntegrity: (task: Task) => boolean;

  // Import/Export
  exportTasks: (options?: { includeArchived: boolean; boardIds?: string[] }) => ExportData;
  importTasks: (tasks: Task[]) => Promise<void>;
  bulkAddTasks: (tasks: Task[]) => Promise<void>;

  // Initialization
  initializeStore: () => Promise<void>;
}

// ============================================================================
// Initial State
// ============================================================================

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

// ============================================================================
// CRUD Operations (inline for simplicity)
// ============================================================================

function createAddTask(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ isLoading: true, error: null });

      const sanitizedData = sanitizeTaskData({
        title: taskData.title,
        description: taskData.description,
        tags: taskData.tags,
      });

      if (!sanitizedData.title.trim()) {
        throw new Error('Task title is required');
      }

      const newTask: Task = {
        ...taskData,
        ...sanitizedData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await taskDB.addTask(newTask);

      const { tasks, filters } = get();
      const updatedTasks = [...tasks, newTask];

      set({
        tasks: updatedTasks,
        filteredTasks: applyFiltersToTasks(updatedTasks, filters),
        isLoading: false,
        searchCache: new Map(),
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add task',
        isLoading: false
      });
    }
  };
}

function createUpdateTask(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async (taskId: string, updates: Partial<Task>) => {
    try {
      set({ isLoading: true, error: null });

      const task = get().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const updatedTask = { ...task, ...updates, updatedAt: new Date() };
      await taskDB.updateTask(updatedTask);

      const { tasks, filters } = get();
      const updatedTasks = tasks.map(t => t.id === taskId ? updatedTask : t);

      set({
        tasks: updatedTasks,
        filteredTasks: applyFiltersToTasks(updatedTasks, filters),
        isLoading: false,
        searchCache: new Map(),
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false
      });
    }
  };
}

function createDeleteTask(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async (taskId: string) => {
    try {
      set({ isLoading: true, error: null });
      await taskDB.deleteTask(taskId);

      const { tasks, filters } = get();
      const updatedTasks = tasks.filter(t => t.id !== taskId);

      set({
        tasks: updatedTasks,
        filteredTasks: applyFiltersToTasks(updatedTasks, filters),
        isLoading: false,
        searchCache: new Map(),
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false
      });
    }
  };
}

function createMoveTask(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async (taskId: string, newStatus: Task['status']) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = { status: newStatus, updatedAt: new Date() };

    if (newStatus === 'done') {
      updates.progress = 100;
      if (!task.completedAt) updates.completedAt = new Date();
    } else if (newStatus === 'in-progress') {
      if (task.status === 'todo') updates.progress = 0;
      updates.completedAt = undefined;
    } else if (newStatus === 'todo') {
      updates.progress = undefined;
      updates.completedAt = undefined;
    }

    try {
      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to move task' });
    }
  };
}

function createMoveTaskToBoard(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async (taskId: string, targetBoardId: string) => {
    try {
      set({ isLoading: true, error: null });

      const task = get().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      if (task.boardId === targetBoardId) throw new Error('Task is already on this board');

      await get().updateTask(taskId, { boardId: targetBoardId, updatedAt: new Date() });
      await get().applyFilters();
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to move task to board' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  };
}

function createArchiveTask(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async (taskId: string) => {
    try {
      await get().updateTask(taskId, { archivedAt: new Date(), updatedAt: new Date() });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to archive task' });
    }
  };
}

function createUnarchiveTask(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async (taskId: string) => {
    try {
      await get().updateTask(taskId, { archivedAt: undefined, updatedAt: new Date() });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to unarchive task' });
    }
  };
}

// ============================================================================
// Validation Operations (inline for simplicity)
// ============================================================================

function createValidateBoardAccess() {
  return async (boardId: string): Promise<boolean> => {
    try {
      const boards = await taskDB.getBoards();
      const board = boards.find(b => b.id === boardId);
      return board !== undefined && !board.archivedAt;
    } catch {
      return false;
    }
  };
}

function createHandleBoardDeletion(get: () => TaskState, set: (state: Partial<TaskState>) => void) {
  return (deletedBoardId: string) => {
    const { tasks, filters, filteredTasks } = get();

    try {
      const updatedTasks = tasks.filter(task => task.boardId !== deletedBoardId);
      const updatedFilteredTasks = filteredTasks.filter(task => task.boardId !== deletedBoardId);
      const updatedFilters = filters.boardId === deletedBoardId
        ? { ...filters, boardId: undefined }
        : filters;

      set({
        tasks: updatedTasks,
        filteredTasks: updatedFilteredTasks,
        filters: updatedFilters,
        error: null
      });
    } catch {
      set({ error: 'Failed to update tasks after board deletion. Please refresh the page.' });
    }
  };
}

function createRecoverFromSearchError(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return () => {
    try {
      set({
        filters: { ...get().filters, search: '' },
        isSearching: false,
        error: null,
      });
      void get().applyFilters();
    } catch {
      set({
        filteredTasks: get().tasks,
        filters: { search: '', tags: [], crossBoardSearch: false },
        isSearching: false,
        error: 'Search functionality temporarily unavailable. Please refresh the page.',
      });
    }
  };
}

function createInitializeStore(get: () => TaskState & TaskActions, set: (state: Partial<TaskState>) => void) {
  return async () => {
    try {
      set({ isLoading: true, error: null });

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

      set({ tasks: processedTasks, filteredTasks: processedTasks, isLoading: false });
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
// Store Definition
// ============================================================================

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

      // CRUD operations
      addTask: createAddTask(get, set),
      updateTask: createUpdateTask(get, set),
      deleteTask: createDeleteTask(get, set),
      moveTask: createMoveTask(get, set),
      moveTaskToBoard: createMoveTaskToBoard(get, set),
      archiveTask: createArchiveTask(get, set),
      unarchiveTask: createUnarchiveTask(get, set),

      // Filter operations (from taskStore.filters.ts)
      setFilters: createSetFilters(get, set),
      setBoardFilter: createSetBoardFilter(get, set),
      setCrossBoardSearch: createSetCrossBoardSearch(get, set),
      setSearchQuery: createSetSearchQuery(get, set),
      applyFilters: createApplyFilters(get, set),
      clearFilters: createClearFilters(get, set),
      clearSearch: createClearSearch(get, set),

      // Search operations (from taskStore.filters.ts)
      setHighlightedTask: createSetHighlightedTask(set),
      navigateToTaskBoard: createNavigateToTaskBoard(get, set),
      loadSearchPreferences: createLoadSearchPreferences(get, set),
      saveSearchScope: createSaveSearchScope(),

      // Import/Export operations (from taskStore.import.ts)
      exportTasks: createExportTasks(get),
      importTasks: createImportTasks(get, set),
      bulkAddTasks: createBulkAddTasks(get, set),

      // Validation operations
      validateBoardAccess: createValidateBoardAccess(),
      handleBoardDeletion: createHandleBoardDeletion(get, set),
      recoverFromSearchError: createRecoverFromSearchError(get, set),
      validateTaskIntegrity,
      initializeStore: createInitializeStore(get, set),
    })
  )
);
