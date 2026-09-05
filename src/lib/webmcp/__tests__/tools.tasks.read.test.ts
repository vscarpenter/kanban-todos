import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { useBoardStore } from '@/lib/stores/boardStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { listTasksTool, getTaskTool } from '../tools/tasks';
import { addTestTask, currentBoardId, resetRealStores, useRealUuids } from './realStores';

vi.unmock('@/lib/utils/database');

interface ListResult {
  ok: true;
  boardId: string | null;
  total: number;
  returned: number;
  truncated: boolean;
  tasks: Array<Record<string, unknown>>;
}

async function listTasks(input: Record<string, unknown> = {}): Promise<ListResult> {
  return (await listTasksTool.execute(input)) as ListResult;
}

describe('cascade_list_tasks', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('describes itself as a read-only tool that returns user content', () => {
    expect(listTasksTool.name).toBe('cascade_list_tasks');
    expect(listTasksTool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    const properties = listTasksTool.inputSchema.properties as Record<string, { description: string }>;
    for (const key of ['boardId', 'allBoards', 'status', 'priority', 'tag', 'query', 'includeArchived', 'limit']) {
      expect(properties[key].description, key).toEqual(expect.any(String));
    }
    expect(listTasksTool.inputSchema.required).toEqual([]);
  });

  it('returns compact task objects from the board on screen, hiding archived tasks', async () => {
    const task = await addTestTask({ title: 'Write docs', tags: ['docs'], priority: 'high' });
    const archived = await addTestTask({ title: 'Old' });
    await useTaskStore.getState().archiveTask(archived.id);

    const result = await listTasks();

    expect(result).toMatchObject({ ok: true, boardId: currentBoardId(), total: 1, returned: 1, truncated: false });
    expect(result.tasks).toEqual([
      {
        id: task.id,
        title: 'Write docs',
        status: 'todo',
        priority: 'high',
        tags: ['docs'],
        dueDate: null,
        progress: null,
        archived: false,
        boardId: currentBoardId(),
        updatedAt: task.updatedAt.toISOString(),
      },
    ]);
  });

  it('includes archived tasks only when asked', async () => {
    const archived = await addTestTask({ title: 'Old' });
    await useTaskStore.getState().archiveTask(archived.id);

    const result = await listTasks({ includeArchived: true });

    expect(result.tasks.map((t) => t.title)).toEqual(['Old']);
    expect(result.tasks[0].archived).toBe(true);
  });

  it('filters by column, priority, tag, and text the same way the search bar does', async () => {
    const match = await addTestTask({ title: 'Fix login bug', priority: 'high', tags: ['bug'] });
    await useTaskStore.getState().moveTask(match.id, 'in-progress');
    await addTestTask({ title: 'Fix logout bug', priority: 'high', tags: ['bug'] });
    await addTestTask({ title: 'Login copy', priority: 'low', tags: ['copy'] });

    const byStatus = await listTasks({ status: 'in-progress' });
    const byPriority = await listTasks({ priority: 'high' });
    const byTag = await listTasks({ tag: 'copy' });
    const byQuery = await listTasks({ query: 'login' });

    expect(byStatus.tasks.map((t) => t.title)).toEqual(['Fix login bug']);
    expect(byPriority.tasks.map((t) => t.title)).toEqual(['Fix login bug', 'Fix logout bug']);
    expect(byTag.tasks.map((t) => t.title)).toEqual(['Login copy']);
    expect(byQuery.tasks.map((t) => t.title)).toEqual(['Fix login bug', 'Login copy']);
  });

  it('lists a specific board, or every board with allBoards', async () => {
    await useBoardStore.getState().addBoard({ name: 'Side', color: '#000000', isDefault: false, order: 1 });
    const side = useBoardStore.getState().boards.find((b) => b.name === 'Side');
    if (!side) throw new Error('board was not created');
    await addTestTask({ title: 'Main task' });
    await addTestTask({ title: 'Side task', boardId: side.id });

    const sideOnly = await listTasks({ boardId: side.id });
    const everything = await listTasks({ allBoards: true });

    expect(sideOnly.tasks.map((t) => t.title)).toEqual(['Side task']);
    expect(everything.boardId).toBeNull();
    expect(everything.tasks.map((t) => t.title).sort()).toEqual(['Main task', 'Side task']);
  });

  it('caps results at the limit and reports the truncation', async () => {
    await addTestTask({ title: 'One' });
    await addTestTask({ title: 'Two' });
    await addTestTask({ title: 'Three' });

    const result = await listTasks({ limit: 2 });

    expect(result).toMatchObject({ total: 3, returned: 2, truncated: true });
    expect(result.tasks).toHaveLength(2);
  });

  it('rejects a limit outside 1 to 200', async () => {
    await expect(listTasks({ limit: 0 })).rejects.toThrow('limit must be between 1 and 200');
    await expect(listTasks({ limit: 201 })).rejects.toThrow('limit must be between 1 and 200');
  });

  it('rejects an unknown status and names the allowed values', async () => {
    await expect(listTasks({ status: 'blocked' })).rejects.toThrow('status must be one of: todo, in-progress, done');
  });

  it('rejects boardId combined with allBoards', async () => {
    await expect(listTasks({ boardId: currentBoardId(), allBoards: true })).rejects.toThrow(
      'Pass either boardId or allBoards, not both'
    );
  });
});

describe('cascade_get_task', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('describes itself as a read-only tool that returns user content', () => {
    expect(getTaskTool.name).toBe('cascade_get_task');
    expect(getTaskTool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    expect(getTaskTool.inputSchema.required).toEqual(['taskId']);
  });

  it('returns the full task with ISO dates and the board name', async () => {
    const due = new Date('2026-09-12T00:00:00.000Z');
    const task = await addTestTask({ title: 'Review PR', description: 'Look at #12', dueDate: due, tags: ['review'] });
    await useTaskStore.getState().moveTask(task.id, 'done');
    const stored = useTaskStore.getState().tasks[0];

    const result = await getTaskTool.execute({ taskId: task.id });

    expect(result).toEqual({
      ok: true,
      task: {
        id: task.id,
        title: 'Review PR',
        description: 'Look at #12',
        status: 'done',
        priority: 'medium',
        tags: ['review'],
        boardId: currentBoardId(),
        boardName: 'Work Tasks',
        dueDate: due.toISOString(),
        progress: 100,
        archived: false,
        createdAt: stored.createdAt.toISOString(),
        updatedAt: stored.updatedAt.toISOString(),
        completedAt: stored.completedAt?.toISOString(),
        archivedAt: null,
      },
    });
  });

  it('rejects an unknown task id with a message that names it', async () => {
    await expect(getTaskTool.execute({ taskId: 'missing' })).rejects.toThrow('Task not found: missing');
  });

  it('rejects a missing taskId', async () => {
    await expect(getTaskTool.execute({})).rejects.toThrow('taskId is required');
  });
});
