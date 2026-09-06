import { vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { taskDB } from '@/lib/utils/database';
import { useBoardStore } from '@/lib/stores/boardStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { Task } from '@/lib/types';

/**
 * Tool tests run against the real stores and the real TaskDatabase on
 * fake-indexeddb. Each test file must also do, at its top:
 *
 *   import 'fake-indexeddb/auto';
 *   vi.unmock('@/lib/utils/database');
 *
 * because the global setup mocks the database module and vi.unmock is
 * hoisted per test file.
 */

/** The global setup pins crypto.randomUUID to one value; real ids are needed here. */
export function useRealUuids(): void {
  vi.mocked(crypto.randomUUID).mockImplementation(() => webcrypto.randomUUID());
}

/** Clears IndexedDB and re-runs the same initialization KanbanBoard runs at boot. */
export async function resetRealStores(): Promise<void> {
  await taskDB.init();
  await taskDB.resetDatabase();

  useTaskStore.setState({
    tasks: [],
    filteredTasks: [],
    filters: { search: '', tags: [], crossBoardSearch: false },
    searchState: { scope: 'current-board', highlightedTaskId: undefined },
    isLoading: false,
    isSearching: false,
    error: null,
    searchCache: new Map(),
  });
  useBoardStore.setState({ boards: [], currentBoardId: null, isLoading: false, error: null });

  await Promise.all([
    useSettingsStore.getState().initializeSettings(),
    useBoardStore.getState().initializeBoards(),
    useTaskStore.getState().initializeStore(),
  ]);
  useTaskStore.getState().setBoardFilter(useBoardStore.getState().currentBoardId);
}

export function currentBoardId(): string {
  const id = useBoardStore.getState().currentBoardId;
  if (!id) throw new Error('Test setup produced no current board');
  return id;
}

/** Adds a task through the real store action, defaulting to the current board. */
export async function addTestTask(overrides: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> = {}): Promise<Task> {
  return useTaskStore.getState().addTask({
    title: 'Test task',
    status: 'todo',
    boardId: currentBoardId(),
    priority: 'medium',
    tags: [],
    ...overrides,
  });
}
