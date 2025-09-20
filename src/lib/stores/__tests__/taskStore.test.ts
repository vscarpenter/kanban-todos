import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTaskStore } from '../taskStore';

// Mock IndexedDB
vi.mock('../../utils/database', () => ({
  taskDB: {
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getBoards: vi.fn(() => Promise.resolve([])),
    getSettings: vi.fn(() => Promise.resolve({ theme: 'system', autoArchiveDays: 30, enableNotifications: false, enableKeyboardShortcuts: true, enableDebugMode: false, enableDeveloperMode: false, searchPreferences: { defaultScope: 'current-board', rememberScope: true }, accessibility: { highContrast: false, reduceMotion: false, fontSize: 'medium' } })),
    updateSettings: vi.fn()
  }
}));

// Mock security utilities
vi.mock('../../utils/security', () => ({
  sanitizeTaskData: vi.fn((data) => ({ title: data.title, description: data.description || '', tags: data.tags || [] })),
  sanitizeSearchQuery: vi.fn((query) => query),
  searchRateLimiter: { isAllowed: vi.fn(() => true) }
}));

describe('TaskStore', () => {
  beforeEach(() => {
    // Reset store state
    useTaskStore.setState({
      tasks: [],
      filteredTasks: [],
      filters: { search: '', tags: [], crossBoardSearch: false },
      isLoading: false,
      isSearching: false,
      error: null,
      searchCache: new Map()
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useTaskStore.setState({ tasks: [], filteredTasks: [] });
  });

  describe('Task CRUD Operations', () => {
    it('should add a new task', async () => {
      const { addTask } = useTaskStore.getState();
      
      const newTask = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo' as const,
        priority: 'medium' as const,
        boardId: 'board-1'
      };
      
      await addTask(newTask);
      
      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Test Task');
      expect(tasks[0].id).toBeDefined();
      expect(tasks[0].createdAt).toBeInstanceOf(Date);
      expect(tasks[0].updatedAt).toBeInstanceOf(Date);
      const { taskDB } = await import('../../utils/database');
      expect(taskDB.addTask).toHaveBeenCalled();
    });

    it('should update an existing task', async () => {
      const { addTask, updateTask } = useTaskStore.getState();
      
      // Add a task first
      await addTask({
        title: 'Original Task',
        status: 'todo',
        priority: 'medium',
        boardId: 'board-1'
      });
      
      const taskId = useTaskStore.getState().tasks[0].id;
      
      // Update the task
      await updateTask(taskId, {
        title: 'Updated Task',
        status: 'in-progress'
      });
      
      const { tasks } = useTaskStore.getState();
      expect(tasks[0].title).toBe('Updated Task');
      expect(tasks[0].status).toBe('in-progress');
      const { taskDB } = await import('../../utils/database');
      expect(taskDB.updateTask).toHaveBeenCalled();
    });

    it('should delete a task', async () => {
      const { addTask, deleteTask } = useTaskStore.getState();
      
      // Add a task first
      await addTask({
        title: 'Task to Delete',
        status: 'todo',
        priority: 'medium',
        boardId: 'board-1'
      });
      
      const taskId = useTaskStore.getState().tasks[0].id;
      expect(useTaskStore.getState().tasks).toHaveLength(1);
      
      // Delete the task
      await deleteTask(taskId);
      
      const { tasks } = useTaskStore.getState();
      expect(tasks).toHaveLength(0);
      const { taskDB } = await import('../../utils/database');
      expect(taskDB.deleteTask).toHaveBeenCalled();
    });

    it('should find a task by ID from tasks array', async () => {
      const { addTask } = useTaskStore.getState();
      
      await addTask({
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        boardId: 'board-1'
      });
      
      const { tasks } = useTaskStore.getState();
      const taskId = tasks[0].id;
      const retrievedTask = tasks.find(t => t.id === taskId);
      
      expect(retrievedTask).toEqual(tasks[0]);
    });

    it('should return undefined for non-existent task', () => {
      const { tasks } = useTaskStore.getState();
      const retrievedTask = tasks.find(t => t.id === 'non-existent-id');
      
      expect(retrievedTask).toBeUndefined();
    });
  });

  describe('Task Operations', () => {
    it('should move a task to different status', async () => {
      const { addTask, moveTask } = useTaskStore.getState();
      
      await addTask({
        title: 'Movable Task',
        status: 'todo',
        priority: 'medium',
        boardId: 'board-1'
      });
      
      const taskId = useTaskStore.getState().tasks[0].id;
      await moveTask(taskId, 'in-progress');
      
      const { tasks } = useTaskStore.getState();
      expect(tasks[0].status).toBe('in-progress');
    });

    it('should archive a task', async () => {
      const { addTask, archiveTask } = useTaskStore.getState();
      
      await addTask({
        title: 'Task to Archive',
        status: 'todo',
        priority: 'medium',
        boardId: 'board-1'
      });
      
      const taskId = useTaskStore.getState().tasks[0].id;
      await archiveTask(taskId);
      
      const { tasks } = useTaskStore.getState();
      expect(tasks[0].archivedAt).toBeDefined();
    });

    it('should unarchive a task', async () => {
      const { addTask, archiveTask, unarchiveTask } = useTaskStore.getState();
      
      await addTask({
        title: 'Task to Archive',
        status: 'todo',
        priority: 'medium',
        boardId: 'board-1'
      });
      
      const taskId = useTaskStore.getState().tasks[0].id;
      await archiveTask(taskId);
      await unarchiveTask(taskId);
      
      const { tasks } = useTaskStore.getState();
      expect(tasks[0].archivedAt).toBeUndefined();
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      const { addTask } = useTaskStore.getState();
      
      // Add test tasks
      await addTask({
        title: 'High Priority Task',
        description: 'Important task',
        status: 'todo',
        priority: 'high',
        boardId: 'board-1',
        tags: ['urgent']
      });
      
      await addTask({
        title: 'Low Priority Task',
        description: 'Not so important',
        status: 'in-progress',
        priority: 'low',
        boardId: 'board-1',
        tags: ['optional']
      });
    });

    it('should set search query', () => {
      const { setSearchQuery } = useTaskStore.getState();
      
      setSearchQuery('High Priority');
      
      const { filters } = useTaskStore.getState();
      expect(filters.search).toBe('High Priority');
    });

    it('should set filters', () => {
      const { setFilters } = useTaskStore.getState();
      
      setFilters({ status: 'todo' });
      
      const { filters } = useTaskStore.getState();
      expect(filters.status).toBe('todo');
    });

    it('should clear filters', () => {
      const { setFilters, clearFilters, filters } = useTaskStore.getState();
      
      setFilters({ status: 'todo', priority: 'high' });
      clearFilters();
      
      expect(filters.search).toBe('');
      expect(filters.status).toBeUndefined();
      expect(filters.priority).toBeUndefined();
    });

    it('should set cross-board search', () => {
      const { setCrossBoardSearch } = useTaskStore.getState();
      
      setCrossBoardSearch(true);
      
      const { filters } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle error state', () => {
      const { setError, error } = useTaskStore.getState();
      
      setError('Test error');
      expect(error).toBe('Test error');
      
      setError(null);
      expect(error).toBeNull();
    });

    it('should handle loading states', () => {
      const { setLoading, isLoading, setSearching, isSearching } = useTaskStore.getState();
      
      setLoading(true);
      expect(isLoading).toBe(true);
      
      setSearching(true);
      expect(isSearching).toBe(true);
    });
  });

  describe('Export functionality', () => {
    it('should export tasks', async () => {
      const { addTask, exportTasks } = useTaskStore.getState();
      
      await addTask({
        title: 'Export Task',
        status: 'todo',
        priority: 'medium',
        boardId: 'board-1'
      });
      
      const exportData = exportTasks();
      expect(exportData.tasks).toHaveLength(1);
      expect(exportData.tasks[0].title).toBe('Export Task');
    });
  });
});