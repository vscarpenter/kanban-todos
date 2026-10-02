import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taskDB } from '@/lib/utils/database';
import type { Task } from '@/lib/types';
import { useTaskStore } from '../taskStore';

vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    upsertTasks: vi.fn().mockResolvedValue(undefined),
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
const TWENTY_NINE_DAYS_BEFORE_NOW = new Date('2026-01-31T12:00:00.000Z');
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
  ...overrides,
});

const taskById = (id: string) => useTaskStore.getState().tasks.find(t => t.id === id);

describe('taskStore autoArchiveCompletedTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    useTaskStore.setState({ tasks: [], filteredTasks: [], error: null, searchCache: new Map() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('archives a done task completed exactly the configured number of days ago', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'old-done', completedAt: THIRTY_DAYS_BEFORE_NOW })] });

    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(taskById('old-done')?.archivedAt).toEqual(NOW);
  });

  it('keeps a done task that is one day short of the threshold', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'recent-done', completedAt: TWENTY_NINE_DAYS_BEFORE_NOW })] });

    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(taskById('recent-done')?.archivedAt).toBeUndefined();
  });

  it('keeps unfinished tasks no matter how old they are', async () => {
    useTaskStore.setState({
      tasks: [
        makeTask({ id: 'old-todo', status: 'todo' }),
        makeTask({ id: 'old-in-progress', status: 'in-progress' }),
      ],
    });

    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(taskById('old-todo')?.archivedAt).toBeUndefined();
    expect(taskById('old-in-progress')?.archivedAt).toBeUndefined();
  });

  it('leaves the original archive date on a task that is already archived', async () => {
    const firstArchived = new Date('2026-02-01T08:00:00.000Z');
    useTaskStore.setState({
      tasks: [makeTask({ id: 'archived', completedAt: LONG_AGO, archivedAt: firstArchived })],
    });

    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(taskById('archived')?.archivedAt).toEqual(firstArchived);
  });

  it('uses updatedAt when a done task has no completedAt (older or imported data)', async () => {
    useTaskStore.setState({
      tasks: [makeTask({ id: 'legacy-done', completedAt: undefined, updatedAt: THIRTY_DAYS_BEFORE_NOW })],
    });

    await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(taskById('legacy-done')?.archivedAt).toEqual(NOW);
  });

  it('writes only the newly archived tasks to the database in one call and returns their count', async () => {
    useTaskStore.setState({
      tasks: [
        makeTask({ id: 'old-done-1', completedAt: THIRTY_DAYS_BEFORE_NOW }),
        makeTask({ id: 'old-done-2', completedAt: LONG_AGO }),
        makeTask({ id: 'recent-done', completedAt: TWENTY_NINE_DAYS_BEFORE_NOW }),
        makeTask({ id: 'old-todo', status: 'todo' }),
      ],
    });

    const archivedCount = await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(archivedCount).toBe(2);
    expect(taskDB.upsertTasks).toHaveBeenCalledTimes(1);
    const written = vi.mocked(taskDB.upsertTasks).mock.calls[0][0];
    expect(written.map(t => t.id)).toEqual(['old-done-1', 'old-done-2']);
    expect(written.every(t => t.archivedAt?.getTime() === NOW.getTime())).toBe(true);
    expect(written.every(t => t.updatedAt.getTime() === NOW.getTime())).toBe(true);
  });

  it('returns 0 and skips the database when nothing is old enough', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'recent-done', completedAt: TWENTY_NINE_DAYS_BEFORE_NOW })] });

    const archivedCount = await useTaskStore.getState().autoArchiveCompletedTasks(30);

    expect(archivedCount).toBe(0);
    expect(taskDB.upsertTasks).not.toHaveBeenCalled();
  });

  it('archives nothing when the setting is 0 (Never)', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'old-done', completedAt: LONG_AGO })] });

    const archivedCount = await useTaskStore.getState().autoArchiveCompletedTasks(0);

    expect(archivedCount).toBe(0);
    expect(taskById('old-done')?.archivedAt).toBeUndefined();
    expect(taskDB.upsertTasks).not.toHaveBeenCalled();
  });

  it('re-throws and leaves tasks unarchived when the database write fails', async () => {
    useTaskStore.setState({ tasks: [makeTask({ id: 'old-done', completedAt: LONG_AGO })] });
    vi.mocked(taskDB.upsertTasks).mockRejectedValueOnce(new Error('IndexedDB write failed'));

    await expect(useTaskStore.getState().autoArchiveCompletedTasks(30)).rejects.toThrow('IndexedDB write failed');

    expect(taskById('old-done')?.archivedAt).toBeUndefined();
    expect(useTaskStore.getState().error).toBe('IndexedDB write failed');
  });
});
