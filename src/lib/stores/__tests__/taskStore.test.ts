import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from '../taskStore';

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    getTasks: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock board store for validation
vi.mock('../boardStore', () => ({
  useBoardStore: {
    getState: () => ({
      boards: [
        { id: 'board-1', name: 'Default', isDefault: true },
        { id: 'board-2', name: 'Work', isDefault: false },
      ],
    }),
  },
}));

describe('taskStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTaskStore.setState({
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
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const { tasks, filteredTasks, isLoading, error } = useTaskStore.getState();

      expect(tasks).toEqual([]);
      expect(filteredTasks).toEqual([]);
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });

    it('initializes with default filter state', () => {
      const { filters, searchState } = useTaskStore.getState();

      expect(filters.search).toBe('');
      expect(filters.tags).toEqual([]);
      expect(filters.crossBoardSearch).toBe(false);
      expect(searchState.scope).toBe('current-board');
    });
  });

  describe('addTask', () => {
    it('adds a new task', async () => {
      const { addTask } = useTaskStore.getState();

      await addTask({
        title: 'Test Task',
        description: 'Test description',
        status: 'todo',
        boardId: 'board-1',
        priority: 'medium',
        tags: ['test'],
      });

      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Test Task');
      expect(tasks[0].status).toBe('todo');
      expect(tasks[0].priority).toBe('medium');
    });

    it('generates unique id for new task', async () => {
      const { addTask } = useTaskStore.getState();

      await addTask({
        title: 'Task 1',
        status: 'todo',
        boardId: 'board-1',
        priority: 'low',
        tags: [],
      });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].id).toBeDefined();
      expect(typeof tasks[0].id).toBe('string');
    });

    it('sets createdAt and updatedAt dates', async () => {
      const { addTask } = useTaskStore.getState();
      const beforeAdd = new Date();

      await addTask({
        title: 'Task with dates',
        status: 'todo',
        boardId: 'board-1',
        priority: 'low',
        tags: [],
      });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].createdAt).toBeInstanceOf(Date);
      expect(tasks[0].updatedAt).toBeInstanceOf(Date);
      expect(tasks[0].createdAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
    });

    it('sets error when title is empty', async () => {
      const { addTask } = useTaskStore.getState();

      await addTask({
        title: '   ',
        status: 'todo',
        boardId: 'board-1',
        priority: 'low',
        tags: [],
      });

      const { error, tasks } = useTaskStore.getState();
      expect(error).toBe('Task title is required');
      expect(tasks).toHaveLength(0);
    });
  });

  describe('updateTask', () => {
    it('updates an existing task', async () => {
      // Setup: add a task first
      useTaskStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Original Title',
          status: 'todo',
          boardId: 'board-1',
          priority: 'low',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        filteredTasks: [],
      });

      const { updateTask } = useTaskStore.getState();
      await updateTask('task-1', { title: 'Updated Title' });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].title).toBe('Updated Title');
    });

    it('updates the updatedAt timestamp', async () => {
      const oldDate = new Date('2024-01-01');
      useTaskStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Test',
          status: 'todo',
          boardId: 'board-1',
          priority: 'low',
          tags: [],
          createdAt: oldDate,
          updatedAt: oldDate,
        }],
        filteredTasks: [],
      });

      const { updateTask } = useTaskStore.getState();
      await updateTask('task-1', { description: 'New description' });

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });
  });

  describe('deleteTask', () => {
    it('removes a task from the store', async () => {
      useTaskStore.setState({
        tasks: [
          { id: 'task-1', title: 'Task 1', status: 'todo', boardId: 'board-1', priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date() },
          { id: 'task-2', title: 'Task 2', status: 'todo', boardId: 'board-1', priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date() },
        ],
        filteredTasks: [],
      });

      const { deleteTask } = useTaskStore.getState();
      await deleteTask('task-1');

      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-2');
    });
  });

  describe('moveTask', () => {
    it('moves task to a new status', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Test',
          status: 'todo',
          boardId: 'board-1',
          priority: 'low',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        filteredTasks: [],
      });

      const { moveTask } = useTaskStore.getState();
      await moveTask('task-1', 'in-progress');

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe('in-progress');
    });

    it('sets completedAt when moving to done', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Test',
          status: 'in-progress',
          boardId: 'board-1',
          priority: 'low',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        filteredTasks: [],
      });

      const { moveTask } = useTaskStore.getState();
      await moveTask('task-1', 'done');

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe('done');
      expect(tasks[0].completedAt).toBeInstanceOf(Date);
      expect(tasks[0].progress).toBe(100);
    });

    it('clears completedAt when moving back from done', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Test',
          status: 'done',
          boardId: 'board-1',
          priority: 'low',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
          progress: 100,
        }],
        filteredTasks: [],
      });

      const { moveTask } = useTaskStore.getState();
      await moveTask('task-1', 'todo');

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe('todo');
      expect(tasks[0].completedAt).toBeUndefined();
      expect(tasks[0].progress).toBeUndefined();
    });
  });

  describe('archiveTask', () => {
    it('sets archivedAt timestamp', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Test',
          status: 'done',
          boardId: 'board-1',
          priority: 'low',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        filteredTasks: [],
      });

      const { archiveTask } = useTaskStore.getState();
      await archiveTask('task-1');

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].archivedAt).toBeInstanceOf(Date);
    });
  });

  describe('unarchiveTask', () => {
    it('clears archivedAt timestamp', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1',
          title: 'Test',
          status: 'done',
          boardId: 'board-1',
          priority: 'low',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          archivedAt: new Date(),
        }],
        filteredTasks: [],
      });

      const { unarchiveTask } = useTaskStore.getState();
      await unarchiveTask('task-1');

      const { tasks } = useTaskStore.getState();
      expect(tasks[0].archivedAt).toBeUndefined();
    });
  });

  describe('filters', () => {
    it('sets filters and triggers applyFilters', () => {
      const { setFilters } = useTaskStore.getState();

      setFilters({ status: 'todo' });

      const { filters } = useTaskStore.getState();
      expect(filters.status).toBe('todo');
    });

    it('sets board filter', () => {
      const { setBoardFilter } = useTaskStore.getState();

      setBoardFilter('board-1');

      const { filters } = useTaskStore.getState();
      expect(filters.boardId).toBe('board-1');
    });

    it('clears board filter with null', () => {
      useTaskStore.setState({
        ...useTaskStore.getState(),
        filters: { ...useTaskStore.getState().filters, boardId: 'board-1' },
      });

      const { setBoardFilter } = useTaskStore.getState();
      setBoardFilter(null);

      const { filters } = useTaskStore.getState();
      expect(filters.boardId).toBeUndefined();
    });

    it('toggles cross-board search', () => {
      const { setCrossBoardSearch } = useTaskStore.getState();

      setCrossBoardSearch(true);

      const { filters, searchState } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(true);
      expect(searchState.scope).toBe('all-boards');
    });

    it('clears filters preserving board settings', () => {
      useTaskStore.setState({
        ...useTaskStore.getState(),
        filters: {
          search: 'test',
          tags: ['urgent'],
          status: 'todo',
          boardId: 'board-1',
          crossBoardSearch: true,
        },
      });

      const { clearFilters } = useTaskStore.getState();
      clearFilters();

      const { filters } = useTaskStore.getState();
      expect(filters.search).toBe('');
      expect(filters.tags).toEqual([]);
      expect(filters.status).toBeUndefined();
      expect(filters.boardId).toBe('board-1'); // Preserved
      expect(filters.crossBoardSearch).toBe(true); // Preserved
    });
  });

  describe('search', () => {
    it('sets highlighted task', () => {
      const { setHighlightedTask } = useTaskStore.getState();

      setHighlightedTask('task-123');

      const { searchState } = useTaskStore.getState();
      expect(searchState.highlightedTaskId).toBe('task-123');
    });

    it('clears highlighted task', () => {
      useTaskStore.setState({
        ...useTaskStore.getState(),
        searchState: { scope: 'current-board', highlightedTaskId: 'task-123' },
      });

      const { setHighlightedTask } = useTaskStore.getState();
      setHighlightedTask(undefined);

      const { searchState } = useTaskStore.getState();
      expect(searchState.highlightedTaskId).toBeUndefined();
    });

    it('clears search and highlighted task', () => {
      useTaskStore.setState({
        ...useTaskStore.getState(),
        filters: { ...useTaskStore.getState().filters, search: 'test' },
        searchState: { scope: 'current-board', highlightedTaskId: 'task-123' },
      });

      const { clearSearch } = useTaskStore.getState();
      clearSearch();

      const { filters, searchState } = useTaskStore.getState();
      expect(filters.search).toBe('');
      expect(searchState.highlightedTaskId).toBeUndefined();
    });
  });

  describe('simple setters', () => {
    it('setTasks updates tasks and clears cache', () => {
      const newTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo' as const, boardId: 'board-1', priority: 'low' as const, tags: [], createdAt: new Date(), updatedAt: new Date() },
      ];

      const { setTasks } = useTaskStore.getState();
      setTasks(newTasks);

      const { tasks, searchCache } = useTaskStore.getState();
      expect(tasks).toEqual(newTasks);
      expect(searchCache.size).toBe(0);
    });

    it('setFilteredTasks updates filtered tasks', () => {
      const filteredTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo' as const, boardId: 'board-1', priority: 'low' as const, tags: [], createdAt: new Date(), updatedAt: new Date() },
      ];

      const { setFilteredTasks } = useTaskStore.getState();
      setFilteredTasks(filteredTasks);

      const state = useTaskStore.getState();
      expect(state.filteredTasks).toEqual(filteredTasks);
    });

    it('setLoading updates loading state', () => {
      const { setLoading } = useTaskStore.getState();

      setLoading(true);
      expect(useTaskStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useTaskStore.getState().isLoading).toBe(false);
    });

    it('setSearching updates searching state', () => {
      const { setSearching } = useTaskStore.getState();

      setSearching(true);
      expect(useTaskStore.getState().isSearching).toBe(true);
    });

    it('setError updates error state', () => {
      const { setError } = useTaskStore.getState();

      setError('Test error');
      expect(useTaskStore.getState().error).toBe('Test error');

      setError(null);
      expect(useTaskStore.getState().error).toBeNull();
    });

    it('clearSearchCache clears the search cache', () => {
      // Add something to cache first
      const cache = new Map();
      cache.set('key1', { results: [], timestamp: Date.now(), taskCount: 0 });
      useTaskStore.setState({ ...useTaskStore.getState(), searchCache: cache });

      const { clearSearchCache } = useTaskStore.getState();
      clearSearchCache();

      expect(useTaskStore.getState().searchCache.size).toBe(0);
    });
  });
});
