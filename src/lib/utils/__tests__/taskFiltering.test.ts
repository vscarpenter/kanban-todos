import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Board, Task, TaskFilters } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { logger } from '@/lib/utils/logger';
import {
  cacheResults,
  checkCache,
  cleanupExpiredCache,
  generateCacheKey,
  isComplexSearch,
  validateBoardAccess,
  type SearchCache,
} from '@/lib/utils/taskFiltering';

const mocks = vi.hoisted(() => ({
  getBoards: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    getBoards: mocks.getBoards,
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
  },
}));

const date = new Date('2026-01-15T12:00:00.000Z');

const makeBoard = (overrides: Partial<Board> = {}): Board => ({
  id: 'board-1',
  name: 'Work',
  color: '#2563eb',
  isDefault: false,
  order: 0,
  createdAt: date,
  updatedAt: date,
  ...overrides,
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Task',
  status: 'todo',
  boardId: 'board-1',
  priority: 'medium',
  tags: [],
  createdAt: date,
  updatedAt: date,
  ...overrides,
});

describe('taskFiltering utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskDB.getBoards).mockResolvedValue([
      makeBoard({ id: 'board-1' }),
      makeBoard({ id: 'board-archived', archivedAt: date }),
    ]);
  });

  it('filters tasks from archived or missing boards during cross-board access validation', async () => {
    const tasks = [
      makeTask({ id: 'task-active', boardId: 'board-1' }),
      makeTask({ id: 'task-archived', boardId: 'board-archived' }),
      makeTask({ id: 'task-missing', boardId: 'missing-board' }),
    ];

    const result = await validateBoardAccess(tasks);

    expect(result.map(task => task.id)).toEqual(['task-active']);
    expect(logger.info).toHaveBeenCalledWith('Filtered tasks from inaccessible boards', {
      filteredCount: 2,
    });
  });

  it('returns original tasks and logs when board access validation cannot load boards', async () => {
    const tasks = [makeTask({ id: 'task-1' })];
    const error = new Error('indexeddb unavailable');
    vi.mocked(taskDB.getBoards).mockRejectedValueOnce(error);

    const result = await validateBoardAccess(tasks);

    expect(result).toBe(tasks);
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to validate board access, proceeding with existing tasks',
      error
    );
  });

  it('generates stable cache keys with sorted tags and serialized date ranges', () => {
    const filters: TaskFilters = {
      search: 'roadmap',
      status: 'todo',
      priority: 'high',
      tags: ['zeta', 'alpha'],
      boardId: 'board-1',
      crossBoardSearch: true,
      dateRange: {
        start: new Date('2026-01-01T00:00:00.000Z'),
        end: new Date('2026-01-31T23:59:59.000Z'),
      },
    };

    const cacheKey = generateCacheKey(filters);

    expect(JSON.parse(cacheKey)).toEqual({
      search: 'roadmap',
      status: 'todo',
      priority: 'high',
      tags: ['alpha', 'zeta'],
      boardId: 'board-1',
      crossBoardSearch: true,
      dateRange: {
        start: new Date('2026-01-01T00:00:00.000Z').getTime(),
        end: new Date('2026-01-31T23:59:59.000Z').getTime(),
      },
    });
  });

  it('returns valid cached results while deleting expired and stale entries', () => {
    const cache: SearchCache = new Map();
    const freshTask = makeTask({ id: 'fresh' });
    const missingTask = makeTask({ id: 'missing' });
    cache.set('fresh', { results: [freshTask], timestamp: Date.now() });
    cache.set('expired', { results: [freshTask], timestamp: Date.now() - 300_001 });
    cache.set('stale', { results: [missingTask], timestamp: Date.now() });

    expect(checkCache('fresh', cache, [freshTask])).toEqual([freshTask]);
    expect(checkCache('expired', cache, [freshTask])).toBeNull();
    expect(cache.has('expired')).toBe(false);
    expect(checkCache('stale', cache, [freshTask])).toBeNull();
    expect(cache.has('stale')).toBe(false);
  });

  it('prunes the oldest cache entries before adding new results at max size', () => {
    const cache: SearchCache = new Map();
    for (let i = 0; i < 50; i++) {
      cache.set(`key-${i}`, { results: [], timestamp: Date.now() });
    }

    cacheResults('new-key', [makeTask()], cache);

    expect(cache.size).toBe(41);
    expect(cache.has('key-0')).toBe(false);
    expect(cache.has('key-9')).toBe(false);
    expect(cache.has('key-10')).toBe(true);
    expect(cache.has('new-key')).toBe(true);
  });

  it('clears the cache and logs when cache writes fail', () => {
    const cache: SearchCache = new Map();
    cache.set('existing', { results: [], timestamp: Date.now() });
    vi.spyOn(cache, 'set').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    cacheResults('new-key', [makeTask()], cache);

    expect(cache.size).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to cache search results',
      expect.any(Error)
    );
  });

  it('removes expired entries during cleanup and detects complex searches', () => {
    const cache: SearchCache = new Map();
    cache.set('expired', { results: [], timestamp: Date.now() - 300_001 });
    cache.set('fresh', { results: [], timestamp: Date.now() });

    cleanupExpiredCache(cache);

    expect(cache.has('expired')).toBe(false);
    expect(cache.has('fresh')).toBe(true);
    expect(isComplexSearch(Array.from({ length: 201 }, () => makeTask()), {
      search: 'task',
      tags: [],
      crossBoardSearch: false,
    })).toBe(true);
  });
});
