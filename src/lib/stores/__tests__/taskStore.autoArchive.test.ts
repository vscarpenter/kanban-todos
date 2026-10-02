import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taskDB } from '@/lib/utils/database';
import type { Task } from '@/lib/types';
import { useTaskStore } from '../taskStore';

// Which tasks qualify is decided inside the database transaction; those cases
// live in database.test.ts. These tests cover the store's side of the contract.
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    archiveDoneTasksCompletedBefore: vi.fn().mockResolvedValue([]),
    getTasks: vi.fn().mockResolvedValue([]),
    getBoards: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../boardStore', () => ({
  useBoardStore: { getState: () => ({ boards: [{ id: 'board-1', name: 'Work', isDefault: true }] }) },
}));

const NOW = new Date('2026-03-01T12:00:00.000Z');
const THIRTY_DAYS_BEFORE_NOW = new Date('2026-01-30T12:00:00.000Z');
const LONG_AGO = new Date('2025-12-01T12:00:00.000Z');

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 'task',
  title: 'Task',
  status: 'done',
  boardId: 'board-1',
  priority: 'medium',
  tags: [],
  createdAt: LONG_AGO,
  updatedAt: LONG_AGO,
  completedAt: LONG_AGO,
  ...overrides,
});

const taskById = (id: string) => useTaskStore.getState().tasks.find(t => t.id === id);
const archiveInDb = vi.mocked(taskDB.archiveDoneTasksCompletedBefore);

describe('taskStore autoArchiveCompletedTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    archiveInDb.mockResolvedValue([]);
    useTaskStore.setState({ tasks: [], filteredTasks: [], error: null, searchCache: new Map() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks the database to archive tasks finished the configured number of days ago or earlier', async () => {
    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(archiveInDb).toHaveBeenCalledWith(THIRTY_DAYS_BEFORE_NOW, NOW);
  });

  it('marks the archived tasks in state and returns how many there were', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'old-1' }), makeTask({ id: 'old-2' }), makeTask({ id: 'kept' })] });
    archiveInDb.mockResolvedValue(['old-1', 'old-2']);

    const archivedCount = await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(archivedCount).toBe(2);
    expect(taskById('old-1')?.archivedAt).toEqual(NOW);
    expect(taskById('old-2')?.archivedAt).toEqual(NOW);
    expect(taskById('kept')?.archivedAt).toBeUndefined();
  });

  it('keeps the other fields of the in-memory task when it marks it archived', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'old', title: 'Edited title' })] });
    archiveInDb.mockResolvedValue(['old']);

    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(taskById('old')?.title).toBe('Edited title');
  });

  it('does not add a task to state that is no longer there', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'still-here' })] });
    archiveInDb.mockResolvedValue(['already-deleted']);

    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(useTaskStore.getState().tasks.map(t => t.id)).toEqual(['still-here']);
  });

  it('archives nothing and skips the database when the setting is 0 (Never)', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'old' })] });

    const archivedCount = await useTaskStore.getState().autoArchiveCompletedTasks(0);

    expect(archivedCount).toBe(0);
    expect(archiveInDb).not.toHaveBeenCalled();
    expect(taskById('old')?.archivedAt).toBeUndefined();
  });

  it('re-throws and leaves tasks unarchived when the database write fails', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'old' })] });
    archiveInDb.mockRejectedValueOnce(new Error('IndexedDB write failed'));

    await expect(useTaskStore.getState().autoArchiveCompletedTasks(30)).rejects.toThrow('IndexedDB write failed');

    expect(taskById('old')?.archivedAt).toBeUndefined();
    expect(useTaskStore.getState().error).toBe('IndexedDB write failed');
  });
});
