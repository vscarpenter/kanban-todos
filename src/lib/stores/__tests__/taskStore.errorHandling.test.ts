import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from '../taskStore';
import { Task, Board } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    getTasks: vi.fn().mockResolvedValue([]),
    getBoards: vi.fn().mockResolvedValue([]),
    addTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue({
      searchPreferences: { defaultScope: 'current-board', rememberScope: false }
    }),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

// Generate test data
const generateTestTask = (id: string, boardId: string): Task => ({
  id,
  title: `Task ${id}`,
  description: `Description for task ${id}`,
  status: 'todo',
  priority: 'medium',
  boardId,
  tags: [`tag-${id}`],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const generateTestBoard = (id: string, name: string): Board => ({
  id,
  name,
  description: `Board ${name}`,
  color: '#3b82f6',
  isDefault: false,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('TaskStore Error Handling Tests', () => {
  beforeEach(() => {
    // Reset store state
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
      searchPerformanceMetrics: {
        lastSearchDuration: 0,
        averageSearchDuration: 0,
        searchCount: 0,
      },
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Board Deletion Handling', () => {
    it('should handle board deletion during active cross-board search', () => {
      const store = useTaskStore.getState();
      const tasks = [
        generateTestTask('task1', 'board1'),
        generateTestTask('task2', 'board2'),
        generateTestTask('task3', 'board1'),
      ];
      
      store.setTasks(tasks);
      store.setCrossBoardSearch(true);
      store.setFilters({ search: 'task' });
      
      // Simulate board deletion
      store.handleBoardDeletion('board1');
      
      const { tasks: updatedTasks, filteredTasks } = useTaskStore.getState();
      
      // Should remove tasks from deleted board
      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0].boardId).toBe('board2');
      expect(filteredTasks).toHaveLength(1);
    });

    it('should clear board filter when filtered board is deleted', () => {
      const store = useTaskStore.getState();
      const tasks = [
        generateTestTask('task1', 'board1'),
        generateTestTask('task2', 'board2'),
      ];
      
      store.setTasks(tasks);
      store.setBoardFilter('board1');
      
      // Simulate board deletion
      store.handleBoardDeletion('board1');
      
      const { filters } = useTaskStore.getState();
      expect(filters.boardId).toBeUndefined();
    });

    it('should clear search cache when board is deleted', () => {
      const store = useTaskStore.getState();
      const tasks = [generateTestTask('task1', 'board1')];
      
      store.setTasks(tasks);
      
      // Populate cache
      useTaskStore.setState({
        searchCache: new Map([
          ['test-key', { results: tasks, timestamp: Date.now() }]
        ])
      });
      
      store.handleBoardDeletion('board1');
      
      const { searchCache } = useTaskStore.getState();
      expect(searchCache.size).toBe(0);
    });
  });

  describe('Task Integrity Validation', () => {
    it('should validate task with all required fields', () => {
      const store = useTaskStore.getState();
      const validTask = generateTestTask('task1', 'board1');
      
      expect(store.validateTaskIntegrity(validTask)).toBe(true);
    });

    it('should reject task with missing required fields', () => {
      const store = useTaskStore.getState();
      const invalidTask = {
        title: 'Task without ID',
        boardId: 'board1',
      } as Task;
      
      expect(store.validateTaskIntegrity(invalidTask)).toBe(false);
    });

    it('should reject task with invalid status', () => {
      const store = useTaskStore.getState();
      const invalidTask = {
        ...generateTestTask('task1', 'board1'),
        status: 'invalid-status' as Task['status'],
      };
      
      expect(store.validateTaskIntegrity(invalidTask)).toBe(false);
    });

    it('should reject task with invalid priority', () => {
      const store = useTaskStore.getState();
      const invalidTask = {
        ...generateTestTask('task1', 'board1'),
        priority: 'invalid-priority' as Task['priority'],
      };
      
      expect(store.validateTaskIntegrity(invalidTask)).toBe(false);
    });

    it('should reject task with non-array tags', () => {
      const store = useTaskStore.getState();
      const invalidTask = {
        ...generateTestTask('task1', 'board1'),
        tags: 'not-an-array' as unknown as string[],
      };
      
      expect(store.validateTaskIntegrity(invalidTask)).toBe(false);
    });
  });

  describe('Board Access Validation', () => {
    it('should validate access to existing board', async () => {
      const store = useTaskStore.getState();
      const boards = [generateTestBoard('board1', 'Test Board')];
      
      vi.mocked(taskDB.getBoards).mockResolvedValue(boards);
      
      const hasAccess = await store.validateBoardAccess('board1');
      expect(hasAccess).toBe(true);
    });

    it('should reject access to non-existent board', async () => {
      const store = useTaskStore.getState();
      
      vi.mocked(taskDB.getBoards).mockResolvedValue([]);
      
      const hasAccess = await store.validateBoardAccess('non-existent');
      expect(hasAccess).toBe(false);
    });

    it('should reject access to archived board', async () => {
      const store = useTaskStore.getState();
      const archivedBoard = {
        ...generateTestBoard('board1', 'Archived Board'),
        archivedAt: new Date(),
      };
      
      vi.mocked(taskDB.getBoards).mockResolvedValue([archivedBoard]);
      
      const hasAccess = await store.validateBoardAccess('board1');
      expect(hasAccess).toBe(false);
    });

    it('should handle database error gracefully', async () => {
      const store = useTaskStore.getState();
      
      vi.mocked(taskDB.getBoards).mockRejectedValue(new Error('Database error'));
      
      const hasAccess = await store.validateBoardAccess('board1');
      expect(hasAccess).toBe(false);
    });
  });

  describe('Navigation Error Handling', () => {
    it('should handle navigation to existing task', async () => {
      const store = useTaskStore.getState();
      const task = generateTestTask('task1', 'board1');
      
      store.setTasks([task]);
      vi.mocked(taskDB.getBoards).mockResolvedValue([generateTestBoard('board1', 'Test Board')]);
      
      const result = await store.navigateToTaskBoard('task1');
      
      expect(result.success).toBe(true);
      expect(result.boardId).toBe('board1');
      
      const { searchState } = useTaskStore.getState();
      expect(searchState.highlightedTaskId).toBe('task1');
    });

    it('should handle navigation to non-existent task', async () => {
      const store = useTaskStore.getState();
      
      const result = await store.navigateToTaskBoard('non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    it('should handle navigation to task on deleted board', async () => {
      const store = useTaskStore.getState();
      const task = generateTestTask('task1', 'board1');
      
      store.setTasks([task]);
      vi.mocked(taskDB.getBoards).mockResolvedValue([]); // Board doesn't exist
      
      const result = await store.navigateToTaskBoard('task1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('board no longer exists');
    });

    it('should handle database error during navigation', async () => {
      const store = useTaskStore.getState();
      const task = generateTestTask('task1', 'board1');
      
      store.setTasks([task]);
      vi.mocked(taskDB.getBoards).mockRejectedValue(new Error('Database error'));
      
      const result = await store.navigateToTaskBoard('task1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to navigate');
    });
  });

  describe('Search Error Recovery', () => {
    it('should recover from search error by clearing search', () => {
      const store = useTaskStore.getState();
      const tasks = [generateTestTask('task1', 'board1')];
      
      store.setTasks(tasks);
      store.setFilters({ search: 'problematic search' });
      
      // Set error state
      useTaskStore.setState({ 
        error: 'Search failed',
        isSearching: true,
        searchCache: new Map([['key', { results: [], timestamp: Date.now() }]])
      });
      
      store.recoverFromSearchError();
      
      const { filters, isSearching, error, searchCache } = useTaskStore.getState();
      
      expect(filters.search).toBe('');
      expect(isSearching).toBe(false);
      expect(error).toBeNull();
      expect(searchCache.size).toBe(0);
    });

    it('should handle recovery failure gracefully', () => {
      const store = useTaskStore.getState();
      const tasks = [generateTestTask('task1', 'board1')];
      
      store.setTasks(tasks);
      
      // Mock applyFilters to throw error
      const applyFiltersSpy = vi.spyOn(store, 'applyFilters').mockImplementation(() => {
        throw new Error('Apply filters failed');
      });
      
      store.recoverFromSearchError();
      
      const { error, filteredTasks } = useTaskStore.getState();
      
      expect(error).toContain('temporarily unavailable');
      expect(filteredTasks).toEqual(tasks); // Should fallback to showing all tasks
      
      applyFiltersSpy.mockRestore();
    });
  });

  describe('Filter Application Error Handling', () => {
    it('should handle corrupted cache gracefully', async () => {
      const store = useTaskStore.getState();
      const tasks = [generateTestTask('task1', 'board1')];
      
      store.setTasks(tasks);
      
      // Set up corrupted cache
      const corruptedCache = new Map();
      corruptedCache.set = vi.fn().mockImplementation(() => {
        throw new Error('Cache corruption');
      });
      
      useTaskStore.setState({ searchCache: corruptedCache });
      
      store.setFilters({ search: 'test' });
      await store.applyFilters();
      
      // Should not crash and should clear cache
      const { searchCache } = useTaskStore.getState();
      expect(searchCache.size).toBe(0);
    });

    it('should filter out invalid tasks during filtering', async () => {
      const store = useTaskStore.getState();
      const validTask = generateTestTask('task1', 'board1');
      const invalidTask = { id: 'invalid', title: null } as unknown as Task;
      
      store.setTasks([validTask, invalidTask]);
      
      await store.applyFilters();
      
      const { tasks, filteredTasks } = useTaskStore.getState();
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toEqual(validTask);
      expect(filteredTasks).toHaveLength(1);
    });

    it('should handle cross-board search with inaccessible boards', async () => {
      const store = useTaskStore.getState();
      const tasks = [
        generateTestTask('task1', 'board1'),
        generateTestTask('task2', 'board2'), // This board will be inaccessible
      ];
      
      store.setTasks(tasks);
      store.setCrossBoardSearch(true);
      
      // Mock only board1 as accessible
      vi.mocked(taskDB.getBoards).mockResolvedValue([
        generateTestBoard('board1', 'Accessible Board')
      ]);
      
      await store.applyFilters();
      
      const { tasks: updatedTasks } = useTaskStore.getState();
      
      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0].boardId).toBe('board1');
    });

    it('should handle board validation failure during cross-board search', async () => {
      const store = useTaskStore.getState();
      const tasks = [generateTestTask('task1', 'board1')];
      
      store.setTasks(tasks);
      store.setCrossBoardSearch(true);
      
      // Mock board validation to fail
      vi.mocked(taskDB.getBoards).mockRejectedValue(new Error('Board validation failed'));
      
      await store.applyFilters();
      
      // Should proceed with existing tasks despite validation failure
      const { filteredTasks, error } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(error).toBeNull(); // Should not set error for validation failure
    });
  });

  describe('Cache Validation', () => {
    it('should validate cached results against current tasks', async () => {
      const store = useTaskStore.getState();
      const task1 = generateTestTask('task1', 'board1');
      const task2 = generateTestTask('task2', 'board1');
      
      store.setTasks([task1]);
      
      // Set up cache with task that no longer exists
      const staleCache = new Map([
        ['search:test', { 
          results: [task1, task2], // task2 doesn't exist in current tasks
          timestamp: Date.now() 
        }]
      ]);
      
      useTaskStore.setState({ 
        searchCache: staleCache,
        filters: { search: 'test', tags: [], crossBoardSearch: false }
      });
      
      await store.applyFilters();
      
      const { filteredTasks } = useTaskStore.getState();
      
      // Should only return tasks that exist in current state
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].id).toBe('task1');
    });

    it('should remove stale cache entries', async () => {
      const store = useTaskStore.getState();
      const tasks = [generateTestTask('task1', 'board1')];
      
      store.setTasks(tasks);
      
      // Set up cache with completely stale results
      const staleCache = new Map([
        ['search:test', { 
          results: [generateTestTask('deleted-task', 'board1')], 
          timestamp: Date.now() 
        }]
      ]);
      
      useTaskStore.setState({ 
        searchCache: staleCache,
        filters: { search: 'test', tags: [], crossBoardSearch: false }
      });
      
      await store.applyFilters();
      
      const { searchCache } = useTaskStore.getState();
      
      // Cache entry should be removed since all results were stale
      expect(searchCache.has('search:test')).toBe(false);
    });
  });
});