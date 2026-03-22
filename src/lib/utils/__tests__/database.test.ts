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
        enableDebugMode: false,
        enableDeveloperMode: false,
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
      expect(retrieved!.theme).toBe('dark');
      expect(retrieved!.autoArchiveDays).toBe(30);
    });

    it('updates existing settings', async () => {
      const settings: Settings = {
        theme: 'light',
        autoArchiveDays: 7,
        enableNotifications: false,
        enableKeyboardShortcuts: true,
        enableDebugMode: false,
        enableDeveloperMode: false,
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
      expect(retrieved!.theme).toBe('dark');
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
        enableDebugMode: false,
        enableDeveloperMode: false,
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
      expect(retrieved!.theme).toBe('dark');
      expect(retrieved!.accessibility.highContrast).toBe(true);
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
          enableDebugMode: false,
          enableDeveloperMode: false,
          searchPreferences: { defaultScope: 'current-board', rememberScope: true },
          accessibility: { highContrast: false, reduceMotion: false, fontSize: 'medium' },
        })
      ).rejects.toThrow('Database not initialized');
    });
  });
});
