import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Unmock the database module since the global setup.ts mocks it
vi.unmock('@/lib/utils/database');

import { TaskDatabase } from '../database';
import type { Task, Board, Settings } from '@/lib/types';

function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2, 9)}`,
    title: 'Test Task',
    description: 'A test task',
    status: 'todo',
    boardId: 'board-1',
    priority: 'medium',
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createTestBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: `board-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Test Board',
    description: 'A test board',
    color: '#3b82f6',
    isDefault: false,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('TaskDatabase', () => {
  let db: TaskDatabase;

  beforeEach(async () => {
    db = new TaskDatabase();
    await db.init();
  });

  afterEach(async () => {
    try {
      await db.resetDatabase();
    } catch {
      // Database may not be initialized in error-handling tests
    }
  });

  describe('init', () => {
    it('initializes without error', async () => {
      const freshDB = new TaskDatabase();
      await expect(freshDB.init()).resolves.toBeUndefined();
    });

    it('rejects with a clear message instead of hanging forever when the open request is blocked', async () => {
      const freshDB = new TaskDatabase();

      // Simulates another tab holding an older-version connection open,
      // which makes IndexedDB report the open request as blocked instead of
      // resolving or erroring.
      const openSpy = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
        const request = {} as IDBOpenDBRequest;
        queueMicrotask(() => {
          request.onblocked?.(new Event('blocked') as IDBVersionChangeEvent);
        });
        return request;
      });

      await expect(freshDB.init()).rejects.toThrow(/blocked/i);

      openSpy.mockRestore();
    });
  });

  describe('task CRUD operations', () => {
    it('adds and retrieves a task', async () => {
      const task = createTestTask({ id: 'task-1' });

      await db.addTask(task);
      const tasks = await db.getTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-1');
      expect(tasks[0].title).toBe('Test Task');
    });

    it('retrieves all tasks when no boardId filter', async () => {
      await db.addTask(createTestTask({ id: 'task-1', boardId: 'board-1' }));
      await db.addTask(createTestTask({ id: 'task-2', boardId: 'board-2' }));

      const tasks = await db.getTasks();

      expect(tasks).toHaveLength(2);
    });

    it('filters tasks by boardId', async () => {
      await db.addTask(createTestTask({ id: 'task-1', boardId: 'board-1' }));
      await db.addTask(createTestTask({ id: 'task-2', boardId: 'board-2' }));
      await db.addTask(createTestTask({ id: 'task-3', boardId: 'board-1' }));

      const tasks = await db.getTasks('board-1');

      expect(tasks).toHaveLength(2);
      tasks.forEach((task) => {
        expect(task.boardId).toBe('board-1');
      });
    });

    it('updates a task', async () => {
      const task = createTestTask({ id: 'task-1', title: 'Original' });
      await db.addTask(task);

      const updatedTask = { ...task, title: 'Updated', updatedAt: new Date() };
      await db.updateTask(updatedTask);

      const tasks = await db.getTasks();
      expect(tasks[0].title).toBe('Updated');
    });

    it('deletes a task', async () => {
      await db.addTask(createTestTask({ id: 'task-1' }));
      await db.addTask(createTestTask({ id: 'task-2' }));

      await db.deleteTask('task-1');

      const tasks = await db.getTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('task-2');
    });
  });

  describe('board CRUD operations', () => {
    it('adds and retrieves a board', async () => {
      const board = createTestBoard({ id: 'board-1', name: 'My Board' });

      await db.addBoard(board);
      const boards = await db.getBoards();

      expect(boards).toHaveLength(1);
      expect(boards[0].id).toBe('board-1');
      expect(boards[0].name).toBe('My Board');
    });

    it('retrieves multiple boards', async () => {
      await db.addBoard(createTestBoard({ id: 'board-1', order: 0 }));
      await db.addBoard(createTestBoard({ id: 'board-2', order: 1 }));

      const boards = await db.getBoards();

      expect(boards).toHaveLength(2);
    });

    it('updates a board', async () => {
      const board = createTestBoard({ id: 'board-1', name: 'Original' });
      await db.addBoard(board);

      const updated = { ...board, name: 'Updated', updatedAt: new Date() };
      await db.updateBoard(updated);

      const boards = await db.getBoards();
      expect(boards[0].name).toBe('Updated');
    });

    it('deletes a board', async () => {
      await db.addBoard(createTestBoard({ id: 'board-1' }));
      await db.addBoard(createTestBoard({ id: 'board-2' }));

      await db.deleteBoard('board-1');

      const boards = await db.getBoards();
      expect(boards).toHaveLength(1);
      expect(boards[0].id).toBe('board-2');
    });

    it('cascades to the board tasks, leaving other boards untouched', async () => {
      await db.addBoard(createTestBoard({ id: 'board-1' }));
      await db.addBoard(createTestBoard({ id: 'board-2' }));
      await db.addTask(createTestTask({ id: 'task-1', boardId: 'board-1' }));
      await db.addTask(createTestTask({ id: 'task-2', boardId: 'board-1', archivedAt: new Date() }));
      await db.addTask(createTestTask({ id: 'task-3', boardId: 'board-2' }));

      await db.deleteBoard('board-1');

      const boards = await db.getBoards();
      const tasks = await db.getTasks();
      expect(boards.map(b => b.id)).toEqual(['board-2']);
      // both the active and the archived task on board-1 are gone; no orphans
      expect(tasks.map(t => t.id)).toEqual(['task-3']);
    });
  });

  describe('settings operations', () => {
    it('returns undefined when no settings exist', async () => {
      const settings = await db.getSettings();
      expect(settings).toBeUndefined();
    });

    it('saves and retrieves settings', async () => {
      const settings: Settings = {
        theme: 'dark',
        autoArchiveDays: 30,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: true,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      };

      await db.updateSettings(settings);
      const retrieved = await db.getSettings();

      expect(retrieved).toBeDefined();
      expect(retrieved?.theme).toBe('dark');
      expect(retrieved?.autoArchiveDays).toBe(30);
    });

    it('updates existing settings', async () => {
      const settings: Settings = {
        theme: 'light',
        autoArchiveDays: 7,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        searchPreferences: {
          defaultScope: 'current-board',
          rememberScope: true,
        },
        accessibility: {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
        },
      };

      await db.updateSettings(settings);
      await db.updateSettings({ ...settings, theme: 'dark' });

      const retrieved = await db.getSettings();
      expect(retrieved?.theme).toBe('dark');
    });
  });

  describe('exportData', () => {
    it('exports all data with version and timestamp', async () => {
      await db.addTask(createTestTask({ id: 'task-1' }));
      await db.addBoard(createTestBoard({ id: 'board-1' }));

      const exported = await db.exportData();

      expect(exported.version).toBe('1.0.0');
      expect(exported.exportedAt).toBeDefined();
      expect(exported.tasks).toHaveLength(1);
      expect(exported.boards).toHaveLength(1);
    });

    it('exports empty data when database is empty', async () => {
      const exported = await db.exportData();

      expect(exported.tasks).toEqual([]);
      expect(exported.boards).toEqual([]);
    });
  });

  describe('importData', () => {
    it('imports tasks and boards', async () => {
      const data = {
        tasks: [createTestTask({ id: 'imported-task' })],
        boards: [createTestBoard({ id: 'imported-board' })],
      };

      await db.importData(data);

      const tasks = await db.getTasks();
      const boards = await db.getBoards();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('imported-task');
      expect(boards).toHaveLength(1);
      expect(boards[0].id).toBe('imported-board');
    });

    it('clears existing data before importing', async () => {
      await db.addTask(createTestTask({ id: 'existing-task' }));
      await db.addBoard(createTestBoard({ id: 'existing-board' }));

      await db.importData({
        tasks: [createTestTask({ id: 'new-task' })],
        boards: [createTestBoard({ id: 'new-board' })],
      });

      const tasks = await db.getTasks();
      const boards = await db.getBoards();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('new-task');
      expect(boards).toHaveLength(1);
      expect(boards[0].id).toBe('new-board');
    });

    it('imports settings', async () => {
      const settings: Settings = {
        theme: 'dark',
        autoArchiveDays: 14,
        enableNotifications: true,
        enableKeyboardShortcuts: false,
        searchPreferences: {
          defaultScope: 'all-boards',
          rememberScope: false,
        },
        accessibility: {
          highContrast: true,
          reduceMotion: true,
          fontSize: 'large',
        },
      };

      await db.importData({ settings });

      const retrieved = await db.getSettings();
      expect(retrieved?.theme).toBe('dark');
      expect(retrieved?.accessibility.highContrast).toBe(true);
    });

    it('handles import with only tasks', async () => {
      await db.importData({
        tasks: [createTestTask({ id: 'only-task' })],
      });

      const tasks = await db.getTasks();
      expect(tasks).toHaveLength(1);
    });

    it('handles import with empty arrays', async () => {
      await db.addTask(createTestTask({ id: 'pre-existing' }));

      await db.importData({ tasks: [], boards: [] });

      // Existing data should be cleared
      const tasks = await db.getTasks();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('upsertTasks', () => {
    it('adds new tasks in a single batch', async () => {
      const tasks = [
        createTestTask({ id: 'batch-task-1' }),
        createTestTask({ id: 'batch-task-2' }),
        createTestTask({ id: 'batch-task-3' }),
      ];

      await db.upsertTasks(tasks);

      const stored = await db.getTasks();
      expect(stored.map(t => t.id).sort()).toEqual(['batch-task-1', 'batch-task-2', 'batch-task-3']);
    });

    it('overwrites tasks that already exist by id, without touching untouched tasks', async () => {
      await db.addTask(createTestTask({ id: 'existing-task', title: 'Original' }));
      await db.addTask(createTestTask({ id: 'untouched-task', title: 'Leave me alone' }));

      await db.upsertTasks([createTestTask({ id: 'existing-task', title: 'Updated' })]);

      const stored = await db.getTasks();
      expect(stored).toHaveLength(2);
      expect(stored.find(t => t.id === 'existing-task')?.title).toBe('Updated');
      expect(stored.find(t => t.id === 'untouched-task')?.title).toBe('Leave me alone');
    });

    it('does nothing for an empty array', async () => {
      await db.addTask(createTestTask({ id: 'pre-existing' }));

      await db.upsertTasks([]);

      const stored = await db.getTasks();
      expect(stored).toHaveLength(1);
    });
  });

  describe('upsertBoards', () => {
    it('adds new boards in a single batch', async () => {
      const boards = [
        createTestBoard({ id: 'batch-board-1' }),
        createTestBoard({ id: 'batch-board-2' }),
      ];

      await db.upsertBoards(boards);

      const stored = await db.getBoards();
      expect(stored.map(b => b.id).sort()).toEqual(['batch-board-1', 'batch-board-2']);
    });

    it('overwrites boards that already exist by id, without touching untouched boards', async () => {
      await db.addBoard(createTestBoard({ id: 'existing-board', name: 'Original' }));
      await db.addBoard(createTestBoard({ id: 'untouched-board', name: 'Leave me alone' }));

      await db.upsertBoards([createTestBoard({ id: 'existing-board', name: 'Updated' })]);

      const stored = await db.getBoards();
      expect(stored).toHaveLength(2);
      expect(stored.find(b => b.id === 'existing-board')?.name).toBe('Updated');
      expect(stored.find(b => b.id === 'untouched-board')?.name).toBe('Leave me alone');
    });
  });


  describe('resetDatabase', () => {
    it('clears all data', async () => {
      await db.addTask(createTestTask({ id: 'task-1' }));
      await db.addBoard(createTestBoard({ id: 'board-1' }));

      await db.resetDatabase();

      const tasks = await db.getTasks();
      const boards = await db.getBoards();
      expect(tasks).toHaveLength(0);
      expect(boards).toHaveLength(0);
    });
  });

  describe('error handling - uninitialized database', () => {
    it('throws when getting tasks without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.getTasks()).rejects.toThrow('Database not initialized');
    });

    it('throws when adding task without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.addTask(createTestTask())).rejects.toThrow('Database not initialized');
    });

    it('throws when updating task without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.updateTask(createTestTask())).rejects.toThrow('Database not initialized');
    });

    it('throws when deleting task without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.deleteTask('task-1')).rejects.toThrow('Database not initialized');
    });

    it('throws when getting boards without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.getBoards()).rejects.toThrow('Database not initialized');
    });

    it('throws when adding board without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.addBoard(createTestBoard())).rejects.toThrow('Database not initialized');
    });

    it('throws when updating board without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.updateBoard(createTestBoard())).rejects.toThrow('Database not initialized');
    });

    it('throws when deleting board without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.deleteBoard('board-1')).rejects.toThrow('Database not initialized');
    });

    it('throws when getting settings without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(uninitDB.getSettings()).rejects.toThrow('Database not initialized');
    });

    it('throws when updating settings without init', async () => {
      const uninitDB = new TaskDatabase();
      await expect(
        uninitDB.updateSettings({
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: false,
          enableKeyboardShortcuts: true,
          searchPreferences: { defaultScope: 'current-board', rememberScope: true },
          accessibility: { highContrast: false, reduceMotion: false, fontSize: 'medium' },
        })
      ).rejects.toThrow('Database not initialized');
    });
  });
});
