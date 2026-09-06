import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { taskDB } from '@/lib/utils/database';
import { useBoardStore } from '@/lib/stores/boardStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { createTaskTool, updateTaskTool, moveTaskTool, deleteTaskTool } from '../tools/tasks';
import { addTestTask, currentBoardId, resetRealStores, useRealUuids } from './realStores';

vi.unmock('@/lib/utils/database');

type TaskResult = { ok: true; changed?: boolean; task: Record<string, unknown> & { id: string } };

async function runCreate(input: Record<string, unknown>): Promise<TaskResult> {
  return (await createTaskTool.execute(input)) as TaskResult;
}

async function addSideBoard(): Promise<string> {
  await useBoardStore.getState().addBoard({ name: 'Side', color: '#000000', isDefault: false, order: 1 });
  const side = useBoardStore.getState().boards.find((b) => b.name === 'Side');
  if (!side) throw new Error('board was not created');
  return side.id;
}

describe('cascade_create_task', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('describes itself as a mutating tool with title as the only required field', () => {
    expect(createTaskTool.name).toBe('cascade_create_task');
    expect(createTaskTool.annotations?.readOnlyHint).toBeFalsy();
    expect(createTaskTool.annotations?.consequentialHint).toBeFalsy();
    expect(createTaskTool.inputSchema.required).toEqual(['title']);
  });

  it('creates a To Do task on the board on screen with sensible defaults', async () => {
    const result = await runCreate({ title: 'Draft the post' });

    expect(result.task).toMatchObject({
      title: 'Draft the post',
      description: null,
      status: 'todo',
      priority: 'medium',
      tags: [],
      boardId: currentBoardId(),
      boardName: 'Work Tasks',
      dueDate: null,
      progress: null,
    });
    expect(useTaskStore.getState().filteredTasks.map((t) => t.id)).toEqual([result.task.id]);
    expect((await taskDB.getTasks()).map((t) => t.id)).toEqual([result.task.id]);
  });

  it('honors every optional field', async () => {
    const sideId = await addSideBoard();

    const result = await runCreate({
      title: 'Ship v6',
      description: 'Cut the release',
      boardId: sideId,
      priority: 'high',
      tags: ['release', 'ops'],
      dueDate: '2026-09-30',
    });

    expect(result.task).toMatchObject({
      description: 'Cut the release',
      boardId: sideId,
      boardName: 'Side',
      priority: 'high',
      tags: ['release', 'ops'],
      dueDate: new Date('2026-09-30').toISOString(),
    });
  });

  it('applies the column rules when created straight into another column', async () => {
    const done = await runCreate({ title: 'Already done', status: 'done' });
    const started = await runCreate({ title: 'Underway', status: 'in-progress' });

    expect(done.task).toMatchObject({ status: 'done', progress: 100 });
    expect(done.task.completedAt).toEqual(expect.any(String));
    expect(started.task).toMatchObject({ status: 'in-progress', progress: 0, completedAt: null });
  });

  it('inherits the store sanitizer, so HTML in a title is stripped', async () => {
    const result = await runCreate({ title: '<b>Plan</b> launch' });

    expect(result.task.title).toBe('Plan launch');
  });

  it('rejects bad input before touching the store', async () => {
    await expect(runCreate({})).rejects.toThrow('title is required');
    await expect(runCreate({ title: 'x', boardId: 'nope' })).rejects.toThrow('Board not found: nope');
    await expect(runCreate({ title: 'x', dueDate: 'next tuesday' })).rejects.toThrow('dueDate must be an ISO 8601 date');
    await expect(runCreate({ title: 'x', status: 'blocked' })).rejects.toThrow('status must be one of');
    await expect(runCreate({ title: 'x', tags: 'ops' })).rejects.toThrow('tags must be an array of strings');
    expect(useTaskStore.getState().tasks).toEqual([]);
  });
});

describe('cascade_update_task', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('requires taskId and describes every field', () => {
    expect(updateTaskTool.name).toBe('cascade_update_task');
    expect(updateTaskTool.inputSchema.required).toEqual(['taskId']);
    const properties = updateTaskTool.inputSchema.properties as Record<string, { description: string }>;
    expect(Object.keys(properties).sort()).toEqual(
      ['description', 'dueDate', 'priority', 'progress', 'tags', 'taskId', 'title'].sort()
    );
  });

  it('changes only the fields that were supplied', async () => {
    const task = await addTestTask({ title: 'Before', description: 'Keep me', tags: ['keep'], priority: 'low' });

    const result = (await updateTaskTool.execute({ taskId: task.id, title: 'After' })) as TaskResult;

    expect(result.task).toMatchObject({ title: 'After', description: 'Keep me', tags: ['keep'], priority: 'low' });
    expect(new Date(result.task.updatedAt as string).getTime()).toBeGreaterThanOrEqual(task.updatedAt.getTime());
    expect(useTaskStore.getState().tasks[0].title).toBe('After');
  });

  it('clears description and due date with null, and replaces tags', async () => {
    const task = await addTestTask({ description: 'Old', dueDate: new Date('2026-09-10'), tags: ['a', 'b'] });

    const result = (await updateTaskTool.execute({
      taskId: task.id,
      description: null,
      dueDate: null,
      tags: ['c'],
    })) as TaskResult;

    expect(result.task).toMatchObject({ description: null, dueDate: null, tags: ['c'] });
  });

  it('accepts progress only for a task that is in progress', async () => {
    const started = await addTestTask({ title: 'Started' });
    await useTaskStore.getState().moveTask(started.id, 'in-progress');
    const waiting = await addTestTask({ title: 'Waiting' });

    const result = (await updateTaskTool.execute({ taskId: started.id, progress: 40 })) as TaskResult;

    expect(result.task.progress).toBe(40);
    await expect(updateTaskTool.execute({ taskId: waiting.id, progress: 40 })).rejects.toThrow(
      'progress applies only to tasks in the in-progress column; use cascade_move_task first'
    );
  });

  it('rejects an unknown task and an update with nothing to change', async () => {
    const task = await addTestTask();

    await expect(updateTaskTool.execute({ taskId: 'missing', title: 'x' })).rejects.toThrow('Task not found: missing');
    await expect(updateTaskTool.execute({ taskId: task.id })).rejects.toThrow('Nothing to update');
  });
});

describe('cascade_move_task', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('requires taskId and status', () => {
    expect(moveTaskTool.name).toBe('cascade_move_task');
    expect(moveTaskTool.inputSchema.required).toEqual(['taskId', 'status']);
  });

  it('moves a task to another column and applies the column rules', async () => {
    const task = await addTestTask({ title: 'Move me' });

    const started = (await moveTaskTool.execute({ taskId: task.id, status: 'in-progress' })) as TaskResult;
    const done = (await moveTaskTool.execute({ taskId: task.id, status: 'done' })) as TaskResult;
    const reopened = (await moveTaskTool.execute({ taskId: task.id, status: 'todo' })) as TaskResult;

    expect(started).toMatchObject({ ok: true, changed: true, task: { status: 'in-progress', progress: 0 } });
    expect(done.task).toMatchObject({ status: 'done', progress: 100 });
    expect(done.task.completedAt).toEqual(expect.any(String));
    expect(reopened.task).toMatchObject({ status: 'todo', progress: null, completedAt: null });
    expect(useTaskStore.getState().tasks[0].status).toBe('todo');
  });

  it('is idempotent: moving to the current column changes nothing', async () => {
    const task = await addTestTask();

    const result = (await moveTaskTool.execute({ taskId: task.id, status: 'todo' })) as TaskResult;

    expect(result.changed).toBe(false);
    expect(result.task.updatedAt).toBe(task.updatedAt.toISOString());
  });

  it('moves a task to another board when boardId is given', async () => {
    const sideId = await addSideBoard();
    const task = await addTestTask();

    const result = (await moveTaskTool.execute({ taskId: task.id, status: 'in-progress', boardId: sideId })) as TaskResult;

    expect(result).toMatchObject({ changed: true, task: { boardId: sideId, boardName: 'Side', status: 'in-progress' } });
    expect(useTaskStore.getState().tasks[0].boardId).toBe(sideId);
  });

  it('rejects an unknown task, column, or board', async () => {
    const task = await addTestTask();

    await expect(moveTaskTool.execute({ taskId: 'missing', status: 'done' })).rejects.toThrow('Task not found: missing');
    await expect(moveTaskTool.execute({ taskId: task.id, status: 'archived' })).rejects.toThrow('status must be one of: todo, in-progress, done');
    await expect(moveTaskTool.execute({ taskId: task.id, status: 'done', boardId: 'nope' })).rejects.toThrow('Board not found: nope');
    expect(useTaskStore.getState().tasks[0].status).toBe('todo');
  });
});

describe('cascade_delete_task', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('is marked consequential and requires taskId', () => {
    expect(deleteTaskTool.name).toBe('cascade_delete_task');
    expect(deleteTaskTool.annotations).toEqual({ consequentialHint: true });
    expect(deleteTaskTool.inputSchema.required).toEqual(['taskId']);
  });

  it('deletes the task from the store and from IndexedDB', async () => {
    const task = await addTestTask({ title: 'Gone soon' });

    const result = await deleteTaskTool.execute({ taskId: task.id });

    expect(result).toEqual({ ok: true, deleted: { id: task.id, title: 'Gone soon', boardId: currentBoardId() } });
    expect(useTaskStore.getState().tasks).toEqual([]);
    expect(await taskDB.getTasks()).toEqual([]);
  });

  it('rejects an unknown task id', async () => {
    await expect(deleteTaskTool.execute({ taskId: 'missing' })).rejects.toThrow('Task not found: missing');
  });
});
