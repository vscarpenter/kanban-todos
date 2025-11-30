import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportData,
  exportTasks,
  exportBoards,
  exportSettings,
  validateImportData,
  detectImportConflicts,
  processImportData,
  generateExportFilename,
  DATA_FORMAT_VERSION,
} from '../exportImport';
import type { Task, Board, Settings } from '@/lib/types';

// Helper to create a test board
function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'board-1',
    name: 'Test Board',
    color: '#3b82f6',
    isDefault: false,
    order: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Helper to create a test task
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    status: 'todo',
    boardId: 'board-1',
    priority: 'medium',
    tags: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Helper to create test settings
function createSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    theme: 'system',
    autoArchiveDays: 30,
    enableNotifications: false,
    enableKeyboardShortcuts: true,
    enableDebugMode: false,
    enableDeveloperMode: false,
    searchPreferences: {
      defaultScope: 'current-board',
      rememberScope: false,
    },
    accessibility: {
      highContrast: false,
      reduceMotion: false,
      fontSize: 'medium',
    },
    ...overrides,
  };
}

describe('exportImport', () => {
  describe('exportData', () => {
    it('exports all data with default options', () => {
      const tasks = [createTask()];
      const boards = [createBoard()];
      const settings = createSettings();

      const result = exportData(tasks, boards, settings);

      expect(result.version).toBe(DATA_FORMAT_VERSION);
      expect(result.exportedAt).toBeDefined();
      expect(result.tasks).toHaveLength(1);
      expect(result.boards).toHaveLength(1);
      expect(result.settings).toBeDefined();
    });

    it('serializes Date objects to ISO strings', () => {
      const task = createTask({ createdAt: new Date('2024-06-15T10:30:00Z') });
      const board = createBoard({ createdAt: new Date('2024-06-15T10:30:00Z') });

      const result = exportData([task], [board]);

      expect(result.tasks[0].createdAt).toBe('2024-06-15T10:30:00.000Z');
      expect(result.boards[0].createdAt).toBe('2024-06-15T10:30:00.000Z');
    });

    it('excludes archived tasks when option is false', () => {
      const tasks = [
        createTask({ id: 'task-1' }),
        createTask({ id: 'task-2', archivedAt: new Date() }),
      ];

      const result = exportData(tasks, [], undefined, {
        includeTasks: true,
        includeBoards: false,
        includeSettings: false,
        includeArchivedTasks: false,
        includeArchivedBoards: false,
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('task-1');
    });

    it('filters tasks by board IDs when specified', () => {
      const tasks = [
        createTask({ id: 'task-1', boardId: 'board-1' }),
        createTask({ id: 'task-2', boardId: 'board-2' }),
      ];

      const result = exportData(tasks, [], undefined, {
        includeTasks: true,
        includeBoards: false,
        includeSettings: false,
        includeArchivedTasks: true,
        includeArchivedBoards: false,
        boardIds: ['board-1'],
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].boardId).toBe('board-1');
    });

    it('excludes tasks when includeTasks is false', () => {
      const tasks = [createTask()];

      const result = exportData(tasks, [], undefined, {
        includeTasks: false,
        includeBoards: false,
        includeSettings: false,
        includeArchivedTasks: false,
        includeArchivedBoards: false,
      });

      expect(result.tasks).toHaveLength(0);
    });
  });

  describe('exportTasks', () => {
    it('exports only tasks', () => {
      const tasks = [createTask()];

      const result = exportTasks(tasks);

      expect(result.tasks).toHaveLength(1);
      expect(result.boards).toHaveLength(0);
      expect(result.settings).toBeUndefined();
    });

    it('excludes archived tasks when option is false', () => {
      const tasks = [
        createTask({ id: 'task-1' }),
        createTask({ id: 'task-2', archivedAt: new Date() }),
      ];

      const result = exportTasks(tasks, { includeArchived: false });

      expect(result.tasks).toHaveLength(1);
    });
  });

  describe('exportBoards', () => {
    it('exports only boards', () => {
      const boards = [createBoard()];

      const result = exportBoards(boards);

      expect(result.tasks).toHaveLength(0);
      expect(result.boards).toHaveLength(1);
      expect(result.settings).toBeUndefined();
    });
  });

  describe('exportSettings', () => {
    it('exports only settings', () => {
      const settings = createSettings();

      const result = exportSettings(settings);

      expect(result.tasks).toHaveLength(0);
      expect(result.boards).toHaveLength(0);
      expect(result.settings).toEqual(settings);
    });
  });

  describe('validateImportData', () => {
    it('returns errors for non-object data', () => {
      const result = validateImportData(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid JSON format: Expected an object');
    });

    it('returns errors for string data', () => {
      const result = validateImportData('not an object');

      expect(result.isValid).toBe(false);
    });

    it('validates valid export data', () => {
      const validData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [],
        boards: [],
      };

      const result = validateImportData(validData);

      // May have warnings but should be valid
      expect(result.errors.filter(e => !e.includes('warning'))).toHaveLength(0);
    });
  });

  describe('detectImportConflicts', () => {
    it('detects duplicate task IDs', () => {
      const existingTasks = [createTask({ id: 'task-1' })];
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [{ ...createTask({ id: 'task-1' }), createdAt: '', updatedAt: '' }],
        boards: [],
      };

      const conflicts = detectImportConflicts(
        importData as any,
        existingTasks,
        []
      );

      expect(conflicts.duplicateTaskIds).toContain('task-1');
    });

    it('detects duplicate board IDs', () => {
      const existingBoards = [createBoard({ id: 'board-1' })];
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [],
        boards: [{ ...createBoard({ id: 'board-1' }), createdAt: '', updatedAt: '' }],
      };

      const conflicts = detectImportConflicts(
        importData as any,
        [],
        existingBoards
      );

      expect(conflicts.duplicateBoardIds).toContain('board-1');
    });

    it('detects orphaned tasks', () => {
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [{ ...createTask({ boardId: 'non-existent' }), createdAt: '', updatedAt: '' }],
        boards: [],
      };

      const conflicts = detectImportConflicts(
        importData as any,
        [],
        []
      );

      expect(conflicts.orphanedTasks).toHaveLength(1);
    });

    it('detects board name conflicts', () => {
      const existingBoards = [createBoard({ name: 'My Board' })];
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [],
        boards: [{ ...createBoard({ id: 'board-2', name: 'My Board' }), createdAt: '', updatedAt: '' }],
      };

      const conflicts = detectImportConflicts(
        importData as any,
        [],
        existingBoards
      );

      expect(conflicts.boardNameConflicts).toContain('My Board');
    });
  });

  describe('processImportData', () => {
    it('skips conflicting items when skipConflicts is true', () => {
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [
          { ...createTask({ id: 'task-1' }), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { ...createTask({ id: 'task-2' }), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        boards: [],
      };

      const conflicts = {
        duplicateTaskIds: ['task-1'],
        duplicateBoardIds: [],
        orphanedTasks: [],
        boardNameConflicts: [],
        defaultBoardConflicts: [],
      };

      const result = processImportData(importData as any, conflicts, {
        overwriteExisting: false,
        generateNewIds: false,
        skipConflicts: true,
        mergeSettings: false,
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('task-2');
    });

    it('generates new IDs when generateNewIds is true', () => {
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [{ ...createTask({ id: 'task-1' }), createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
        boards: [{ ...createBoard({ id: 'board-1' }), createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
      };

      const conflicts = {
        duplicateTaskIds: ['task-1'],
        duplicateBoardIds: ['board-1'],
        orphanedTasks: [],
        boardNameConflicts: [],
        defaultBoardConflicts: [],
      };

      const result = processImportData(importData as any, conflicts, {
        overwriteExisting: false,
        generateNewIds: true,
        skipConflicts: false,
        mergeSettings: false,
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).not.toBe('task-1');
      expect(result.boards).toHaveLength(1);
      expect(result.boards[0].id).not.toBe('board-1');
    });

    it('removes orphaned tasks when skipConflicts is true', () => {
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [
          { ...createTask({ id: 'task-1', boardId: 'existing-board' }), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { ...createTask({ id: 'task-2', boardId: 'non-existent' }), createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
        boards: [],
      };

      const conflicts = {
        duplicateTaskIds: [],
        duplicateBoardIds: [],
        orphanedTasks: ['task-2'],
        boardNameConflicts: [],
        defaultBoardConflicts: [],
      };

      const result = processImportData(importData as any, conflicts, {
        overwriteExisting: false,
        generateNewIds: false,
        skipConflicts: true,
        mergeSettings: false,
      });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe('task-1');
    });

    it('deserializes Date strings back to Date objects', () => {
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [{
          ...createTask(),
          createdAt: '2024-06-15T10:30:00.000Z',
          updatedAt: '2024-06-15T10:30:00.000Z',
        }],
        boards: [],
      };

      const conflicts = {
        duplicateTaskIds: [],
        duplicateBoardIds: [],
        orphanedTasks: [],
        boardNameConflicts: [],
        defaultBoardConflicts: [],
      };

      const result = processImportData(importData as any, conflicts, {
        overwriteExisting: false,
        generateNewIds: false,
        skipConflicts: false,
        mergeSettings: false,
      });

      expect(result.tasks[0].createdAt).toBeInstanceOf(Date);
      expect(result.tasks[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('generateExportFilename', () => {
    it('generates full export filename', () => {
      const filename = generateExportFilename({
        includeTasks: true,
        includeBoards: true,
        includeSettings: true,
        includeArchivedTasks: true,
        includeArchivedBoards: true,
      });

      expect(filename).toMatch(/^cascade-full-export-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('generates tasks-only filename', () => {
      const filename = generateExportFilename({
        includeTasks: true,
        includeBoards: false,
        includeSettings: false,
        includeArchivedTasks: true,
        includeArchivedBoards: false,
      });

      expect(filename).toMatch(/^tasks-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('generates combined filename for partial exports', () => {
      const filename = generateExportFilename({
        includeTasks: true,
        includeBoards: true,
        includeSettings: false,
        includeArchivedTasks: true,
        includeArchivedBoards: true,
      });

      expect(filename).toMatch(/^tasks-boards-\d{4}-\d{2}-\d{2}\.json$/);
    });
  });
});
