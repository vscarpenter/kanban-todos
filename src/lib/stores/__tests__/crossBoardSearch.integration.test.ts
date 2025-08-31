import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Task, Board } from '@/lib/types';

// Mock the database - must be defined before imports
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn(),
    getTasks: vi.fn().mockResolvedValue([]),
    getBoards: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({
      theme: 'system' as const,
      autoArchiveDays: 30,
      enableNotifications: false,
      enableKeyboardShortcuts: true,
      enableDebugMode: false,
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        fontSize: 'medium' as const,
      },
      searchPreferences: {
        defaultScope: 'current-board' as const,
        rememberScope: false,
      },
    }),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    addBoard: vi.fn(),
    updateBoard: vi.fn(),
    deleteBoard: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

import { useTaskStore } from '../taskStore';
import { useBoardStore } from '../boardStore';
import { useSettingsStore } from '../settingsStore';
import { taskDB } from '@/lib/utils/database';

// Test data generators
const generateBoard = (id: string, name: string, color: string = '#3b82f6'): Board => ({
  id,
  name,
  description: `Description for ${name}`,
  color,
  isDefault: id === 'board-1',
  order: parseInt(id.split('-')[1]) - 1,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const generateTask = (id: string, title: string, boardId: string, status: Task['status'] = 'todo'): Task => ({
  id,
  title,
  description: `Description for ${title}`,
  status,
  priority: 'medium',
  boardId,
  tags: [`tag-${id}`, 'common-tag'],
  createdAt: new Date(Date.now() - parseInt(id.split('-')[1]) * 1000 * 60 * 60), // Spread over hours
  updatedAt: new Date(),
});

describe('Cross-Board Search Integration Tests', () => {
  let taskStore: ReturnType<typeof useTaskStore.getState>;
  let boardStore: ReturnType<typeof useBoardStore.getState>;
  let settingsStore: ReturnType<typeof useSettingsStore.getState>;

  const testBoards: Board[] = [
    generateBoard('board-1', 'Work Tasks', '#3b82f6'),
    generateBoard('board-2', 'Personal Tasks', '#10b981'),
    generateBoard('board-3', 'Project Alpha', '#f59e0b'),
  ];

  const testTasks: Task[] = [
    generateTask('task-1', 'Complete project proposal', 'board-1', 'todo'),
    generateTask('task-2', 'Review code changes', 'board-1', 'in-progress'),
    generateTask('task-3', 'Buy groceries', 'board-2', 'todo'),
    generateTask('task-4', 'Plan vacation', 'board-2', 'done'),
    generateTask('task-5', 'Alpha feature development', 'board-3', 'in-progress'),
    generateTask('task-6', 'Alpha testing phase', 'board-3', 'todo'),
  ];

  beforeEach(async () => {
    // Reset all stores
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

    useBoardStore.setState({
      boards: [],
      currentBoardId: null,
      isLoading: false,
      error: null,
    });

    useSettingsStore.setState({
      settings: {
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: false,
        },
      },
      isLoading: false,
      error: null,
    });

    // Get fresh store instances
    taskStore = useTaskStore.getState();
    boardStore = useBoardStore.getState();
    settingsStore = useSettingsStore.getState();

    // Set up test data
    (taskDB.getBoards as ReturnType<typeof vi.fn>).mockResolvedValue(testBoards);
    (taskDB.getTasks as ReturnType<typeof vi.fn>).mockResolvedValue(testTasks);

    // Initialize stores
    boardStore.setBoards(testBoards);
    boardStore.setCurrentBoard('board-1');
    taskStore.setTasks(testTasks);

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete Cross-Board Search Workflow', () => {
    it('should perform end-to-end cross-board search with all features', async () => {
      // Step 1: Start with current board search
      taskStore.setBoardFilter('board-1');
      await taskStore.applyFilters();

      let { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(2); // Only board-1 tasks

      // Step 2: Enable cross-board search
      taskStore.setCrossBoardSearch(true);
      await taskStore.applyFilters();

      ({ filteredTasks } = useTaskStore.getState());
      expect(filteredTasks).toHaveLength(6); // All tasks

      // Step 3: Apply search filter
      taskStore.setSearchQuery('project');
      
      // Wait for debounced search
      await new Promise(resolve => setTimeout(resolve, 400));

      ({ filteredTasks } = useTaskStore.getState());
      expect(filteredTasks).toHaveLength(2); // Tasks with "project" in title

      // Step 4: Add status filter
      taskStore.setFilters({ status: 'todo' });
      await taskStore.applyFilters();

      ({ filteredTasks } = useTaskStore.getState());
      expect(filteredTasks).toHaveLength(1); // Only "Complete project proposal"

      // Step 5: Add tag filter
      taskStore.setFilters({ tags: ['common-tag'] });
      await taskStore.applyFilters();

      ({ filteredTasks } = useTaskStore.getState());
      expect(filteredTasks.length).toBeGreaterThan(0);
      expect(filteredTasks.every(task => task.tags.includes('common-tag'))).toBe(true);

      // Step 6: Clear filters
      taskStore.clearFilters();
      await taskStore.applyFilters();

      ({ filteredTasks } = useTaskStore.getState());
      expect(filteredTasks).toHaveLength(6); // Back to all tasks (cross-board still enabled)
    });

    it('should handle board navigation from search results', async () => {
      // Enable cross-board search
      taskStore.setCrossBoardSearch(true);
      taskStore.setSearchQuery('Alpha');
      
      await new Promise(resolve => setTimeout(resolve, 400));

      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(2); // Alpha tasks

      // Navigate to task's board
      const alphaTask = filteredTasks[0];
      const navigationResult = await taskStore.navigateToTaskBoard(alphaTask.id);

      expect(navigationResult.success).toBe(true);
      expect(navigationResult.boardId).toBe('board-3');

      const { searchState } = useTaskStore.getState();
      expect(searchState.highlightedTaskId).toBe(alphaTask.id);
    });

    it('should persist search scope preference across sessions', async () => {
      // Enable remember scope preference
      await settingsStore.updateSettings({
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: true,
        },
      });

      // Enable cross-board search
      taskStore.setCrossBoardSearch(true);

      // Verify settings were updated
      expect(taskDB.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          searchPreferences: expect.objectContaining({
            defaultScope: 'all-boards',
          }),
        })
      );

      // Simulate loading preferences on next session
      (taskDB.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'system' as const,
        autoArchiveDays: 30,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium' as const,
        },
        searchPreferences: {
          defaultScope: 'all-boards',
          rememberScope: true,
        },
      });

      await taskStore.loadSearchPreferences();

      const { filters, searchState } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(true);
      expect(searchState.scope).toBe('all-boards');
    });
  });

  describe('Filter Combinations with Cross-Board Search', () => {
    beforeEach(async () => {
      taskStore.setCrossBoardSearch(true);
      await taskStore.applyFilters();
    });

    it('should combine search and status filters across all boards', async () => {
      taskStore.setFilters({ 
        search: 'task',
        status: 'todo' 
      });
      
      await new Promise(resolve => setTimeout(resolve, 400));

      const { filteredTasks } = useTaskStore.getState();
      
      expect(filteredTasks.length).toBeGreaterThan(0);
      expect(filteredTasks.every(task => 
        task.title.toLowerCase().includes('task') && task.status === 'todo'
      )).toBe(true);
    });

    it('should combine search and priority filters across all boards', async () => {
      taskStore.setFilters({ 
        search: 'project',
        priority: 'medium' 
      });
      
      await new Promise(resolve => setTimeout(resolve, 400));

      const { filteredTasks } = useTaskStore.getState();
      
      expect(filteredTasks.length).toBeGreaterThan(0);
      expect(filteredTasks.every(task => 
        task.title.toLowerCase().includes('project') && task.priority === 'medium'
      )).toBe(true);
    });

    it('should combine search and tag filters across all boards', async () => {
      taskStore.setFilters({ 
        search: 'Alpha',
        tags: ['common-tag'] 
      });
      
      await new Promise(resolve => setTimeout(resolve, 400));

      const { filteredTasks } = useTaskStore.getState();
      
      expect(filteredTasks.length).toBeGreaterThan(0);
      expect(filteredTasks.every(task => 
        task.title.toLowerCase().includes('alpha') && 
        task.tags.includes('common-tag')
      )).toBe(true);
    });

    it('should handle complex multi-filter combinations', async () => {
      const dateRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        end: new Date(),
      };

      taskStore.setFilters({ 
        search: 'task',
        status: 'todo',
        tags: ['common-tag'],
        dateRange
      });
      
      await new Promise(resolve => setTimeout(resolve, 400));

      const { filteredTasks } = useTaskStore.getState();
      
      filteredTasks.forEach(task => {
        expect(task.title.toLowerCase()).toContain('task');
        expect(task.status).toBe('todo');
        expect(task.tags).toContain('common-tag');
        expect(task.createdAt.getTime()).toBeGreaterThanOrEqual(dateRange.start.getTime());
        expect(task.createdAt.getTime()).toBeLessThanOrEqual(dateRange.end.getTime());
      });
    });
  });

  describe('Performance with Multiple Boards and Tasks', () => {
    beforeEach(() => {
      // Generate large dataset
      const largeBoards: Board[] = Array.from({ length: 10 }, (_, i) => 
        generateBoard(`board-${i + 1}`, `Board ${i + 1}`)
      );

      const largeTasks: Task[] = Array.from({ length: 1000 }, (_, i) => 
        generateTask(
          `task-${i + 1}`, 
          `Task ${i + 1} with searchable content`, 
          `board-${(i % 10) + 1}`
        )
      );

      boardStore.setBoards(largeBoards);
      taskStore.setTasks(largeTasks);
      taskStore.setCrossBoardSearch(true);
    });

    it('should perform cross-board search within performance threshold', async () => {
      const startTime = performance.now();
      
      taskStore.setSearchQuery('searchable');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 500ms as per requirements
      expect(duration).toBeLessThan(500);

      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks.length).toBe(1000); // All tasks match "searchable"
    });

    it('should maintain performance with complex filters', async () => {
      const startTime = performance.now();
      
      taskStore.setFilters({
        search: 'Task',
        status: 'todo',
        tags: ['common-tag'],
      });
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(400);

      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks.length).toBeGreaterThan(0);
    });

    it('should cache search results for improved performance', async () => {
      // First search
      const startTime1 = performance.now();
      taskStore.setSearchQuery('Task 100');
      await new Promise(resolve => setTimeout(resolve, 400));
      const endTime1 = performance.now();
      const firstSearchDuration = endTime1 - startTime1;

      // Second identical search (should use cache)
      const startTime2 = performance.now();
      taskStore.setSearchQuery('Task 100');
      await new Promise(resolve => setTimeout(resolve, 400));
      const endTime2 = performance.now();
      const cachedSearchDuration = endTime2 - startTime2;

      // Cached search should be faster
      expect(cachedSearchDuration).toBeLessThan(firstSearchDuration * 0.8);

      const { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].title).toBe('Task 100 with searchable content');
    });
  });

  describe('Board Navigation and Task Highlighting', () => {
    beforeEach(async () => {
      taskStore.setCrossBoardSearch(true);
      await taskStore.applyFilters();
    });

    it('should navigate to task board and highlight task', async () => {
      const targetTask = testTasks.find(t => t.boardId === 'board-2')!;
      
      const result = await taskStore.navigateToTaskBoard(targetTask.id);
      
      expect(result.success).toBe(true);
      expect(result.boardId).toBe('board-2');

      const { searchState } = useTaskStore.getState();
      expect(searchState.highlightedTaskId).toBe(targetTask.id);
    });

    it('should handle navigation to non-existent task', async () => {
      const result = await taskStore.navigateToTaskBoard('non-existent-task');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    it('should handle navigation to task on deleted board', async () => {
      // Mock board as deleted
      (taskDB.getBoards as ReturnType<typeof vi.fn>).mockResolvedValue(
        testBoards.filter(b => b.id !== 'board-3')
      );

      const alphaTask = testTasks.find(t => t.boardId === 'board-3')!;
      const result = await taskStore.navigateToTaskBoard(alphaTask.id);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('board no longer exists');
    });

    it('should clear search when navigating to board', () => {
      taskStore.setSearchQuery('test search');
      
      taskStore.clearSearch();
      
      const { filters, searchState } = useTaskStore.getState();
      expect(filters.search).toBe('');
      expect(searchState.highlightedTaskId).toBeUndefined();
    });
  });

  describe('Search Scope Persistence', () => {
    it('should remember search scope when enabled', async () => {
      // Enable remember scope
      await settingsStore.updateSettings({
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: true,
        },
      });

      // Change to cross-board search
      taskStore.setCrossBoardSearch(true);

      // Verify preference was saved
      expect(taskDB.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          searchPreferences: expect.objectContaining({
            defaultScope: 'all-boards',
          }),
        })
      );
    });

    it('should not save scope when remember is disabled', async () => {
      // Disable remember scope
      await settingsStore.updateSettings({
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: false,
        },
      });

      // Change to cross-board search
      taskStore.setCrossBoardSearch(true);

      // Verify preference was not saved (only called once for the initial settings update)
      expect(taskDB.updateSettings).toHaveBeenCalledTimes(1);
    });

    it('should load saved scope preference on initialization', async () => {
      // Mock saved preference
      (taskDB.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        theme: 'system',
        autoArchiveDays: 30,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
        searchPreferences: {
          defaultScope: 'all-boards',
          rememberScope: true,
        },
      });

      await taskStore.loadSearchPreferences();

      const { filters, searchState } = useTaskStore.getState();
      expect(filters.crossBoardSearch).toBe(true);
      expect(searchState.scope).toBe('all-boards');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle board deletion during active search', async () => {
      taskStore.setCrossBoardSearch(true);
      taskStore.setSearchQuery('Alpha');
      
      await new Promise(resolve => setTimeout(resolve, 400));

      let { filteredTasks } = useTaskStore.getState();
      expect(filteredTasks).toHaveLength(2); // Alpha tasks

      // Simulate board deletion
      taskStore.handleBoardDeletion('board-3');

      ({ filteredTasks } = useTaskStore.getState());
      expect(filteredTasks).toHaveLength(0); // Alpha tasks removed
    });

    it('should recover from search errors gracefully', async () => {
      taskStore.setCrossBoardSearch(true);
      taskStore.setSearchQuery('problematic search');

      // Simulate search error
      useTaskStore.setState({ 
        error: 'Search failed',
        isSearching: true 
      });

      taskStore.recoverFromSearchError();

      const { filters, isSearching, error, searchCache } = useTaskStore.getState();
      expect(filters.search).toBe('');
      expect(isSearching).toBe(false);
      expect(error).toBeNull();
      expect(searchCache.size).toBe(0);
    });

    it('should validate task integrity during filtering', async () => {
      // Add invalid task - using Partial<Task> to represent incomplete/invalid task data
      const invalidTask = {
        id: 'invalid-task',
        title: null, // Invalid
        boardId: 'board-1',
      } as Partial<Task> & { id: string; boardId: string };

      taskStore.setTasks([...testTasks, invalidTask]);
      taskStore.setCrossBoardSearch(true);
      
      await taskStore.applyFilters();

      const { tasks, filteredTasks } = useTaskStore.getState();
      
      // Invalid task should be filtered out
      expect(tasks.every(task => taskStore.validateTaskIntegrity(task))).toBe(true);
      expect(filteredTasks.every(task => taskStore.validateTaskIntegrity(task))).toBe(true);
    });

    it('should handle corrupted cache gracefully', async () => {
      taskStore.setCrossBoardSearch(true);
      
      // Set up corrupted cache
      const corruptedCache = new Map();
      corruptedCache.set('test-key', { results: null, timestamp: Date.now() });
      
      useTaskStore.setState({ searchCache: corruptedCache });
      
      taskStore.setSearchQuery('test');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should not crash and should work normally
      const { filteredTasks, error } = useTaskStore.getState();
      expect(error).toBeNull();
      expect(Array.isArray(filteredTasks)).toBe(true);
    });
  });
});