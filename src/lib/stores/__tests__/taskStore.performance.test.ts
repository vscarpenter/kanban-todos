import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTaskStore } from '../taskStore';
import { Task } from '@/lib/types';

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn(),
    getTasks: vi.fn().mockResolvedValue([]),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({
      searchPreferences: { defaultScope: 'current-board', rememberScope: false }
    }),
    updateSettings: vi.fn(),
  },
}));

// Generate test data
const generateTestTasks = (count: number): Task[] => {
  const statuses: Task['status'][] = ['todo', 'in-progress', 'done'];
  const priorities: Task['priority'][] = ['low', 'medium', 'high'];
  const boards = ['board-1', 'board-2', 'board-3', 'board-4', 'board-5'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Task ${i} - ${['Important', 'Urgent', 'Regular', 'Minor'][i % 4]} work`,
    description: `Description for task ${i} with some searchable content and keywords`,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    boardId: boards[i % boards.length],
    tags: [`tag-${i % 10}`, `category-${i % 5}`],
    createdAt: new Date(Date.now() - i * 1000 * 60 * 60), // Spread over hours
    updatedAt: new Date(Date.now() - i * 1000 * 60 * 30), // Updated more recently
  }));
};

describe('TaskStore Performance Tests', () => {
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
    });
  });

  it('should filter 1000 tasks within performance threshold', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(1000);
    
    store.setTasks(testTasks);
    
    const startTime = performance.now();
    
    // Test search performance
    store.setFilters({ search: 'Important' });
    await store.applyFilters();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within 500ms as per requirements
    expect(duration).toBeLessThan(500);
    
    // Should return correct results
    const { filteredTasks } = useTaskStore.getState();
    expect(filteredTasks.length).toBeGreaterThan(0);
    expect(filteredTasks.every(task => 
      task.title.toLowerCase().includes('important')
    )).toBe(true);
  });

  it('should handle cross-board search efficiently', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(500);
    
    store.setTasks(testTasks);
    
    const startTime = performance.now();
    
    // Enable cross-board search and apply filters
    store.setCrossBoardSearch(true);
    store.setFilters({ search: 'work', status: 'todo' });
    await store.applyFilters();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete efficiently
    expect(duration).toBeLessThan(300);
    
    const { filteredTasks } = useTaskStore.getState();
    expect(filteredTasks.length).toBeGreaterThan(0);
    expect(filteredTasks.every(task => 
      task.title.toLowerCase().includes('work') && task.status === 'todo'
    )).toBe(true);
  });

  it('should cache search results effectively', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(200);
    
    store.setTasks(testTasks);
    
    // First search - should populate cache
    const startTime1 = performance.now();
    store.setFilters({ search: 'Urgent' });
    await store.applyFilters();
    const endTime1 = performance.now();
    const firstSearchDuration = endTime1 - startTime1;
    
    // Second identical search - should use cache
    const startTime2 = performance.now();
    store.setFilters({ search: 'Urgent' });
    await store.applyFilters();
    const endTime2 = performance.now();
    const cachedSearchDuration = endTime2 - startTime2;
    
    // Cached search should be significantly faster
    expect(cachedSearchDuration).toBeLessThan(firstSearchDuration * 0.5);
    
    // Results should be identical
    const { filteredTasks } = useTaskStore.getState();
    expect(filteredTasks.length).toBeGreaterThan(0);
  });

  it('should handle complex filter combinations efficiently', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(800);
    
    store.setTasks(testTasks);
    
    const startTime = performance.now();
    
    // Apply multiple filters
    store.setFilters({
      search: 'task',
      status: 'in-progress',
      priority: 'high',
      tags: ['tag-1', 'tag-2'],
      crossBoardSearch: true,
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date()
      }
    });
    await store.applyFilters();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should handle complex filters efficiently
    expect(duration).toBeLessThan(400);
    
    const { filteredTasks } = useTaskStore.getState();
    // Verify all filters are applied correctly
    filteredTasks.forEach(task => {
      expect(task.title.toLowerCase()).toContain('task');
      expect(task.status).toBe('in-progress');
      expect(task.priority).toBe('high');
      expect(task.tags.some(tag => ['tag-1', 'tag-2'].includes(tag))).toBe(true);
    });
  });

  it('should manage cache size and cleanup old entries', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(100);
    
    store.setTasks(testTasks);
    
    // Perform many different searches to fill cache
    const searchTerms = Array.from({ length: 60 }, (_, i) => `search-${i}`);
    
    for (const term of searchTerms) {
      store.setFilters({ search: term });
      await store.applyFilters();
    }
    
    const { searchCache } = useTaskStore.getState();
    
    // Cache should not exceed maximum size
    expect(searchCache.size).toBeLessThanOrEqual(50);
  });

  it('should handle search debouncing correctly', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(100);
    
    store.setTasks(testTasks);
    
    // Test that rapid search queries result in correct final state
    store.setSearchQuery('t');
    store.setSearchQuery('ta');
    store.setSearchQuery('tas');
    store.setSearchQuery('task');
    
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const { filters, filteredTasks } = useTaskStore.getState();
    
    // Should have the final search query
    expect(filters.search).toBe('task');
    // Should have filtered results
    expect(filteredTasks.length).toBeGreaterThan(0);
    expect(filteredTasks.every(task => 
      task.title.toLowerCase().includes('task')
    )).toBe(true);
  });

  it('should handle error conditions gracefully', async () => {
    const store = useTaskStore.getState();
    
    // Mock a filter operation that throws an error
    const applyFiltersSpy = vi.spyOn(store, 'applyFilters').mockRejectedValue(new Error('Filter operation failed'));
    
    store.setSearchQuery('test');
    
    // Wait for debounced operation
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const { error, isSearching } = useTaskStore.getState();
    
    expect(error).toBe('Filter operation failed');
    expect(isSearching).toBe(false);
    
    applyFiltersSpy.mockRestore();
  });

  it('should track performance metrics correctly', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(100);
    
    store.setTasks(testTasks);
    
    // Perform multiple searches
    store.setSearchQuery('task');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    store.setSearchQuery('important');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const metrics = store.getSearchPerformanceMetrics();
    
    expect(metrics.searchCount).toBe(2);
    expect(metrics.lastSearchDuration).toBeGreaterThan(0);
    expect(metrics.averageSearchDuration).toBeGreaterThan(0);
  });

  it('should reset performance metrics', () => {
    const store = useTaskStore.getState();
    
    // Set some metrics
    useTaskStore.setState({
      searchPerformanceMetrics: {
        lastSearchDuration: 100,
        averageSearchDuration: 150,
        searchCount: 5,
      }
    });
    
    store.resetPerformanceMetrics();
    
    const metrics = store.getSearchPerformanceMetrics();
    expect(metrics.lastSearchDuration).toBe(0);
    expect(metrics.averageSearchDuration).toBe(0);
    expect(metrics.searchCount).toBe(0);
  });

  it('should show loading state for complex searches', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(300); // Large dataset
    
    store.setTasks(testTasks);
    store.setCrossBoardSearch(true);
    
    // Start a complex search
    const searchPromise = new Promise<void>((resolve) => {
      store.setSearchQuery('complex search term');
      setTimeout(resolve, 100);
    });
    
    // Check that loading state is set
    await new Promise(resolve => setTimeout(resolve, 50));
    const { isSearching } = useTaskStore.getState();
    expect(isSearching).toBe(true);
    
    await searchPromise;
    await new Promise(resolve => setTimeout(resolve, 400)); // Wait for debounce
    
    const finalState = useTaskStore.getState();
    expect(finalState.isSearching).toBe(false);
  });

  it('should clear cache when tasks are modified', async () => {
    const store = useTaskStore.getState();
    const testTasks = generateTestTasks(50);
    
    store.setTasks(testTasks);
    
    // Populate cache with a search
    store.setFilters({ search: 'task' });
    await store.applyFilters();
    
    let { searchCache } = useTaskStore.getState();
    expect(searchCache.size).toBeGreaterThan(0);
    
    // Simulate task modification by directly updating tasks
    const newTask: Task = {
      id: 'new-task',
      title: 'New Task',
      description: 'New task description',
      status: 'todo',
      priority: 'medium',
      boardId: 'board-1',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Directly update the store to simulate task addition
    store.setTasks([...testTasks, newTask]);
    
    // Cache should be cleared when tasks change
    ({ searchCache } = useTaskStore.getState());
    expect(searchCache.size).toBe(0);
  });
});