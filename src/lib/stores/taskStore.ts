import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskFilters, SearchState, SearchScope } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportTasks, ExportData } from '@/lib/utils/exportImport';
import { sanitizeTaskData, sanitizeSearchQuery, searchRateLimiter } from '@/lib/utils/security';

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
  searchCache: Map<string, { results: Task[]; timestamp: number }>;
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

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

// Generate cache key for search filters
const generateCacheKey = (filters: TaskFilters): string => {
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
};

// Optimized search function with early returns and efficient filtering
const searchTasks = (tasks: Task[], searchTerm: string): Task[] => {
  if (!searchTerm.trim()) return tasks;
  
  const searchLower = searchTerm.toLowerCase().trim();
  const searchWords = searchLower.split(/\s+/);
  
  // Use a more efficient filtering approach for large datasets
  if (tasks.length > 500) {
    const results: Task[] = [];
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const titleLower = task.title.toLowerCase();
      
      // Quick title check first (most common match)
      if (titleLower.includes(searchLower)) {
        results.push(task);
        continue;
      }
      
      // Only build searchable text if title doesn't match
      const searchableText = [
        titleLower,
        task.description?.toLowerCase() || '',
        ...task.tags.map(tag => tag.toLowerCase())
      ].join(' ');
      
      if (searchWords.every(word => searchableText.includes(word))) {
        results.push(task);
      }
    }
    
    return results;
  }
  
  // Use standard filter for smaller datasets
  return tasks.filter(task => {
    // Quick title check first (most common match)
    const titleLower = task.title.toLowerCase();
    if (titleLower.includes(searchLower)) return true;
    
    // Check if all search words are present in title, description, or tags
    const searchableText = [
      titleLower,
      task.description?.toLowerCase() || '',
      ...task.tags.map(tag => tag.toLowerCase())
    ].join(' ');
    
    return searchWords.every(word => searchableText.includes(word));
  });
};

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
            // Validate tasks integrity before filtering
            const validTasks = tasks.filter(task => get().validateTaskIntegrity(task));
            if (validTasks.length !== tasks.length) {
              console.warn(`Filtered out ${tasks.length - validTasks.length} invalid tasks`);
              set({ tasks: validTasks });
            }
            
            // For cross-board search, validate board access
            if (filters.crossBoardSearch) {
              try {
                const boards = await taskDB.getBoards();
                const validBoardIds = new Set(boards.filter(b => !b.archivedAt).map(b => b.id));
                
                // Filter out tasks from deleted or archived boards
                const accessibleTasks = validTasks.filter(task => validBoardIds.has(task.boardId));
                if (accessibleTasks.length !== validTasks.length) {
                  console.info(`Filtered out ${validTasks.length - accessibleTasks.length} tasks from inaccessible boards`);
                  set({ tasks: accessibleTasks });
                }
              } catch (boardError: unknown) {
                console.warn('Failed to validate board access, proceeding with existing tasks:', boardError);
              }
            }
            
            // Generate cache key
            const cacheKey = generateCacheKey(filters);
            const now = Date.now();
            
            // Check cache first for search queries
            if (filters.search && searchCache.has(cacheKey)) {
              const cached = searchCache.get(cacheKey)!;
              if (now - cached.timestamp < CACHE_TTL) {
                // Validate cached results still exist in current tasks
                const currentTaskIds = new Set(get().tasks.map(t => t.id));
                const validCachedResults = cached.results.filter(task => currentTaskIds.has(task.id));
                
                if (validCachedResults.length === cached.results.length) {
                  set({ 
                    filteredTasks: validCachedResults,
                    isSearching: false,
                    error: null 
                  });
                  return;
                } else {
                  // Cache is stale, remove it
                  searchCache.delete(cacheKey);
                }
              } else {
                // Remove expired cache entry
                searchCache.delete(cacheKey);
              }
            }
            
            // Show loading state for large datasets or complex searches
            const currentTasks = get().tasks; // Get updated tasks after validation
            const isComplexSearch = filters.search && (
              currentTasks.length > 200 || 
              filters.crossBoardSearch ||
              (filters.tags && filters.tags.length > 0) ||
              filters.dateRange
            );
            
            if (isComplexSearch && !get().isSearching) {
              set({ isSearching: true });
              // Allow UI to update before heavy computation
              await new Promise(resolve => setTimeout(resolve, 0));
            }
            
            // Apply filters with error handling
            let filteredTasks: Task[] = [];
            
            try {
              filteredTasks = applyFiltersToTasks(currentTasks, filters);
            } catch (filterError: unknown) {
              console.error('Filter operation failed:', filterError);
              
              // Attempt recovery with simplified filters
              const simplifiedFilters = { ...filters, search: '', tags: [] };
              try {
                filteredTasks = applyFiltersToTasks(currentTasks, simplifiedFilters);
                set({ 
                  error: 'Search temporarily simplified due to an error. Please try again.',
                  filters: simplifiedFilters
                });
              } catch (recoveryError: unknown) {
                console.error('Filter recovery failed:', recoveryError);
                // Last resort: show all tasks
                filteredTasks = currentTasks;
                set({ 
                  error: 'Filter operation failed. Showing all tasks.',
                  filters: { search: '', tags: [], crossBoardSearch: filters.crossBoardSearch }
                });
              }
            }
            
            
            // Validate filtered results
            const validFilteredTasks = filteredTasks.filter(task => get().validateTaskIntegrity(task));
            if (validFilteredTasks.length !== filteredTasks.length) {
              console.warn(`Filtered out ${filteredTasks.length - validFilteredTasks.length} invalid tasks from results`);
            }
            
            // Cache search results if there's a search query and results are reasonable
            if (filters.search && validFilteredTasks.length > 0 && validFilteredTasks.length < 1000) {
              try {
                // Clean up old cache entries if we're at max size
                if (searchCache.size >= MAX_CACHE_SIZE) {
                  // Remove oldest entries (FIFO)
                  const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2); // Remove 20% of entries
                  const keys = Array.from(searchCache.keys());
                  for (let i = 0; i < entriesToRemove; i++) {
                    searchCache.delete(keys[i]);
                  }
                }
                
                searchCache.set(cacheKey, {
                  results: validFilteredTasks,
                  timestamp: now
                });
              } catch (cacheError: unknown) {
                console.warn('Failed to cache search results:', cacheError);
                // Clear cache if it's corrupted
                searchCache.clear();
              }
            }
            
            // Clean up expired cache entries periodically
            if (Math.random() < 0.1) { // 10% chance to clean up
              try {
                for (const [key, value] of searchCache.entries()) {
                  if (now - value.timestamp > CACHE_TTL) {
                    searchCache.delete(key);
                  }
                }
              } catch (cleanupError: unknown) {
                console.warn('Cache cleanup failed:', cleanupError);
              }
            }
            
            set({ 
              filteredTasks: validFilteredTasks,
              isSearching: false,
              error: get().error, // Preserve any error messages from recovery attempts
              searchCache
            });
            
          } catch (error: unknown) {
            console.error('Filter application failed:', error);
            
            // Attempt graceful recovery
            try {
              get().recoverFromSearchError();
            } catch (recoveryError: unknown) {
              console.error('Recovery from filter error failed:', recoveryError);
              set({ 
                error: 'Search functionality is temporarily unavailable. Please refresh the page.',
                isSearching: false,
                filteredTasks: get().tasks // Show all tasks as fallback
              });
            }
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

        validateTaskIntegrity: (task: Task): boolean => {
          try {
            // Check required fields
            if (!task.id || !task.title || !task.boardId) {
              console.warn('Task missing required fields:', task);
              return false;
            }
            
            // Check data types
            if (typeof task.id !== 'string' || typeof task.title !== 'string' || typeof task.boardId !== 'string') {
              console.warn('Task has invalid field types:', task);
              return false;
            }
            
            // Check dates
            if (!(task.createdAt instanceof Date) || !(task.updatedAt instanceof Date)) {
              console.warn('Task has invalid date fields:', task);
              return false;
            }
            
            // Check status and priority values
            const validStatuses = ['todo', 'in-progress', 'done'];
            const validPriorities = ['low', 'medium', 'high'];
            
            if (!validStatuses.includes(task.status)) {
              console.warn('Task has invalid status:', task);
              return false;
            }
            
            if (task.priority && !validPriorities.includes(task.priority)) {
              console.warn('Task has invalid priority:', task);
              return false;
            }
            
            // Check tags array
            if (!Array.isArray(task.tags)) {
              console.warn('Task tags is not an array:', task);
              return false;
            }
            
            return true;
          } catch (error: unknown) {
            console.error('Error validating task integrity:', error);
            return false;
          }
        },

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
