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
