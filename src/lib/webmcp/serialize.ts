import { Board, Task, TaskStatus, TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/types';

/**
 * Shapes Task and Board records for agents. Dates become ISO strings and
 * missing values become null, so the JSON an agent reads never carries
 * undefined or a Date object.
 */

export function toIso(value: Date | string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export interface TaskCounts {
  todo: number;
  inProgress: number;
  done: number;
  archived: number;
}

const COUNT_KEY: Record<TaskStatus, keyof Omit<TaskCounts, 'archived'>> = {
  todo: 'todo',
  'in-progress': 'inProgress',
  done: 'done',
};

/** Archived tasks are hidden from the columns, so they count separately. */
export function countTasks(tasks: Task[]): TaskCounts {
  const counts: TaskCounts = { todo: 0, inProgress: 0, done: 0, archived: 0 };
  for (const task of tasks) {
    if (task.archivedAt) {
      counts.archived += 1;
    } else {
      counts[COUNT_KEY[task.status]] += 1;
    }
  }
  return counts;
}

export function toBoardSummary(board: Board, boardTasks: Task[]) {
  return {
    id: board.id,
    name: board.name,
    description: board.description ?? null,
    isDefault: board.isDefault,
    order: board.order,
    archived: Boolean(board.archivedAt),
    counts: countTasks(boardTasks),
  };
}

export function toColumns(boardTasks: Task[]) {
  const counts = countTasks(boardTasks);
  return TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    count: counts[COUNT_KEY[status]],
  }));
}

/** The compact shape cascade_list_tasks returns. */
export function toTaskSummary(task: Task) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    tags: task.tags,
    dueDate: toIso(task.dueDate),
    progress: task.progress ?? null,
    archived: Boolean(task.archivedAt),
    boardId: task.boardId,
    updatedAt: toIso(task.updatedAt),
  };
}

/** The full shape cascade_get_task and every mutating tool return. */
export function toTaskDetail(task: Task, boardName: string | null) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ? task.description : null,
    status: task.status,
    priority: task.priority,
    tags: task.tags,
    boardId: task.boardId,
    boardName,
    dueDate: toIso(task.dueDate),
    progress: task.progress ?? null,
    archived: Boolean(task.archivedAt),
    createdAt: toIso(task.createdAt),
    updatedAt: toIso(task.updatedAt),
    completedAt: toIso(task.completedAt),
    archivedAt: toIso(task.archivedAt),
  };
}
