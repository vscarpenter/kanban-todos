import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskFilters, SearchState, SearchScope } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportTasks, ExportData } from '@/lib/utils/exportImport';
import { sanitizeTaskData, sanitizeSearchQuery, searchRateLimiter } from '@/lib/utils/security';
import { searchTasks } from '@/lib/utils/taskSearch';
import { validateTaskIntegrity } from '@/lib/utils/taskValidation';
import {
  validateTasks,
  validateBoardAccess,
  generateCacheKey,
  checkCache,
  cacheResults,
  cleanupExpiredCache,
  isComplexSearch,
  type SearchCache
} from '@/lib/utils/taskFiltering';

// Type definition for global timeout handling
interface GlobalWithTimeout {
  __searchTimeout?: NodeJS.Timeout;
}

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
  applyFilters: () => void;
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

// Search configuration
const SEARCH_DEBOUNCE_MS = 300;

// Helper functions for applyFilters

/**
 * Applies filters with error recovery fallback
 */
async function applyFiltersWithRecovery(
  tasks: Task[],
  filters: TaskFilters,
  get: () => TaskState & TaskActions,
  set: (state: Partial<TaskState>) => void
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
 */
function handleFilterError(
  get: () => TaskState & TaskActions,
  set: (state: Partial<TaskState>) => void
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

// Helper function to apply filters to a task list with performance optimizations
const applyFiltersToTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
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
};

export const useTaskStore = create<TaskState & TaskActions>()(
  devtools(
    (set, get) => ({
        ...initialState,

        setTasks: (tasks) => set({ tasks, searchCache: new Map() }),
        setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),
        setFilters: (filters) => {
          set((state) => ({ 
            filters: { ...state.filters, ...filters } 
          }));
          get().applyFilters();
        },
        setBoardFilter: (boardId) => {
          set((state) => ({
            filters: { ...state.filters, boardId: boardId || undefined }
          }));
          get().applyFilters();
        },
        setCrossBoardSearch: (enabled) => {
          set((state) => ({
            filters: { ...state.filters, crossBoardSearch: enabled },
            searchState: { 
              ...state.searchState, 
              scope: enabled ? 'all-boards' : 'current-board' 
            }
          }));
          get().applyFilters();
          
          // Save the scope preference if remember is enabled
          get().saveSearchScope(enabled ? 'all-boards' : 'current-board');
        },
        setSearchQuery: (query) => {
          // Sanitize search query
          const sanitizedQuery = sanitizeSearchQuery(query);
          
          // Rate limiting for search operations
          if (sanitizedQuery.trim() && !searchRateLimiter.isAllowed('search')) {
            set({ 
              error: 'Search rate limit exceeded. Please wait a moment before searching again.',
              isSearching: false 
            });
            return;
          }

          set((state) => ({
            filters: { ...state.filters, search: sanitizedQuery }
          }));
          
          // Clear any existing timeout
          if ((globalThis as GlobalWithTimeout).__searchTimeout) {
            clearTimeout((globalThis as GlobalWithTimeout).__searchTimeout);
          }
          
          // Show loading state for non-empty searches
          if (sanitizedQuery.trim()) {
            set({ isSearching: true, error: null });
          } else {
            // Clear search immediately for empty queries
            set({ isSearching: false });
            get().applyFilters();
            return;
          }
          
          // Debounce the filter application for search
          const timeoutId = setTimeout(async () => {
            try {
              await get().applyFilters();
              
            } catch (error: unknown) {
              console.error('Search operation failed:', error);
              set({ 
                error: error instanceof Error ? error.message : 'Search failed',
                isSearching: false 
              });
            }
          }, SEARCH_DEBOUNCE_MS);
          
          (globalThis as GlobalWithTimeout).__searchTimeout = timeoutId;
        },
        setLoading: (isLoading) => set({ isLoading }),
        setSearching: (isSearching) => set({ isSearching }),
        setError: (error) => set({ error }),
        clearSearchCache: () => set({ searchCache: new Map() }),

        addTask: async (taskData) => {
          try {
            set({ isLoading: true, error: null });
            
            // Sanitize and validate input data
            const sanitizedData = sanitizeTaskData({
              title: taskData.title,
              description: taskData.description,
              tags: taskData.tags,
            });

            // Validate required fields
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
            const filteredTasks = applyFiltersToTasks(updatedTasks, filters);
            
            set({
              tasks: updatedTasks,
              filteredTasks: filteredTasks,
              isLoading: false,
              searchCache: new Map(), // Clear cache when tasks change
            });
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to add task',
              isLoading: false 
            });
          }
        },

        updateTask: async (taskId, updates) => {
          try {
            set({ isLoading: true, error: null });
            
            const updatedTask = {
              ...get().tasks.find(t => t.id === taskId)!,
              ...updates,
              updatedAt: new Date(),
            };

            await taskDB.updateTask(updatedTask);
            
            const { tasks, filters } = get();
            const updatedTasks = tasks.map(t => 
              t.id === taskId ? updatedTask : t
            );
            const filteredTasks = applyFiltersToTasks(updatedTasks, filters);
            
            set({
              tasks: updatedTasks,
              filteredTasks: filteredTasks,
              isLoading: false,
              searchCache: new Map(), // Clear cache when tasks change
            });
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update task',
              isLoading: false 
            });
          }
        },

        deleteTask: async (taskId) => {
          try {
            set({ isLoading: true, error: null });
            
            await taskDB.deleteTask(taskId);
            
            const { tasks, filters } = get();
            const updatedTasks = tasks.filter(t => t.id !== taskId);
            const filteredTasks = applyFiltersToTasks(updatedTasks, filters);
            
            set({
              tasks: updatedTasks,
              filteredTasks: filteredTasks,
              isLoading: false,
              searchCache: new Map(), // Clear cache when tasks change
            });
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete task',
              isLoading: false 
            });
          }
        },

        moveTask: async (taskId, newStatus) => {
          try {
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) return;

            const updates: Partial<Task> = {
              status: newStatus,
              updatedAt: new Date(),
            };

            // Handle progress tracking based on status
            if (newStatus === 'done') {
              updates.progress = 100;
              if (!task.completedAt) {
                updates.completedAt = new Date();
              }
            } else if (newStatus === 'in-progress') {
              // Keep existing progress or set to 0 if moving from todo
              if (task.status === 'todo') {
                updates.progress = 0;
              }
              updates.completedAt = undefined;
            } else if (newStatus === 'todo') {
              // Clear progress when moving back to todo
              updates.progress = undefined;
              updates.completedAt = undefined;
            }

            await get().updateTask(taskId, updates);
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to move task'
            });
          }
        },

        moveTaskToBoard: async (taskId, targetBoardId) => {
          try {
            set({ isLoading: true, error: null });
            
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) {
              throw new Error('Task not found');
            }

            if (task.boardId === targetBoardId) {
              throw new Error('Task is already on this board');
            }

            const updates: Partial<Task> = {
              boardId: targetBoardId,
              updatedAt: new Date(),
            };

            await get().updateTask(taskId, updates);
            
            // Refresh filtered tasks to reflect board change
            get().applyFilters();
            
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to move task to board'
            });
            throw error; // Re-throw so UI can handle it
          } finally {
            set({ isLoading: false });
          }
        },

        archiveTask: async (taskId) => {
          try {
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) return;

            const updates: Partial<Task> = {
              archivedAt: new Date(),
              updatedAt: new Date(),
            };

            await get().updateTask(taskId, updates);
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to archive task'
            });
          }
        },

        unarchiveTask: async (taskId) => {
          try {
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) return;

            const updates: Partial<Task> = {
              archivedAt: undefined,
              updatedAt: new Date(),
            };

            await get().updateTask(taskId, updates);
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to unarchive task'
            });
          }
        },

        applyFilters: async () => {
          const { tasks, filters, searchCache } = get();

          try {
            // Prevent runtime errors from corrupted IndexedDB data
            // Users occasionally experience data corruption from browser crashes or storage limits
            let validTasks = validateTasks(tasks, get().validateTaskIntegrity);
            if (validTasks.length !== tasks.length) {
              set({ tasks: validTasks });
            }

            // Filter out tasks from deleted/archived boards to prevent UI errors
            // Cross-board search may reference boards that no longer exist
            if (filters.crossBoardSearch) {
              validTasks = await validateBoardAccess(validTasks);
              if (validTasks.length !== tasks.length) {
                set({ tasks: validTasks });
              }
            }

            // Prevent unnecessary re-filtering when users toggle between same searches
            // Users often search for same terms repeatedly (e.g., "urgent", "bug", "login")
            const cacheKey = generateCacheKey(filters);
            if (filters.search) {
              const cachedResults = checkCache(cacheKey, searchCache, get().tasks);
              if (cachedResults) {
                set({ filteredTasks: cachedResults, isSearching: false, error: null });
                return;
              }
            }

            // Provide visual feedback for searches that will block UI thread >50ms
            // Without loading state, complex searches feel unresponsive to users
            const currentTasks = get().tasks;
            if (isComplexSearch(currentTasks, filters) && !get().isSearching) {
              set({ isSearching: true });
              await new Promise(resolve => setTimeout(resolve, 0));
            }

            // Gracefully degrade to simplified filters if primary filtering fails
            // Better to show partial results than a blank screen after search errors
            let filteredTasks = await applyFiltersWithRecovery(currentTasks, filters, get, set);

            // Remove any corrupted tasks that slipped through initial validation
            // Additional validation after filtering catches edge cases
            filteredTasks = validateTasks(filteredTasks, get().validateTaskIntegrity);

            // Cache results to speed up repeated searches (instant vs 50-200ms)
            // Skip caching for huge result sets (>1000) to avoid memory bloat
            if (filters.search && filteredTasks.length > 0 && filteredTasks.length < 1000) {
              cacheResults(cacheKey, filteredTasks, searchCache);
            }

            // Prevent memory leaks from expired cache entries accumulating over time
            // Probabilistic cleanup (10%) balances performance vs memory usage
            if (Math.random() < 0.1) {
              cleanupExpiredCache(searchCache);
            }

            set({
              filteredTasks,
              isSearching: false,
              error: get().error,
              searchCache
            });

          } catch (error: unknown) {
            console.error('Filter application failed:', error);
            handleFilterError(get, set);
          }
        },

        clearFilters: () => {
          const { filters } = get();
          set({ 
            filters: { 
              search: '', 
              tags: [],
              boardId: filters.boardId, // Keep board filter when clearing other filters
              crossBoardSearch: filters.crossBoardSearch // Keep cross-board search setting
            }
          });
          get().applyFilters();
        },

        // Search state management
        setHighlightedTask: (taskId) => {
          set((state) => ({
            searchState: { ...state.searchState, highlightedTaskId: taskId }
          }));
        },

        clearSearch: () => {
          set((state) => ({
            filters: { ...state.filters, search: '' },
            searchState: { ...state.searchState, highlightedTaskId: undefined }
          }));
          get().applyFilters();
        },

        navigateToTaskBoard: async (taskId: string) => {
          try {
            const { tasks } = get();
            const task = tasks.find(t => t.id === taskId);
            
            if (!task) {
              return { 
                success: false, 
                error: 'Task not found. It may have been deleted.' 
              };
            }
            
            // Validate that the board still exists
            const boardExists = await get().validateBoardAccess(task.boardId);
            if (!boardExists) {
              return { 
                success: false, 
                error: 'The board containing this task no longer exists or has been archived.' 
              };
            }
            
            // Set the highlighted task for navigation
            set((state) => ({
              searchState: { ...state.searchState, highlightedTaskId: taskId }
            }));
            
            return { 
              success: true, 
              boardId: task.boardId 
            };
            
          } catch (error: unknown) {
            console.error('Navigation to task board failed:', error);
            return { 
              success: false, 
              error: 'Failed to navigate to task. Please try again.' 
            };
          }
        },

        // Search preference integration
        loadSearchPreferences: async () => {
          try {
            const settings = await taskDB.getSettings();
            if (settings?.searchPreferences) {
              const { defaultScope } = settings.searchPreferences;
              const crossBoardSearch = defaultScope === 'all-boards';
              
              set((state) => ({
                filters: { ...state.filters, crossBoardSearch },
                searchState: { ...state.searchState, scope: defaultScope }
              }));
            }
          } catch (error: unknown) {
            console.warn('Failed to load search preferences:', error);
          }
        },

        saveSearchScope: async (scope) => {
          try {
            const settings = await taskDB.getSettings();
            if (settings?.searchPreferences?.rememberScope) {
              const updatedSettings = {
                ...settings,
                searchPreferences: {
                  ...settings.searchPreferences,
                  defaultScope: scope,
                },
              };
              await taskDB.updateSettings(updatedSettings);
            }
          } catch (error: unknown) {
            console.warn('Failed to save search scope preference:', error);
          }
        },

        // Error handling and validation
        validateBoardAccess: async (boardId: string): Promise<boolean> => {
          try {
            const boards = await taskDB.getBoards();
            const board = boards.find(b => b.id === boardId);
            return board !== undefined && !board.archivedAt;
          } catch (error: unknown) {
            console.warn('Failed to validate board access:', error);
            return false;
          }
        },

        handleBoardDeletion: (deletedBoardId: string) => {
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
              searchCache: new Map(),
              error: null
            });
            
            console.info(`Cleaned up ${tasks.length - updatedTasks.length} tasks from deleted board ${deletedBoardId}`);
          } catch (error: unknown) {
            console.error('Failed to handle board deletion:', error);
            set({ 
              error: 'Failed to update tasks after board deletion. Please refresh the page.',
            });
          }
        },

        recoverFromSearchError: () => {
          try {
            // Reset search state and clear problematic filters
            set((state) => ({
              filters: {
                ...state.filters,
                search: '', // Clear search that might be causing issues
              },
              isSearching: false,
              error: null,
              searchCache: new Map(), // Clear potentially corrupted cache
            }));
            
            // Reapply filters without search
            get().applyFilters();
            
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
              searchCache: new Map(),
            });
          }
        },

        validateTaskIntegrity,

        // Export/Import operations
        exportTasks: (options = { includeArchived: true }) => {
          const { tasks } = get();
          return exportTasks(tasks, options);
        },

        importTasks: async (tasks: Task[]) => {
          try {
            set({ isLoading: true, error: null });
            
            const { tasks: existingTasks } = get();
            const existingIds = new Set(existingTasks.map(t => t.id));
            
            // Add or update tasks in database
            for (const task of tasks) {
              if (existingIds.has(task.id)) {
                // Update existing task
                await taskDB.updateTask(task);
              } else {
                // Add new task
                await taskDB.addTask(task);
              }
            }
            
            // Update store state
            set((state) => {
              const taskMap = new Map(state.tasks.map(t => [t.id, t]));
              
              // Add or update imported tasks
              tasks.forEach(task => {
                taskMap.set(task.id, task);
              });
              
              return {
                tasks: Array.from(taskMap.values()),
                isLoading: false,
              };
            });
            
            // Reapply filters after import
            get().applyFilters();
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to import tasks',
              isLoading: false 
            });
            throw error;
          }
        },

        bulkAddTasks: async (tasks: Task[]) => {
          try {
            set({ isLoading: true, error: null });
            
            // Process tasks in batches to avoid overwhelming the database
            const batchSize = 50;
            const batches = [];
            for (let i = 0; i < tasks.length; i += batchSize) {
              batches.push(tasks.slice(i, i + batchSize));
            }
            
            for (const batch of batches) {
              await Promise.all(batch.map(task => taskDB.addTask(task)));
            }
            
            // Update store state
            set((state) => ({
              tasks: [...state.tasks, ...tasks],
              isLoading: false,
            }));
            
            // Reapply filters after bulk add
            get().applyFilters();
          } catch (error: unknown) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to bulk add tasks',
              isLoading: false 
            });
            throw error;
          }
        },

        initializeStore: async () => {
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
        },
      })
    )
);
