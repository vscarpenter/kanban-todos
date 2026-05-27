import { describe, expect, it, vi } from 'vitest';
import type { Board, Settings, Task } from '@/lib/types';
import type { ExportData, ImportConflicts, SerializedBoard } from '@/lib/utils/exportImport';
import {
  createBoardIdMapping,
  generateResolutionSummary,
  resolveBoardConflicts,
  resolveImportConflicts,
  resolveSettingsConflicts,
  resolveTaskConflicts,
  type ConflictResolutionOptions,
  type ResolutionAction,
} from '@/lib/utils/conflictResolution';

const oldDate = new Date('2026-01-01T00:00:00.000Z');
const newDate = new Date('2026-02-01T00:00:00.000Z');

const makeBoard = (overrides: Partial<Board> = {}): Board => ({
  id: 'board-1',
  name: 'Work',
  color: '#2563eb',
  isDefault: false,
  order: 0,
  createdAt: oldDate,
  updatedAt: oldDate,
  ...overrides,
});

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Task',
  status: 'todo',
  boardId: 'board-1',
  priority: 'medium',
  tags: [],
  createdAt: oldDate,
  updatedAt: oldDate,
  ...overrides,
});

const makeSettings = (overrides: Partial<Settings> = {}): Settings => ({
  theme: 'system',
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
  ...overrides,
});

const options = (overrides: Partial<ConflictResolutionOptions> = {}): ConflictResolutionOptions => ({
  taskStrategy: 'skip',
  boardStrategy: 'skip',
  settingsStrategy: 'skip',
  mergeStrategy: 'use_imported',
  preserveRelationships: true,
  generateBackup: false,
  ...overrides,
});

const emptyConflicts = (): ImportConflicts => ({
  duplicateTaskIds: [],
  duplicateBoardIds: [],
  orphanedTasks: [],
  boardNameConflicts: [],
  defaultBoardConflicts: [],
});

const serializeBoard = (board: Board): SerializedBoard => ({
  ...board,
  createdAt: board.createdAt.toISOString(),
  updatedAt: board.updatedAt.toISOString(),
  archivedAt: board.archivedAt?.toISOString(),
});

const serializeTask = (task: Task): ExportData['tasks'][number] => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  updatedAt: task.updatedAt.toISOString(),
  completedAt: task.completedAt?.toISOString(),
  archivedAt: task.archivedAt?.toISOString(),
  dueDate: task.dueDate?.toISOString(),
});

describe('conflictResolution', () => {
  it('merges imported default boards into the existing default and maps task relationships', () => {
    const existingDefault = makeBoard({ id: 'default-existing', name: 'Inbox', isDefault: true });
    const importedDefault = makeBoard({
      id: 'default-imported',
      name: 'Inbox Import',
      isDefault: true,
      color: '#111111',
      updatedAt: newDate,
    });
    const conflicts: ImportConflicts = {
      ...emptyConflicts(),
      defaultBoardConflicts: [{
        importedBoard: serializeBoard(importedDefault),
        existingBoard: existingDefault,
      }],
    };
    const log: ResolutionAction[] = [];

    const resolvedBoards = resolveBoardConflicts(
      [importedDefault],
      [existingDefault],
      conflicts,
      options({ boardStrategy: 'merge' }),
      log
    );
    const boardIdMap = createBoardIdMapping([serializeBoard(importedDefault)], resolvedBoards, log);

    expect(resolvedBoards).toHaveLength(1);
    expect(resolvedBoards[0]).toMatchObject({
      id: 'default-existing',
      isDefault: true,
      color: '#111111',
    });
    expect(boardIdMap.get('default-imported')).toBe('default-existing');
  });

  it('renames imported boards when names conflict', () => {
    const existingBoard = makeBoard({ id: 'board-1', name: 'Roadmap' });
    const importedBoard = makeBoard({ id: 'board-2', name: 'Roadmap' });
    const log: ResolutionAction[] = [];

    const resolvedBoards = resolveBoardConflicts(
      [importedBoard],
      [existingBoard],
      { ...emptyConflicts(), boardNameConflicts: ['Roadmap'] },
      options({ boardStrategy: 'rename' }),
      log
    );

    expect(resolvedBoards.map(board => board.name)).toEqual(['Roadmap', 'Roadmap (Copy)']);
  });

  it('skips orphaned tasks unless the task strategy generates new ids', () => {
    const importedTask = makeTask({ id: 'orphan', boardId: 'missing-board' });
    const log: ResolutionAction[] = [];

    const resolvedTasks = resolveTaskConflicts(
      [importedTask],
      [],
      { ...emptyConflicts(), orphanedTasks: ['orphan'] },
      options({ taskStrategy: 'skip' }),
      new Map(),
      log
    );

    expect(resolvedTasks).toEqual([]);
    expect(log).toContainEqual(expect.objectContaining({
      type: 'skip',
      itemType: 'task',
      itemId: 'orphan',
    }));
  });

  it('remaps imported task board ids after board id generation', () => {
    const importedTask = makeTask({ id: 'task-imported', boardId: 'old-board' });

    const resolvedTasks = resolveTaskConflicts(
      [importedTask],
      [],
      emptyConflicts(),
      options(),
      new Map([['old-board', 'new-board']]),
      []
    );

    expect(resolvedTasks[0].boardId).toBe('new-board');
  });

  it('supports settings skip, overwrite, and merge strategies', () => {
    const existing = makeSettings({ theme: 'light', autoArchiveDays: 7 });
    const imported = makeSettings({ theme: 'dark', autoArchiveDays: 90 });

    expect(resolveSettingsConflicts(imported, existing, options({ settingsStrategy: 'skip' }), [])).toBe(existing);
    expect(resolveSettingsConflicts(imported, existing, options({ settingsStrategy: 'overwrite' }), [])).toBe(imported);
    expect(resolveSettingsConflicts(
      imported,
      existing,
      options({ settingsStrategy: 'merge', mergeStrategy: 'use_imported' }),
      []
    )).toMatchObject({
      theme: 'dark',
      autoArchiveDays: 90,
    });
  });

  it('resolves serialized imports into dated entities and creates a backup when requested', () => {
    const existingTask = makeTask({ id: 'existing-task' });
    const existingBoard = makeBoard({ id: 'existing-board' });
    const importData: ExportData = {
      version: '1.0.0',
      exportedAt: newDate.toISOString(),
      tasks: [serializeTask(makeTask({
        id: 'imported-task',
        boardId: 'imported-board',
        createdAt: newDate,
        updatedAt: newDate,
      }))],
      boards: [serializeBoard(makeBoard({
        id: 'imported-board',
        createdAt: newDate,
        updatedAt: newDate,
      }))],
      settings: makeSettings({ theme: 'dark' }),
    };

    const result = resolveImportConflicts(
      importData,
      [existingTask],
      [existingBoard],
      makeSettings({ theme: 'light' }),
      emptyConflicts(),
      options({ generateBackup: true, settingsStrategy: 'overwrite' })
    );

    expect(result.backupData?.tasks[0].createdAt).toBe(oldDate.toISOString());
    expect(result.resolvedTasks).toHaveLength(2);
    expect(result.resolvedTasks[1].createdAt).toBeInstanceOf(Date);
    expect(result.resolvedBoards[1].createdAt).toBeInstanceOf(Date);
    expect(result.resolvedSettings?.theme).toBe('dark');
  });

  it('generates new ids for task conflicts and reports summary counts', () => {
    const randomUuid = vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('new-task-id');
    const log: ResolutionAction[] = [];

    const resolvedTasks = resolveTaskConflicts(
      [makeTask({ id: 'task-1', title: 'Imported' })],
      [makeTask({ id: 'task-1', title: 'Existing' })],
      { ...emptyConflicts(), duplicateTaskIds: ['task-1'] },
      options({ taskStrategy: 'generate_new_ids' }),
      new Map(),
      log
    );
    const summary = generateResolutionSummary(log);

    expect(resolvedTasks.map(task => task.id)).toEqual(['task-1', 'new-task-id']);
    expect(summary.details.tasksWithNewIds).toBe(1);
    expect(summary.summary).toBe('Resolved 1 conflicts');
    randomUuid.mockRestore();
  });
});
