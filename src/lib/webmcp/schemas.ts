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

const TITLE = { type: 'string', maxLength: 200, description: 'Task title. Plain text, up to 200 characters.' } as const;
const TAGS = {
  type: 'array',
  items: { type: 'string' },
  maxItems: 10,
  description: 'Tags as plain strings, up to 10. On update this replaces the whole list.',
} as const;
const DUE_DATE_DESCRIPTION = 'Due date as ISO 8601, for example "2026-09-30" or "2026-09-30T17:00:00Z".';

export const CREATE_TASK_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    title: TITLE,
    description: { type: 'string', maxLength: 1000, description: 'Longer detail for the task. Plain text, up to 1000 characters.' },
    boardId: { ...BOARD_ID, description: 'Board to add the task to. Omit for the board the user has on screen.' },
    status: { ...STATUS, description: `Column to create the task in. Default "todo". ${STATUS.description}` },
    priority: { ...PRIORITY, description: `${PRIORITY.description} Default "medium".` },
    tags: TAGS,
    dueDate: { type: 'string', description: DUE_DATE_DESCRIPTION },
  },
  required: ['title'],
};

export const UPDATE_TASK_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    taskId: TASK_ID,
    title: TITLE,
    description: {
      type: ['string', 'null'],
      maxLength: 1000,
      description: 'New description, or null to clear it.',
    },
    priority: PRIORITY,
    tags: TAGS,
    dueDate: { type: ['string', 'null'], description: `${DUE_DATE_DESCRIPTION} Pass null to clear it.` },
    progress: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: 'Percent complete, 0 to 100. Only for tasks in the in-progress column; move the task first.',
    },
  },
  required: ['taskId'],
};

export const MOVE_TASK_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    taskId: TASK_ID,
    status: { ...STATUS, description: `Column to move the task to. ${STATUS.description}` },
    boardId: { ...BOARD_ID, description: 'Move the task to this board as well. Omit to stay on its current board.' },
  },
  required: ['taskId', 'status'],
};

export const DELETE_TASK_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    taskId: TASK_ID,
  },
  required: ['taskId'],
};
