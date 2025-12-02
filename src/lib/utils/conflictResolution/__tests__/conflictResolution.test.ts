import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveImportConflicts,
  generateResolutionSummary,
  mergeBoards,
  mergeTasks,
  mergeSettings,
  generateUniqueBoardName,
} from '../index';
import type { ConflictResolutionOptions } from '../types';
import type { Task, Board, Settings } from '@/lib/types';
import type { ExportData, ImportConflicts } from '../../exportImport';

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

// Default conflict resolution options
const defaultOptions: ConflictResolutionOptions = {
  taskStrategy: 'skip',
  boardStrategy: 'skip',
  settingsStrategy: 'skip',
  mergeStrategy: 'keep_existing',
  preserveRelationships: true,
  generateBackup: false,
};

describe('conflictResolution', () => {
  describe('mergeBoards', () => {
    it('keeps existing values by default', () => {
      const existing = createBoard({ name: 'Existing', description: 'Existing desc' });
      const imported = createBoard({ name: 'Imported', description: 'Imported desc' });

      const result = mergeBoards(existing, imported, 'keep_existing');

      expect(result.merged.name).toBe('Existing');
      expect(result.merged.description).toBe('Existing desc');
      expect(result.conflicts).toHaveLength(2); // name and description
    });

    it('uses imported values with use_imported strategy', () => {
      const existing = createBoard({ name: 'Existing' });
      const imported = createBoard({ name: 'Imported' });

      const result = mergeBoards(existing, imported, 'use_imported');

      expect(result.merged.name).toBe('Imported');
      expect(result.mergedFields).toContain('name');
    });

    it('keeps newer values with keep_newer strategy', () => {
      const existing = createBoard({
        name: 'Old',
        updatedAt: new Date('2024-01-01'),
      });
      const imported = createBoard({
        name: 'New',
        updatedAt: new Date('2024-06-01'),
      });

      const result = mergeBoards(existing, imported, 'keep_newer');

      expect(result.merged.name).toBe('New');
      expect(result.merged.updatedAt).toEqual(new Date('2024-06-01'));
    });

    it('merges fields intelligently with merge_fields strategy', () => {
      const existing = createBoard({ description: undefined });
      const imported = createBoard({ description: 'New description' });

      const result = mergeBoards(existing, imported, 'merge_fields');

      expect(result.merged.description).toBe('New description');
    });
  });

  describe('mergeTasks', () => {
    it('keeps existing values by default', () => {
      const existing = createTask({ title: 'Existing', priority: 'high' });
      const imported = createTask({ title: 'Imported', priority: 'low' });

      const result = mergeTasks(existing, imported, 'keep_existing');

      expect(result.merged.title).toBe('Existing');
      expect(result.merged.priority).toBe('high');
    });

    it('merges tags arrays with merge_fields strategy', () => {
      const existing = createTask({ tags: ['urgent', 'bug'] });
      const imported = createTask({ tags: ['feature', 'urgent'] });

      const result = mergeTasks(existing, imported, 'merge_fields');

      expect(result.merged.tags).toContain('urgent');
      expect(result.merged.tags).toContain('bug');
      expect(result.merged.tags).toContain('feature');
      expect(result.merged.tags).toHaveLength(3); // Deduplicated
    });

    it('uses imported values with use_imported strategy', () => {
      const existing = createTask({ status: 'todo' });
      const imported = createTask({ status: 'done' });

      const result = mergeTasks(existing, imported, 'use_imported');

      expect(result.merged.status).toBe('done');
    });
  });

  describe('mergeSettings', () => {
    it('keeps existing settings by default', () => {
      const existing = createSettings({ theme: 'dark' });
      const imported = createSettings({ theme: 'light' });

      const result = mergeSettings(existing, imported, 'keep_existing');

      expect(result.merged.theme).toBe('dark');
    });

    it('uses imported settings with use_imported strategy', () => {
      const existing = createSettings({ theme: 'dark', autoArchiveDays: 30 });
      const imported = createSettings({ theme: 'light', autoArchiveDays: 60 });

      const result = mergeSettings(existing, imported, 'use_imported');

      expect(result.merged.theme).toBe('light');
      expect(result.merged.autoArchiveDays).toBe(60);
    });

    it('merges accessibility settings with merge_fields strategy', () => {
      const existing = createSettings({
        accessibility: { highContrast: true, reduceMotion: false, fontSize: 'medium' },
      });
      const imported = createSettings({
        accessibility: { highContrast: false, reduceMotion: true, fontSize: 'large' },
      });

      const result = mergeSettings(existing, imported, 'merge_fields');

      expect(result.merged.accessibility.reduceMotion).toBe(true);
      expect(result.merged.accessibility.fontSize).toBe('large');
    });
  });

  describe('generateUniqueBoardName', () => {
    it('adds (Copy) suffix for first duplicate', () => {
      const existingBoards = [createBoard({ name: 'My Board' })];

      const result = generateUniqueBoardName('My Board', existingBoards);

      expect(result).toBe('My Board (Copy)');
    });

    it('adds numbered suffix for multiple duplicates', () => {
      const existingBoards = [
        createBoard({ name: 'My Board' }),
        createBoard({ name: 'My Board (Copy)' }),
      ];

      const result = generateUniqueBoardName('My Board', existingBoards);

      expect(result).toBe('My Board (Copy 2)');
    });

    it('handles case-insensitive comparison', () => {
      const existingBoards = [
        createBoard({ name: 'my board' }),
        createBoard({ name: 'MY BOARD (copy)' }),
      ];

      const result = generateUniqueBoardName('My Board', existingBoards);

      expect(result).toBe('My Board (Copy 2)');
    });
  });

  describe('resolveImportConflicts', () => {
    it('adds non-conflicting boards directly', () => {
      const importData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [],
        boards: [{
          id: 'new-board',
          name: 'New Board',
          color: '#ff0000',
          isDefault: false,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        settings: undefined,
      };

      const conflicts: ImportConflicts = {
        duplicateTaskIds: [],
        duplicateBoardIds: [],
        boardNameConflicts: [],
        orphanedTasks: [],
        defaultBoardConflicts: [],
        hasConflicts: false,
      };

      const result = resolveImportConflicts(
        importData,
        [],
        [],
        undefined,
        conflicts,
        defaultOptions
      );

      expect(result.resolvedBoards).toHaveLength(1);
      expect(result.resolvedBoards[0].name).toBe('New Board');
    });

    it('skips conflicting boards with skip strategy', () => {
      const existingBoard = createBoard({ id: 'board-1', name: 'Existing' });
      const importData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [],
        boards: [{
          id: 'board-1',
          name: 'Imported',
          color: '#ff0000',
          isDefault: false,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        settings: undefined,
      };

      const conflicts: ImportConflicts = {
        duplicateTaskIds: [],
        duplicateBoardIds: ['board-1'],
        boardNameConflicts: [],
        orphanedTasks: [],
        defaultBoardConflicts: [],
        hasConflicts: true,
      };

      const result = resolveImportConflicts(
        importData,
        [],
        [existingBoard],
        undefined,
        conflicts,
        { ...defaultOptions, boardStrategy: 'skip' }
      );

      expect(result.resolvedBoards).toHaveLength(1);
      expect(result.resolvedBoards[0].name).toBe('Existing');
      expect(result.resolutionLog).toHaveLength(1);
      expect(result.resolutionLog[0].type).toBe('skip');
    });

    it('generates new IDs for conflicting boards with generate_new_ids strategy', () => {
      const existingBoard = createBoard({ id: 'board-1' });
      const importData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [],
        boards: [{
          id: 'board-1',
          name: 'New Board',
          color: '#ff0000',
          isDefault: false,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        settings: undefined,
      };

      const conflicts: ImportConflicts = {
        duplicateTaskIds: [],
        duplicateBoardIds: ['board-1'],
        boardNameConflicts: [],
        orphanedTasks: [],
        defaultBoardConflicts: [],
        hasConflicts: true,
      };

      const result = resolveImportConflicts(
        importData,
        [],
        [existingBoard],
        undefined,
        conflicts,
        { ...defaultOptions, boardStrategy: 'generate_new_ids' }
      );

      expect(result.resolvedBoards).toHaveLength(2);
      expect(result.resolvedBoards.find(b => b.id === 'board-1')).toBeDefined();
      expect(result.resolvedBoards.find(b => b.id !== 'board-1' && b.name === 'New Board')).toBeDefined();
    });

    it('skips orphaned tasks', () => {
      const importData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [{
          id: 'task-1',
          title: 'Orphan Task',
          status: 'todo',
          boardId: 'non-existent-board',
          priority: 'medium',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        boards: [],
        settings: undefined,
      };

      const conflicts: ImportConflicts = {
        duplicateTaskIds: [],
        duplicateBoardIds: [],
        boardNameConflicts: [],
        orphanedTasks: ['task-1'],
        defaultBoardConflicts: [],
        hasConflicts: true,
      };

      const result = resolveImportConflicts(
        importData,
        [],
        [],
        undefined,
        conflicts,
        defaultOptions
      );

      expect(result.resolvedTasks).toHaveLength(0);
      expect(result.resolutionLog.find(log =>
        log.itemType === 'task' && log.type === 'skip'
      )).toBeDefined();
    });

    it('generates backup when requested', () => {
      const existingBoard = createBoard();
      const existingTask = createTask();

      const importData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasks: [],
        boards: [],
        settings: undefined,
      };

      const conflicts: ImportConflicts = {
        duplicateTaskIds: [],
        duplicateBoardIds: [],
        boardNameConflicts: [],
        orphanedTasks: [],
        defaultBoardConflicts: [],
        hasConflicts: false,
      };

      const result = resolveImportConflicts(
        importData,
        [existingTask],
        [existingBoard],
        undefined,
        conflicts,
        { ...defaultOptions, generateBackup: true }
      );

      expect(result.backupData).toBeDefined();
      expect(result.backupData?.boards).toHaveLength(1);
      expect(result.backupData?.tasks).toHaveLength(1);
    });
  });

  describe('generateResolutionSummary', () => {
    it('generates correct summary for empty log', () => {
      const result = generateResolutionSummary([]);

      expect(result.summary).toContain('0 conflicts');
      expect(result.details.tasksSkipped).toBe(0);
    });

    it('counts actions by type and item', () => {
      const resolutionLog = [
        { type: 'skip' as const, itemType: 'task' as const, itemId: '1', reason: 'test' },
        { type: 'skip' as const, itemType: 'task' as const, itemId: '2', reason: 'test' },
        { type: 'merge' as const, itemType: 'board' as const, itemId: '3', reason: 'test' },
        { type: 'overwrite' as const, itemType: 'settings' as const, itemId: '4', reason: 'test' },
      ];

      const result = generateResolutionSummary(resolutionLog);

      // The summary should reflect the total actions taken
      expect(result.summary).toContain('4 actions taken');
      expect(resolutionLog).toHaveLength(4);
    });
  });
});
