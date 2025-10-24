import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskCache, isComplexSearch } from '../taskCaching';
import { Task, TaskFilters } from '@/lib/types';

// Helper to create test task
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Test Task',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    boardId: 'board-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

// Helper to create test filters
function createFilters(overrides: Partial<TaskFilters> = {}): TaskFilters {
  return {
    search: '',
    tags: [],
    crossBoardSearch: false,
    ...overrides
  };
}

describe('taskCaching utility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TaskCache class', () => {
    let cache: TaskCache;

    beforeEach(() => {
      cache = new TaskCache();
    });

    describe('basic cache operations', () => {
      it('starts with empty cache', () => {
        expect(cache.size()).toBe(0);
      });

      it('stores and retrieves cached results', () => {
        const tasks = [createTask({ title: 'Task 1' }), createTask({ title: 'Task 2' })];
        const filters = createFilters({ search: 'test' });

        cache.set(filters, tasks);
        const result = cache.get(filters, tasks);

        expect(result).toEqual(tasks);
        expect(cache.size()).toBe(1);
      });

      it('returns null for cache miss', () => {
        const tasks = [createTask()];
        const filters = createFilters({ search: 'test' });

        const result = cache.get(filters, tasks);
        expect(result).toBeNull();
      });

      it('clears all cache entries', () => {
        const tasks = [createTask()];
        cache.set(createFilters({ search: 'test1' }), tasks);
        cache.set(createFilters({ search: 'test2' }), tasks);

        expect(cache.size()).toBe(2);

        cache.clear();
        expect(cache.size()).toBe(0);
      });
    });

    describe('cache key generation', () => {
      it('generates same key for identical filters', () => {
        const tasks = [createTask()];
        const filters1 = createFilters({ search: 'test', status: 'todo' });
        const filters2 = createFilters({ search: 'test', status: 'todo' });

        cache.set(filters1, tasks);
        const result = cache.get(filters2, tasks);

        expect(result).toEqual(tasks); // Cache hit
      });

      it('generates different keys for different filters', () => {
        const tasks = [createTask()];
        const filters1 = createFilters({ search: 'test1' });
        const filters2 = createFilters({ search: 'test2' });

        cache.set(filters1, tasks);
        const result = cache.get(filters2, tasks);

        expect(result).toBeNull(); // Cache miss
      });

      it('considers tag order when generating keys', () => {
        const tasks = [createTask()];
        const filters1 = createFilters({ tags: ['a', 'b', 'c'] });
        const filters2 = createFilters({ tags: ['c', 'b', 'a'] });

        cache.set(filters1, tasks);
        const result = cache.get(filters2, tasks);

        // Should cache hit - tags are sorted internally
        expect(result).toEqual(tasks);
      });

      it('considers all filter fields', () => {
        const tasks = [createTask()];
        const dateRange = {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        };

        const filters = createFilters({
          search: 'test',
          status: 'todo',
          priority: 'high',
          tags: ['urgent'],
          boardId: 'board-123',
          crossBoardSearch: true,
          dateRange
        });

        cache.set(filters, tasks);
        const result = cache.get(filters, tasks);

        expect(result).toEqual(tasks);
      });
    });

    describe('cache expiration', () => {
      it('invalidates cache after TTL expires', () => {
        const tasks = [createTask()];
        const filters = createFilters({ search: 'test' });

        cache.set(filters, tasks);

        // Fast-forward time by 6 minutes (TTL is 5 minutes)
        const futureTime = Date.now() + 6 * 60 * 1000;
        vi.spyOn(Date, 'now').mockReturnValue(futureTime);

        const result = cache.get(filters, tasks);
        expect(result).toBeNull();
      });

      it('returns cached results before TTL expires', () => {
        const tasks = [createTask()];
        const filters = createFilters({ search: 'test' });

        cache.set(filters, tasks);

        // Fast-forward time by 2 minutes (TTL is 5 minutes)
        const futureTime = Date.now() + 2 * 60 * 1000;
        vi.spyOn(Date, 'now').mockReturnValue(futureTime);

        const result = cache.get(filters, tasks);
        expect(result).toEqual(tasks);
      });

      it('cleanup removes expired entries', () => {
        const tasks = [createTask()];

        cache.set(createFilters({ search: 'test1' }), tasks);
        cache.set(createFilters({ search: 'test2' }), tasks);

        // Fast-forward time by 6 minutes
        const futureTime = Date.now() + 6 * 60 * 1000;
        vi.spyOn(Date, 'now').mockReturnValue(futureTime);

        cache.cleanupExpired();
        expect(cache.size()).toBe(0);
      });

      it('cleanup preserves non-expired entries', () => {
        const tasks = [createTask()];
        const now = Date.now();

        // Add first entry
        cache.set(createFilters({ search: 'test1' }), tasks);

        // Fast-forward 4 minutes and add second entry
        vi.spyOn(Date, 'now').mockReturnValue(now + 4 * 60 * 1000);
        cache.set(createFilters({ search: 'test2' }), tasks);

        // Fast-forward to 6 minutes total (first entry expired, second still valid)
        vi.spyOn(Date, 'now').mockReturnValue(now + 6 * 60 * 1000);

        cache.cleanupExpired();
        expect(cache.size()).toBe(1);
      });
    });

    describe('cache invalidation on task changes', () => {
      it('invalidates cache when cached task is deleted', () => {
        const task1 = createTask({ id: 'task-1', title: 'Task 1' });
        const task2 = createTask({ id: 'task-2', title: 'Task 2' });
        const tasks = [task1, task2];
        const filters = createFilters({ search: 'test' });

        cache.set(filters, [task1, task2]);

        // Task 1 was deleted
        const remainingTasks = [task2];
        const result = cache.get(filters, remainingTasks);

        // Should invalidate cache when any cached task is deleted
        expect(result).toBeNull();
      });

      it('invalidates cache when all cached tasks are deleted', () => {
        const task1 = createTask({ id: 'task-1' });
        const task2 = createTask({ id: 'task-2' });
        const filters = createFilters({ search: 'test' });

        cache.set(filters, [task1, task2]);

        // All tasks deleted
        const emptyTasks: Task[] = [];
        const result = cache.get(filters, emptyTasks);

        expect(result).toBeNull();
      });

      it('returns cache when tasks are added', () => {
        const task1 = createTask({ id: 'task-1' });
        const filters = createFilters({ search: 'test' });

        cache.set(filters, [task1]);

        // New task added
        const task2 = createTask({ id: 'task-2' });
        const expandedTasks = [task1, task2];
        const result = cache.get(filters, expandedTasks);

        // Should still return cached result (just task1)
        expect(result).toEqual([task1]);
      });
    });

    describe('cache size management', () => {
      it('evicts oldest entries when at max capacity', () => {
        const tasks = [createTask()];

        // Fill cache to max (50 entries)
        for (let i = 0; i < 50; i++) {
          cache.set(createFilters({ search: `test${i}` }), tasks);
        }

        expect(cache.size()).toBe(50);

        // Adding one more should trigger eviction
        cache.set(createFilters({ search: 'test-new' }), tasks);

        // Should have removed 20% (10 entries) and added 1 new = 41 total
        expect(cache.size()).toBe(41);
      });

      it('handles cache storage errors gracefully', () => {
        const tasks = [createTask()];
        const filters = createFilters({ search: 'test' });

        // Mock Map.set to throw error
        const originalSet = Map.prototype.set;
        Map.prototype.set = vi.fn().mockImplementation(() => {
          throw new Error('Storage error');
        });

        cache.set(filters, tasks);

        // Should log warning and clear cache
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to cache search results:',
          expect.any(Error)
        );

        Map.prototype.set = originalSet;
      });
    });

    describe('getRawCache (deprecated)', () => {
      it('returns underlying Map', () => {
        const rawCache = cache.getRawCache();
        expect(rawCache instanceof Map).toBe(true);
      });

      it('allows direct Map operations', () => {
        const tasks = [createTask()];
        const filters = createFilters({ search: 'test' });

        cache.set(filters, tasks);
        const rawCache = cache.getRawCache();

        expect(rawCache.size).toBe(1);
      });
    });
  });

  describe('isComplexSearch', () => {
    it('returns false for empty search', () => {
      const tasks = Array.from({ length: 1000 }, () => createTask());
      const filters = createFilters({ search: '' });

      expect(isComplexSearch(tasks, filters)).toBe(false);
    });

    it('returns false for simple search on small dataset', () => {
      const tasks = Array.from({ length: 100 }, () => createTask());
      const filters = createFilters({ search: 'test' });

      expect(isComplexSearch(tasks, filters)).toBe(false);
    });

    it('returns true for search on large dataset (>200 tasks)', () => {
      const tasks = Array.from({ length: 201 }, () => createTask());
      const filters = createFilters({ search: 'test' });

      expect(isComplexSearch(tasks, filters)).toBe(true);
    });

    it('returns true for cross-board search', () => {
      const tasks = [createTask()];
      const filters = createFilters({
        search: 'test',
        crossBoardSearch: true
      });

      expect(isComplexSearch(tasks, filters)).toBe(true);
    });

    it('returns true for search with tag filters', () => {
      const tasks = [createTask()];
      const filters = createFilters({
        search: 'test',
        tags: ['urgent']
      });

      expect(isComplexSearch(tasks, filters)).toBe(true);
    });

    it('returns true for search with date range', () => {
      const tasks = [createTask()];
      const filters = createFilters({
        search: 'test',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      });

      expect(isComplexSearch(tasks, filters)).toBe(true);
    });

    it('returns true when multiple complexity factors are present', () => {
      const tasks = Array.from({ length: 300 }, () => createTask());
      const filters = createFilters({
        search: 'test',
        crossBoardSearch: true,
        tags: ['urgent', 'bug']
      });

      expect(isComplexSearch(tasks, filters)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    let cache: TaskCache;

    beforeEach(() => {
      cache = new TaskCache();
    });

    it('handles rapid repeated searches (toggle pattern)', () => {
      const tasks = Array.from({ length: 100 }, (_, i) =>
        createTask({ title: `Task ${i}` })
      );

      const filters1 = createFilters({ search: 'urgent' });
      const filters2 = createFilters({ search: 'bug' });

      const results1 = tasks.slice(0, 10);
      const results2 = tasks.slice(10, 20);

      // First searches - cache misses
      cache.set(filters1, results1);
      cache.set(filters2, results2);

      // User toggles between searches multiple times
      expect(cache.get(filters1, tasks)).toEqual(results1); // Cache hit
      expect(cache.get(filters2, tasks)).toEqual(results2); // Cache hit
      expect(cache.get(filters1, tasks)).toEqual(results1); // Cache hit
      expect(cache.get(filters2, tasks)).toEqual(results2); // Cache hit
    });

    it('handles bulk task deletion correctly', () => {
      const tasks = Array.from({ length: 100 }, (_, i) =>
        createTask({ id: `task-${i}`, title: `Task ${i}` })
      );

      const filters = createFilters({ search: 'test' });
      cache.set(filters, tasks);

      // User deletes 50 tasks
      const remainingTasks = tasks.slice(50);
      const result = cache.get(filters, remainingTasks);

      // Should invalidate cache when tasks are deleted
      expect(result).toBeNull();
    });

    it('maintains performance with frequent cache cleanup', () => {
      const tasks = [createTask()];

      // Add many entries
      for (let i = 0; i < 30; i++) {
        cache.set(createFilters({ search: `test${i}` }), tasks);
      }

      // Periodic cleanup (10% chance in actual code)
      cache.cleanupExpired();
      cache.cleanupExpired();
      cache.cleanupExpired();

      // Should not affect non-expired entries
      expect(cache.size()).toBe(30);
    });
  });
});
