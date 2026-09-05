import type { ModelContextTool } from '../types';
import { getBoardTool, listBoardsTool } from './boards';
import {
  createTaskTool,
  deleteTaskTool,
  getTaskTool,
  listTasksTool,
  moveTaskTool,
  updateTaskTool,
} from './tasks';

/** Every tool Cascade registers, in registration order. */
export const CASCADE_TOOLS: ModelContextTool[] = [
  listBoardsTool,
  getBoardTool,
  listTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  moveTaskTool,
  deleteTaskTool,
];
