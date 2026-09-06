import { useBoardStore } from '@/lib/stores/boardStore';
import { GET_BOARD_SCHEMA, LIST_BOARDS_SCHEMA } from '../schemas';
import { toBoardSummary, toColumns } from '../serialize';
import type { ModelContextTool } from '../types';
import { asInput, optionalString } from '../validate';
import { READ_TOOL_ANNOTATIONS, resolveBoard, tasksOnBoard } from './shared';

export const listBoardsTool: ModelContextTool = {
  name: 'cascade_list_boards',
  title: 'List Cascade boards',
  description:
    'List every board in Cascade with its id, name, and task counts per column. ' +
    'Call this first to learn board ids. Also returns the id of the board the user has on screen.',
  inputSchema: LIST_BOARDS_SCHEMA,
  annotations: READ_TOOL_ANNOTATIONS,
  execute: async () => {
    const { boards, currentBoardId } = useBoardStore.getState();
    return {
      ok: true,
      currentBoardId,
      boards: boards.map((board) => toBoardSummary(board, tasksOnBoard(board.id))),
    };
  },
};

export const getBoardTool: ModelContextTool = {
  name: 'cascade_get_board',
  title: 'Get a Cascade board',
  description:
    'Get one board with its columns (To Do, In Progress, Done) in order and the number of tasks in each. ' +
    'Defaults to the board the user has on screen. Use cascade_list_tasks to see the tasks themselves.',
  inputSchema: GET_BOARD_SCHEMA,
  annotations: READ_TOOL_ANNOTATIONS,
  execute: async (rawInput) => {
    const input = asInput(rawInput);
    const board = resolveBoard(optionalString(input, 'boardId'));
    const boardTasks = tasksOnBoard(board.id);
    return {
      ok: true,
      board: toBoardSummary(board, boardTasks),
      columns: toColumns(boardTasks),
    };
  },
};
