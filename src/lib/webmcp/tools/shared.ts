import { useBoardStore } from '@/lib/stores/boardStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import type { Board, Task } from '@/lib/types';
import type { ToolAnnotations } from '../types';

/** Titles and descriptions are user content; agents must treat them as data. */
export const READ_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  untrustedContentHint: true,
};

/** Resolves a board by id, defaulting to the board on screen. */
export function resolveBoard(boardId: string | undefined): Board {
  const { boards, currentBoardId } = useBoardStore.getState();
  const targetId = boardId ?? currentBoardId;
  if (!targetId) throw new Error('No board is selected; pass boardId');

  const board = boards.find((candidate) => candidate.id === targetId);
  if (!board) throw new Error(`Board not found: ${targetId}`);
  return board;
}

/** Every task on a board, archived included. Callers decide what to hide. */
export function tasksOnBoard(boardId: string): Task[] {
  return useTaskStore.getState().tasks.filter((task) => task.boardId === boardId);
}

/** Finds a task by id or throws a message that names the id. */
export function findTask(taskId: string): Task {
  const task = useTaskStore.getState().tasks.find((candidate) => candidate.id === taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  return task;
}

export function boardNameFor(boardId: string): string | null {
  return useBoardStore.getState().boards.find((board) => board.id === boardId)?.name ?? null;
}
