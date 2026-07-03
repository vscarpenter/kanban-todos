import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskDB } from '@/lib/utils/database';
import type { Board, Task } from '@/lib/types';
import { useTaskStore } from '../taskStore';

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    upsertTasks: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    getBoards: vi.fn().mockResolvedValue([]),
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
  const now = new Date('2026-01-15T12:00:00.000Z');

  const makeTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    title: 'Task',
    status: 'todo',
    boardId: 'board-1',
    priority: 'medium',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const makeBoard = (overrides: Partial<Board> = {}): Board => ({
    id: 'board-1',
    name: 'Work',
    color: '#2563eb',
    isDefault: false,
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

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
    vi.mocked(taskDB.getBoards).mockResolvedValue([
      makeBoard({ id: 'board-1' }),
      makeBoard({ id: 'board-archived', archivedAt: now }),
    ]);
    vi.mocked(taskDB.getTasks).mockResolvedValue([]);
    vi.mocked(taskDB.getSettings).mockResolvedValue(null);
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

      await expect(addTask({
        title: '   ',
        status: 'todo',
        boardId: 'board-1',
        priority: 'low',
        tags: [],
      })).rejects.toThrow('Task title is required');

      const { error, tasks } = useTaskStore.getState();
      expect(error).toBe('Task title is required');
      expect(tasks).toHaveLength(0);
    });

    it('re-throws when the database write fails, so callers do not report false success', async () => {
      vi.mocked(taskDB.addTask).mockRejectedValueOnce(new Error('IndexedDB write failed'));

      const { addTask } = useTaskStore.getState();

      await expect(addTask({
        title: 'Task that fails to persist',
        status: 'todo',
        boardId: 'board-1',
        priority: 'low',
        tags: [],
      })).rejects.toThrow('IndexedDB write failed');

      const { error, tasks } = useTaskStore.getState();
      expect(error).toBe('IndexedDB write failed');
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

    it('re-throws when the database write fails, so callers do not report false success', async () => {
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
      vi.mocked(taskDB.updateTask).mockRejectedValueOnce(new Error('IndexedDB write failed'));

      const { updateTask } = useTaskStore.getState();

      await expect(updateTask('task-1', { title: 'Updated Title' }))
        .rejects.toThrow('IndexedDB write failed');

      const { error, tasks } = useTaskStore.getState();
      expect(error).toBe('IndexedDB write failed');
      expect(tasks[0].title).toBe('Original Title');
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

    it('re-throws when the database write fails, so callers do not report false success', async () => {
      useTaskStore.setState({
        tasks: [
          { id: 'task-1', title: 'Task 1', status: 'todo', boardId: 'board-1', priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date() },
        ],
        filteredTasks: [],
      });
      vi.mocked(taskDB.deleteTask).mockRejectedValueOnce(new Error('IndexedDB write failed'));

      const { deleteTask } = useTaskStore.getState();

      await expect(deleteTask('task-1')).rejects.toThrow('IndexedDB write failed');

      const { error, tasks } = useTaskStore.getState();
      expect(error).toBe('IndexedDB write failed');
      expect(tasks).toHaveLength(1);
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

    it('reports success so callers can act only on a persisted move', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1', title: 'Test', status: 'todo', boardId: 'board-1',
          priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date(),
        }],
        filteredTasks: [],
      });

      const moved = await useTaskStore.getState().moveTask('task-1', 'in-progress');

      expect(moved).toBe(true);
    });

    it('reports failure (and leaves the status unchanged) when the move cannot persist', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1', title: 'Test', status: 'todo', boardId: 'board-1',
          priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date(),
        }],
        filteredTasks: [],
      });
      vi.mocked(taskDB.updateTask).mockRejectedValueOnce(new Error('db down'));

      const moved = await useTaskStore.getState().moveTask('task-1', 'done');

      expect(moved).toBe(false);
      expect(useTaskStore.getState().tasks[0].status).toBe('todo');
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

    it('re-throws when the database write fails, so callers do not report false success', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1', title: 'Test', status: 'done', boardId: 'board-1',
          priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date(),
        }],
        filteredTasks: [],
      });
      vi.mocked(taskDB.updateTask).mockRejectedValueOnce(new Error('IndexedDB write failed'));

      const { archiveTask } = useTaskStore.getState();

      await expect(archiveTask('task-1')).rejects.toThrow('IndexedDB write failed');

      const { error, tasks } = useTaskStore.getState();
      expect(error).toBe('IndexedDB write failed');
      expect(tasks[0].archivedAt).toBeUndefined();
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

    it('re-throws when the database write fails, so callers do not report false success', async () => {
      const archivedAt = new Date();
      useTaskStore.setState({
        tasks: [{
          id: 'task-1', title: 'Test', status: 'done', boardId: 'board-1',
          priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date(), archivedAt,
        }],
        filteredTasks: [],
      });
      vi.mocked(taskDB.updateTask).mockRejectedValueOnce(new Error('IndexedDB write failed'));

      const { unarchiveTask } = useTaskStore.getState();

      await expect(unarchiveTask('task-1')).rejects.toThrow('IndexedDB write failed');

      const { error, tasks } = useTaskStore.getState();
      expect(error).toBe('IndexedDB write failed');
      expect(tasks[0].archivedAt).toEqual(archivedAt);
    });
  });

  describe('importTasks', () => {
    it('persists a mix of new and existing tasks in a single batched transaction, not one per task', async () => {
      useTaskStore.setState({
        tasks: [{
          id: 'task-1', title: 'Existing', status: 'todo', boardId: 'board-1',
          priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date(),
        }],
        filteredTasks: [],
      });

      const { importTasks } = useTaskStore.getState();
      await importTasks([
        { id: 'task-1', title: 'Existing Updated', status: 'todo', boardId: 'board-1', priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date() },
        { id: 'task-2', title: 'New Task', status: 'todo', boardId: 'board-1', priority: 'low', tags: [], createdAt: new Date(), updatedAt: new Date() },
      ]);

      expect(taskDB.upsertTasks).toHaveBeenCalledTimes(1);
      expect(taskDB.upsertTasks).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 'task-1' }),
        expect.objectContaining({ id: 'task-2' }),
      ]));
      expect(taskDB.addTask).not.toHaveBeenCalled();
      expect(taskDB.updateTask).not.toHaveBeenCalled();

      const { tasks } = useTaskStore.getState();
      expect(tasks.map(t => t.id).sort()).toEqual(['task-1', 'task-2']);
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

    it('preserves non-search filters when search recovery fails', () => {
      useTaskStore.setState({
        ...useTaskStore.getState(),
        tasks: [{
          id: 'task-1',
          title: 'Task',
          status: 'in-progress',
          boardId: 'board-1',
          priority: 'high',
          tags: ['urgent'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        filters: {
          search: 'initial search',
          tags: ['urgent'],
          status: 'in-progress',
          priority: 'high',
          boardId: 'board-1',
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-31'),
          },
          crossBoardSearch: true,
        },
        applyFilters: (() => {
          throw new Error('applyFilters failed');
        }) as unknown as () => Promise<void>,
      });

      const { recoverFromSearchError } = useTaskStore.getState();
      recoverFromSearchError();

      const { filters, error, filteredTasks } = useTaskStore.getState();
      expect(filters.search).toBe('');
      expect(filters.tags).toEqual(['urgent']);
      expect(filters.status).toBe('in-progress');
      expect(filters.priority).toBe('high');
      expect(filters.boardId).toBe('board-1');
      expect(filters.dateRange).toBeDefined();
      expect(filters.crossBoardSearch).toBe(true);
      expect(error).toBe('Search functionality temporarily unavailable. Please refresh the page.');
      expect(filteredTasks).toHaveLength(1);
    });
  });

  describe('validation and initialization', () => {
    it('validates board access against active boards only', async () => {
      const { validateBoardAccess } = useTaskStore.getState();

      await expect(validateBoardAccess('board-1')).resolves.toBe(true);
      await expect(validateBoardAccess('board-archived')).resolves.toBe(false);
      await expect(validateBoardAccess('missing-board')).resolves.toBe(false);
    });

    it('returns false when board access validation cannot load boards', async () => {
      vi.mocked(taskDB.getBoards).mockRejectedValueOnce(new Error('database offline'));

      await expect(useTaskStore.getState().validateBoardAccess('board-1')).resolves.toBe(false);
    });

    it('removes tasks and board filters when a board is deleted', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: 'deleted-board-task', boardId: 'board-deleted' }),
          makeTask({ id: 'kept-task', boardId: 'board-1' }),
        ],
        filteredTasks: [
          makeTask({ id: 'deleted-board-task', boardId: 'board-deleted' }),
          makeTask({ id: 'kept-task', boardId: 'board-1' }),
        ],
        filters: {
          search: '',
          tags: [],
          boardId: 'board-deleted',
          crossBoardSearch: false,
        },
      });

      useTaskStore.getState().removeTasksForBoard('board-deleted');

      const { tasks, filteredTasks, filters, error } = useTaskStore.getState();
      expect(tasks.map(task => task.id)).toEqual(['kept-task']);
      expect(filteredTasks.map(task => task.id)).toEqual(['kept-task']);
      expect(filters.boardId).toBeUndefined();
      expect(error).toBeNull();
    });

    it('initializes tasks from storage and restores date fields', async () => {
      vi.mocked(taskDB.getTasks).mockResolvedValueOnce([
        {
          ...makeTask({ id: 'stored-task' }),
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          completedAt: '2026-01-03T00:00:00.000Z',
          archivedAt: '2026-01-04T00:00:00.000Z',
        } as unknown as Task,
      ]);

      await useTaskStore.getState().initializeStore();

      const { tasks, filteredTasks, isLoading } = useTaskStore.getState();
      expect(taskDB.init).toHaveBeenCalled();
      expect(taskDB.getSettings).toHaveBeenCalled();
      expect(isLoading).toBe(false);
      expect(tasks[0].createdAt).toBeInstanceOf(Date);
      expect(tasks[0].updatedAt).toBeInstanceOf(Date);
      expect(tasks[0].completedAt).toBeInstanceOf(Date);
      expect(tasks[0].archivedAt).toBeInstanceOf(Date);
      expect(filteredTasks).toEqual(tasks);
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
