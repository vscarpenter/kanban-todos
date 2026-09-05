import type { ModelContextTool } from '../types';
import { getBoardTool, listBoardsTool } from './boards';

/** Every tool Cascade registers, in registration order. */
export const CASCADE_TOOLS: ModelContextTool[] = [listBoardsTool, getBoardTool];
