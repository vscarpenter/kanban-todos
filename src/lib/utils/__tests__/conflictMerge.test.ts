import { describe, it, expect } from 'vitest';
import {
  mergeBoards,
  mergeTasks,
  mergeSettings,
  generateUniqueBoardName,
  type MergeStrategy,
} from '@/lib/utils/conflictMerge';
import type { Board, Task, Settings } from '@/lib/types';

const baseBoard = (overrides: Partial<Board> = {}): Board => ({
  id: 'board-1',
  name: 'My Board',
  color: '#3b82f6',
  isDefault: false,
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const baseTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'My Task',
  status: 'todo',
  boardId: 'board-1',
  priority: 'medium',
  tags: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const baseSettings = (overrides: Partial<Settings> = {}): Settings => ({
  theme: 'system',
  autoArchiveDays: 30,
  enableNotifications: false,
  enableKeyboardShortcuts: true,
  enableDebugMode: false,
  enableDeveloperMode: false,
  searchPreferences: { defaultScope: 'current-board', rememberScope: true },
  accessibility: { highContrast: false, reduceMotion: false, fontSize: 'medium' },
  ...overrides,
});

describe('mergeBoards', () => {
  it('keeps existing when strategy is keep_existing', () => {
    const existing = baseBoard({ name: 'Existing', color: '#111111' });
    const imported = baseBoard({ name: 'Imported', color: '#222222' });
    const { merged } = mergeBoards(existing, imported, 'keep_existing');
    expect(merged.name).toBe('Existing');
    expect(merged.color).toBe('#111111');
  });

  it('uses imported when strategy is use_imported', () => {
    const existing = baseBoard({ name: 'Existing', color: '#111111' });
    const imported = baseBoard({ name: 'Imported', color: '#222222' });
    const { merged, mergedFields } = mergeBoards(existing, imported, 'use_imported');
    expect(merged.name).toBe('Imported');
    expect(merged.color).toBe('#222222');
    expect(mergedFields).toContain('name');
    expect(mergedFields).toContain('color');
  });

  it('keeps newer when strategy is keep_newer and imported is newer', () => {
    const existing = baseBoard({ name: 'Old', updatedAt: new Date('2024-01-01') });
    const imported = baseBoard({ name: 'New', updatedAt: new Date('2024-06-01') });
    const { merged } = mergeBoards(existing, imported, 'keep_newer');
    expect(merged.name).toBe('New');
  });

  it('keeps existing when strategy is keep_newer and existing is newer', () => {
    const existing = baseBoard({ name: 'Newer', updatedAt: new Date('2024-06-01') });
    const imported = baseBoard({ name: 'Older', updatedAt: new Date('2024-01-01') });
    const { merged } = mergeBoards(existing, imported, 'keep_newer');
    expect(merged.name).toBe('Newer');
  });

  it('fills empty description from imported when strategy is merge_fields', () => {
    const existing = baseBoard({ description: '' });
    const imported = baseBoard({ description: 'Filled description' });
    const { merged } = mergeBoards(existing, imported, 'merge_fields');
    expect(merged.description).toBe('Filled description');
  });

  it('records field conflicts', () => {
    const existing = baseBoard({ name: 'A' });
    const imported = baseBoard({ name: 'B' });
    const { conflicts } = mergeBoards(existing, imported, 'keep_existing');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].field).toBe('name');
    expect(conflicts[0].existingValue).toBe('A');
    expect(conflicts[0].importedValue).toBe('B');
  });

  it('returns no conflicts when boards are identical', () => {
    const board = baseBoard();
    const { conflicts } = mergeBoards(board, { ...board }, 'keep_existing');
    expect(conflicts).toHaveLength(0);
  });
});

describe('mergeTasks', () => {
  it('merges tags from both sources when strategy is merge_fields', () => {
    const existing = baseTask({ tags: ['frontend', 'bug'] });
    const imported = baseTask({ tags: ['backend', 'bug'] });
    const { merged } = mergeTasks(existing, imported, 'merge_fields');
    expect(merged.tags).toContain('frontend');
    expect(merged.tags).toContain('backend');
    expect(merged.tags).toContain('bug');
    expect(merged.tags).toHaveLength(3); // bug deduplicated
  });

  it('uses imported title when strategy is use_imported', () => {
    const existing = baseTask({ title: 'Old Title' });
    const imported = baseTask({ title: 'New Title' });
    const { merged } = mergeTasks(existing, imported, 'use_imported');
    expect(merged.title).toBe('New Title');
  });

  it('preserves task id and boardId from existing', () => {
    const existing = baseTask({ id: 'task-original', boardId: 'board-original' });
    const imported = baseTask({ id: 'task-imported', boardId: 'board-imported' });
    const { merged } = mergeTasks(existing, imported, 'use_imported');
    expect(merged.id).toBe('task-original');
    expect(merged.boardId).toBe('board-original');
  });
});

describe('mergeSettings', () => {
  it('uses imported theme when strategy is use_imported', () => {
    const existing = baseSettings({ theme: 'light' });
    const imported = baseSettings({ theme: 'dark' });
    const { merged } = mergeSettings(existing, imported, 'use_imported');
    expect(merged.theme).toBe('dark');
  });

  it('merges accessibility object when strategy is merge_fields', () => {
    const existing = baseSettings({
      accessibility: { highContrast: true, reduceMotion: false, fontSize: 'medium' },
    });
    const imported = baseSettings({
      accessibility: { highContrast: false, reduceMotion: true, fontSize: 'large' },
    });
    const { merged, mergedFields } = mergeSettings(existing, imported, 'merge_fields');
    expect(mergedFields).toContain('accessibility');
    // merge_fields uses spread: imported values win for each key
    expect(merged.accessibility.reduceMotion).toBe(true);
    expect(merged.accessibility.fontSize).toBe('large');
  });

  it('keeps existing settings when strategy is keep_existing', () => {
    const existing = baseSettings({ autoArchiveDays: 7 });
    const imported = baseSettings({ autoArchiveDays: 90 });
    const { merged } = mergeSettings(existing, imported, 'keep_existing');
    expect(merged.autoArchiveDays).toBe(7);
  });
});

describe('generateUniqueBoardName', () => {
  it('appends (Copy) to the board name', () => {
    const boards = [baseBoard({ name: 'Board A' })];
    const result = generateUniqueBoardName('Board A', boards);
    expect(result).toBe('Board A (Copy)');
  });

  it('appends (Copy 2) when (Copy) already exists', () => {
    const boards = [
      baseBoard({ name: 'Board A' }),
      baseBoard({ id: 'b2', name: 'Board A (Copy)' }),
    ];
    const result = generateUniqueBoardName('Board A', boards);
    expect(result).toBe('Board A (Copy 2)');
  });

  it('is case-insensitive for name comparison', () => {
    const boards = [baseBoard({ name: 'BOARD A (copy)' })];
    const result = generateUniqueBoardName('Board A', boards);
    expect(result).toBe('Board A (Copy 2)');
  });

  it('returns (Copy) when no existing boards', () => {
    const result = generateUniqueBoardName('My Board', []);
    expect(result).toBe('My Board (Copy)');
  });
});

describe('strategy types', () => {
  const strategies: MergeStrategy[] = [
    'keep_existing', 'use_imported', 'merge_fields', 'keep_newer', 'keep_older',
  ];

  it('all strategies return a merged result without throwing', () => {
    const existing = baseBoard({ name: 'A', color: '#111111' });
    const imported = baseBoard({ name: 'B', color: '#222222' });
    for (const strategy of strategies) {
      expect(() => mergeBoards(existing, imported, strategy)).not.toThrow();
    }
  });
});
