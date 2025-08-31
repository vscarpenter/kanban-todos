import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTaskStore } from '../taskStore';
import { Task } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';

// Type definition for global timeout handling
interface GlobalWithTimeout {
  __searchTimeout?: NodeJS.Timeout;
}

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn().mockResolvedValue(undefined),
    getTasks: vi.fn().mockResolvedValue([]),
    updateTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Task on Board 1',
    description: 'Description for task 1',
    status: 'todo',
    priority: 'high',
    tags: ['urgent', 'frontend'],
    boardId: 'board-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'task-2',
    title: 'Task on Board 2',
    description: 'Description for task 2',
    status: 'in-progress',
    priority: 'medium',
    tags: ['backend'],
    boardId: 'board-2',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'task-3',
    title: 'Another task on Board 1',
    description: 'Another description',
    status: 'done',
    priority: 'low',
    tags: ['testing'],
    boardId: 'board-1',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

describe('TaskStore - Cross-board Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useTaskStore.setState({
      tasks: mockTasks,
      filteredTasks: mockTasks,
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
      error: null,
    });
  });

  afterEach(() => {
    // Clear any pending timeouts
    if ((globalThis as GlobalWithTimeout).__searchTimeout) {
      clearTimeout((globalThis as GlobalWithTimeout).__searchTimeout);
      (globalThis as GlobalWithTimeout).__searchTimeout = undefined;
    }
  });

  describe('Cross-board search filtering', () => {
    it('filters by board when crossBoardSearch is false', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ boardId: 'board-1', crossBoardSearch: false });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(2);
      expect(filteredTasks.every(task => task.boardId === 'board-1')).toBe(true);
    });

    it('ignores board filter when crossBoardSearch is true', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ boardId: 'board-1', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(3); // All tasks from all boards
    });

    it('searches across all boards when crossBoardSearch is enabled', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ search: 'Task', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(3); // All tasks with "Task" in title (case insensitive)
      expect(filteredTasks.some(task => task.boardId === 'board-1')).toBe(true);
      expect(filteredTasks.some(task => task.boardId === 'board-2')).toBe(true);
    });

    it('searches only current board when crossBoardSearch is disabled', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ search: 'Task', boardId: 'board-1', crossBoardSearch: false });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(2); // Both tasks from board-1 with "Task" in title
      expect(filteredTasks.every(task => task.boardId === 'board-1')).toBe(true);
    });
  });

  describe('Search functionality', () => {
    it('searches by title across all boards', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ search: 'Another', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].title).toBe('Another task on Board 1');
    });

    it('searches by description across all boards', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ search: 'Description for task 2', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].id).toBe('task-2');
    });

    it('searches by tags across all boards', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ search: 'backend', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].tags).toContain('backend');
    });

    it('is case insensitive', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ search: 'TASK', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(3); // All tasks with "task" in title (case insensitive)
    });
  });

  describe('Combined filters with cross-board search', () => {
    it('applies status filter across all boards', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ status: 'todo', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].status).toBe('todo');
    });

    it('applies priority filter across all boards', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ priority: 'medium', crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].priority).toBe('medium');
    });

    it('applies tag filter across all boards', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ tags: ['urgent'], crossBoardSearch: true });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].tags).toContain('urgent');
    });

    it('combines multiple filters with cross-board search', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ 
        search: 'Task',
        status: 'todo',
        crossBoardSearch: true 
      });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].title).toBe('Task on Board 1');
      expect(filteredTasks[0].status).toBe('todo');
    });
  });

  describe('Search scope management', () => {
    it('setCrossBoardSearch updates the filter and applies filters', () => {
      const { setCrossBoardSearch, setFilters } = useTaskStore.getState();
      
      // Set up initial state with board filter
      setFilters({ boardId: 'board-1' });
      expect(useTaskStore.getState().filteredTasks).toHaveLength(2);
      
      // Enable cross-board search
      setCrossBoardSearch(true);
      
      const { filters, filteredTasks } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(true);
      expect(filteredTasks).toHaveLength(3); // Now shows all tasks
    });

    it('setSearchQuery updates search and applies filters with debounce', async () => {
      const { setSearchQuery } = useTaskStore.getState();
      
      setSearchQuery('Task');
      
      // Should update the search filter immediately
      const { filters } = useTaskStore.getState();
      expect(filters.search).toBe('Task');
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks.length).toBeGreaterThan(0);
    });
  });

  describe('clearFilters', () => {
    it('preserves crossBoardSearch setting when clearing filters', () => {
      const { setFilters, clearFilters } = useTaskStore.getState();
      
      setFilters({ 
        search: 'test',
        status: 'todo',
        priority: 'high',
        tags: ['urgent'],
        boardId: 'board-1',
        crossBoardSearch: true
      });
      
      clearFilters();
      
      const { filters } = useTaskStore.getState();
      expect(filters.search).toBe('');
      expect(filters.status).toBeUndefined();
      expect(filters.priority).toBeUndefined();
      expect(filters.tags).toEqual([]);
      expect(filters.boardId).toBe('board-1'); // Preserved
      expect(filters.crossBoardSearch).toBe(true); // Preserved
    });
  });

  describe('Date range filtering with cross-board search', () => {
    it('applies date range filter across all boards', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ 
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-02')
        },
        crossBoardSearch: true 
      });
      
      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(2); // Tasks from Jan 1 and Jan 2
      expect(filteredTasks.some(task => task.boardId === 'board-1')).toBe(true);
      expect(filteredTasks.some(task => task.boardId === 'board-2')).toBe(true);
    });
  });
});

describe('TaskStore - Search Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({
      tasks: mockTasks,
      filteredTasks: mockTasks,
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
      error: null,
    });
  });

  describe('loadSearchPreferences', () => {
    it('loads default scope from settings', async () => {
      const mockGetSettings = vi.mocked(taskDB.getSettings);
      mockGetSettings.mockResolvedValue({
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: true,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        searchPreferences: {
          defaultScope: 'all-boards',
          rememberScope: true,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      });

      const { loadSearchPreferences } = useTaskStore.getState();
      await loadSearchPreferences();

      const { filters, searchState } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(true);
      expect(searchState.scope).toBe('all-boards');
    });

    it('handles missing settings gracefully', async () => {
      const mockGetSettings = vi.mocked(taskDB.getSettings);
      mockGetSettings.mockResolvedValue(null);

      const { loadSearchPreferences } = useTaskStore.getState();
      await loadSearchPreferences();

      const { filters, searchState } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(false);
      expect(searchState.scope).toBe('current-board');
    });

    it('handles database errors gracefully', async () => {
      const mockGetSettings = vi.mocked(taskDB.getSettings);
      mockGetSettings.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { loadSearchPreferences } = useTaskStore.getState();
      await loadSearchPreferences();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load search preferences:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('saveSearchScope', () => {
    it('saves scope when rememberScope is enabled', async () => {
      const mockGetSettings = vi.mocked(taskDB.getSettings);
      const mockUpdateSettings = vi.mocked(taskDB.updateSettings);
      
      mockGetSettings.mockResolvedValue({
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: true,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: true,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      });

      const { saveSearchScope } = useTaskStore.getState();
      await saveSearchScope('all-boards');

      expect(mockUpdateSettings).toHaveBeenCalledWith({
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: true,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        searchPreferences: {
          defaultScope: 'all-boards',
          rememberScope: true,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      });
    });

    it('does not save scope when rememberScope is disabled', async () => {
      const mockGetSettings = vi.mocked(taskDB.getSettings);
      const mockUpdateSettings = vi.mocked(taskDB.updateSettings);
      
      mockGetSettings.mockResolvedValue({
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: true,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: false,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      });

      const { saveSearchScope } = useTaskStore.getState();
      await saveSearchScope('all-boards');

      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      const mockGetSettings = vi.mocked(taskDB.getSettings);
      mockGetSettings.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { saveSearchScope } = useTaskStore.getState();
      await saveSearchScope('all-boards');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save search scope preference:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('setCrossBoardSearch with preference saving', () => {
    it('saves scope preference when enabling cross-board search', async () => {
      const mockGetSettings = vi.mocked(taskDB.getSettings);
      const mockUpdateSettings = vi.mocked(taskDB.updateSettings);
      
      mockGetSettings.mockResolvedValue({
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: true,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: true,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      });

      const { setCrossBoardSearch } = useTaskStore.getState();
      setCrossBoardSearch(true);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      const { filters, searchState } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(true);
      expect(searchState.scope).toBe('all-boards');
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          searchPreferences: {
            defaultScope: 'all-boards',
            rememberScope: true,
          },
        })
      );
    });
  });

  describe('Search state management', () => {
    it('sets highlighted task', () => {
      const { setHighlightedTask } = useTaskStore.getState();
      
      setHighlightedTask('task-1');
      
      const { searchState } = useTaskStore.getState();
      expect(searchState.highlightedTaskId).toBe('task-1');
    });

    it('clears search and highlighted task', () => {
      const { setHighlightedTask, clearSearch, setFilters } = useTaskStore.getState();
      
      // Set up initial state
      setFilters({ search: 'test' });
      setHighlightedTask('task-1');
      
      clearSearch();
      
      const { filters, searchState } = useTaskStore.getState();
      expect(filters.search).toBe('');
      expect(searchState.highlightedTaskId).toBeUndefined();
    });
  });
});