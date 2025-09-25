import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskFilters, SearchState, SearchScope } from '@/lib/types';

interface TaskSearchState {
  filteredTasks: Task[];
  filters: TaskFilters;
  searchState: SearchState;
  isSearching: boolean;
  searchCache: Map<string, { results: Task[]; timestamp: number }>;
}

interface TaskSearchActions {
  // Filtering and search
  setFilteredTasks: (tasks: Task[]) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setBoardFilter: (boardId: string | undefined) => void;
  setCrossBoardSearch: (enabled: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearching: (searching: boolean) => void;
  clearSearchCache: () => void;
  applyFilters: (allTasks: Task[]) => void;
  clearFilters: () => void;
  clearSearch: () => void;

  // Search state management
  setHighlightedTask: (taskId: string | undefined) => void;
  navigateToTaskBoard: (taskId: string) => Promise<{ success: boolean; boardId?: string; error?: string }>;

  // Search preferences
  loadSearchPreferences: () => Promise<void>;
  saveSearchScope: (scope: SearchScope) => Promise<void>;
}

const initialState: TaskSearchState = {
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
  isSearching: false,
  searchCache: new Map(),
};


// Simple search function
const searchTasks = (tasks: Task[], searchTerm: string): Task[] => {
  if (!searchTerm.trim()) return tasks;

  const searchLower = searchTerm.toLowerCase().trim();
  return tasks.filter(task => {
    const titleMatch = task.title.toLowerCase().includes(searchLower);
    const descMatch = task.description?.toLowerCase().includes(searchLower) || false;
    const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(searchLower));
    return titleMatch || descMatch || tagMatch;
  });
};

// Apply filters to tasks
const applyFiltersToTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  let filteredTasks = tasks;

  // Filter by board (if not cross-board search)
  if (filters.boardId && !filters.crossBoardSearch) {
    filteredTasks = filteredTasks.filter(task => task.boardId === filters.boardId);
  }

  // Filter by status
  if (filters.status) {
    filteredTasks = filteredTasks.filter(task => task.status === filters.status);
  }

  // Filter by priority
  if (filters.priority) {
    filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
  }

  // Filter by tags
  if (filters.tags.length > 0) {
    const filterTags = new Set(filters.tags);
    filteredTasks = filteredTasks.filter(task =>
      task.tags.some(tag => filterTags.has(tag))
    );
  }

  // Apply search
  if (filters.search) {
    filteredTasks = searchTasks(filteredTasks, filters.search);
  }

  return filteredTasks;
};

export const useTaskSearchStore = create<TaskSearchState & TaskSearchActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),

      setFilters: (newFilters) => {
        set(state => ({ filters: { ...state.filters, ...newFilters } }));
      },

      setBoardFilter: (boardId) => {
        set(state => ({
          filters: { ...state.filters, boardId }
        }));
      },

      setCrossBoardSearch: (enabled) => {
        set(state => ({
          filters: { ...state.filters, crossBoardSearch: enabled }
        }));
      },

      setSearchQuery: (query) => {
        set(state => ({
          filters: { ...state.filters, search: query }
        }));
      },

      setSearching: (searching) => set({ isSearching: searching }),

      clearSearchCache: () => set({ searchCache: new Map() }),

      applyFilters: (allTasks) => {
        const { filters } = get();
        const filteredTasks = applyFiltersToTasks(allTasks, filters);
        set({ filteredTasks });
      },

      clearFilters: () => {
        set({
          filters: {
            search: '',
            tags: [],
            crossBoardSearch: false,
          },
          filteredTasks: [],
        });
      },

      clearSearch: () => {
        set(state => ({
          filters: { ...state.filters, search: '' },
          searchState: {
            ...state.searchState,
            highlightedTaskId: undefined,
          }
        }));
      },

      setHighlightedTask: (taskId) => {
        set(state => ({
          searchState: {
            ...state.searchState,
            highlightedTaskId: taskId,
          }
        }));
      },

      navigateToTaskBoard: async () => {
        // Implementation would depend on board store integration
        return { success: true, boardId: '' };
      },

      loadSearchPreferences: async () => {
        // Load from localStorage or settings
        const saved = localStorage.getItem('searchPreferences');
        if (saved) {
          const prefs = JSON.parse(saved);
          set(state => ({
            searchState: { ...state.searchState, scope: prefs.scope }
          }));
        }
      },

      saveSearchScope: async (scope) => {
        const prefs = { scope };
        localStorage.setItem('searchPreferences', JSON.stringify(prefs));
        set(state => ({
          searchState: { ...state.searchState, scope }
        }));
      },
    }),
    {
      name: 'task-search-store',
    }
  )
);