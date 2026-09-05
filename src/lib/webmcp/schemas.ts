import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/types';
import type { JsonSchema } from './types';

/**
 * JSON Schemas for every tool. Agents read these descriptions to decide
 * what to call and what to send, so each one says plainly what the field
 * is and where its value comes from.
 */

const BOARD_ID = {
  type: 'string',
  description: 'Board id from cascade_list_boards. Omit to use the board the user currently has on screen.',
} as const;

export const LIST_BOARDS_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {},
  required: [],
};

export const GET_BOARD_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    boardId: BOARD_ID,
  },
  required: [],
};

const TASK_ID = {
  type: 'string',
  description: 'Task id from cascade_list_tasks or an earlier create.',
} as const;

const STATUS = {
  type: 'string',
  enum: [...TASK_STATUSES],
  description: 'Column: "todo" (To Do), "in-progress" (In Progress), or "done" (Done).',
} as const;

const PRIORITY = {
  type: 'string',
  enum: [...TASK_PRIORITIES],
  description: 'Priority: "low", "medium", or "high".',
} as const;

export const LIST_TASKS_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    boardId: BOARD_ID,
    allBoards: {
      type: 'boolean',
      description: 'Search every board instead of one. Cannot be combined with boardId. Default false.',
    },
    status: { ...STATUS, description: `Only tasks in this column. ${STATUS.description}` },
    priority: { ...PRIORITY, description: `Only tasks with this priority. ${PRIORITY.description}` },
    tag: { type: 'string', description: 'Only tasks carrying this exact tag.' },
    query: {
      type: 'string',
      description: 'Case-insensitive text search over title, description, and tags. Every word must match.',
    },
    includeArchived: {
      type: 'boolean',
      description: 'Include archived tasks, which the board hides. Default false.',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 200,
      description: 'Maximum tasks to return. Default 50, maximum 200. The response says whether it was truncated.',
    },
  },
  required: [],
};

export const GET_TASK_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    taskId: TASK_ID,
  },
  required: ['taskId'],
};
