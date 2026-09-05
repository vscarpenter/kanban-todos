import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { useBoardStore } from '@/lib/stores/boardStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import { listBoardsTool, getBoardTool } from '../tools/boards';
import { addTestTask, currentBoardId, resetRealStores, useRealUuids } from './realStores';

vi.unmock('@/lib/utils/database');

describe('cascade_list_boards', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('describes itself as a read-only tool that returns user content', () => {
    expect(listBoardsTool.name).toBe('cascade_list_boards');
    expect(listBoardsTool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    expect(listBoardsTool.inputSchema).toMatchObject({ type: 'object', required: [] });
  });

  it('lists the default board with per-column counts and the current board id', async () => {
    const boardId = currentBoardId();
    const shipped = await addTestTask({ title: 'Ship it' });
    await useTaskStore.getState().moveTask(shipped.id, 'done');
    await addTestTask({ title: 'Plan it' });

    const result = await listBoardsTool.execute({});

    expect(result).toEqual({
      ok: true,
      currentBoardId: boardId,
      boards: [
        {
          id: boardId,
          name: 'Work Tasks',
          description: 'Default board for work-related tasks',
          isDefault: true,
          order: 0,
          archived: false,
          counts: { todo: 1, inProgress: 0, done: 1, archived: 0 },
        },
      ],
    });
  });

  it('counts archived tasks separately so column counts match what the board shows', async () => {
    const archived = await addTestTask({ title: 'Old' });
    await useTaskStore.getState().archiveTask(archived.id);
    await addTestTask({ title: 'Current' });

    const result = (await listBoardsTool.execute({})) as { boards: Array<{ counts: unknown }> };

    expect(result.boards[0].counts).toEqual({ todo: 1, inProgress: 0, done: 0, archived: 1 });
  });
});

describe('cascade_get_board', () => {
  beforeAll(useRealUuids);
  beforeEach(resetRealStores);

  it('describes itself as a read-only tool that returns user content', () => {
    expect(getBoardTool.name).toBe('cascade_get_board');
    expect(getBoardTool.annotations).toEqual({ readOnlyHint: true, untrustedContentHint: true });
    expect(getBoardTool.inputSchema).toMatchObject({
      type: 'object',
      properties: { boardId: { type: 'string', description: expect.any(String) } },
      required: [],
    });
  });

  it('defaults to the board on screen and lists its columns in order', async () => {
    const started = await addTestTask({ title: 'Started' });
    await useTaskStore.getState().moveTask(started.id, 'in-progress');

    const result = await getBoardTool.execute({});

    expect(result).toMatchObject({
      ok: true,
      board: { id: currentBoardId(), name: 'Work Tasks' },
      columns: [
        { status: 'todo', label: 'To Do', count: 0 },
        { status: 'in-progress', label: 'In Progress', count: 1 },
        { status: 'done', label: 'Done', count: 0 },
      ],
    });
  });

  it('returns the requested board when given an id', async () => {
    await useBoardStore.getState().addBoard({ name: 'Side project', color: '#000000', isDefault: false, order: 1 });
    const side = useBoardStore.getState().boards.find((b) => b.name === 'Side project');
    if (!side) throw new Error('board was not created');

    const result = await getBoardTool.execute({ boardId: side.id });

    expect(result).toMatchObject({ ok: true, board: { id: side.id, name: 'Side project', isDefault: false } });
  });

  it('rejects an unknown board id with a message that names it', async () => {
    await expect(getBoardTool.execute({ boardId: 'nope' })).rejects.toThrow('Board not found: nope');
  });

  it('rejects a boardId that is not a string', async () => {
    await expect(getBoardTool.execute({ boardId: 42 })).rejects.toThrow('boardId must be a string');
  });
});
