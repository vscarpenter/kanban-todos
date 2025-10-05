import { Board } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { sanitizeBoardData } from '@/lib/utils/security';

/**
 * Validates board name is not empty
 */
export function validateBoardName(name: string): void {
  if (!name.trim()) {
    throw new Error('Board name is required');
  }
}

/**
 * Checks if board name already exists
 */
export function checkDuplicateBoardName(boards: Board[], name: string): void {
  const isDuplicate = boards.some(
    board => board.name.toLowerCase() === name.toLowerCase()
  );

  if (isDuplicate) {
    throw new Error('A board with this name already exists');
  }
}

/**
 * Calculates the next order value for a new board
 */
export function calculateNextOrder(boards: Board[]): number {
  if (boards.length === 0) return 0;
  return Math.max(...boards.map(b => b.order)) + 1;
}

/**
 * Creates a new board object with sanitized data
 */
export function createBoardObject(
  boardData: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>,
  order: number
): Board {
  const sanitizedData = sanitizeBoardData({
    name: boardData.name,
    description: boardData.description,
  });

  return {
    ...boardData,
    ...sanitizedData,
    id: crypto.randomUUID(),
    order: boardData.order ?? order,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Persists board to database
 */
export async function persistBoard(board: Board): Promise<void> {
  await taskDB.addBoard(board);
}

/**
 * Reorders boards by swapping positions
 */
export function reorderBoards(
  boards: Board[],
  boardId: string,
  direction: 'up' | 'down'
): Board[] | null {
  const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
  const boardIndex = sortedBoards.findIndex(b => b.id === boardId);

  if (boardIndex === -1) return null;

  const targetIndex = direction === 'up' ? boardIndex - 1 : boardIndex + 1;

  // Check bounds
  if (targetIndex < 0 || targetIndex >= sortedBoards.length) {
    return null;
  }

  // Swap positions
  const reordered = [...sortedBoards];
  const [movedBoard] = reordered.splice(boardIndex, 1);
  reordered.splice(targetIndex, 0, movedBoard);

  // Reassign sequential order values
  return reordered.map((board, index) => ({
    ...board,
    order: index,
    updatedAt: new Date(),
  }));
}

/**
 * Updates all boards in database
 */
export async function persistBoardOrders(boards: Board[]): Promise<void> {
  for (const board of boards) {
    await taskDB.updateBoard(board);
  }
}

/**
 * Assigns order to boards missing it
 */
export function assignMissingOrders(boards: Board[]): { boards: Board[]; needsUpdate: boolean } {
  let needsUpdate = false;

  const processedBoards = boards.map((board, index) => {
    if (board.order === undefined || board.order === null) {
      needsUpdate = true;
      return { ...board, order: index };
    }
    return board;
  });

  return { boards: processedBoards, needsUpdate };
}

/**
 * Creates default board
 */
export function createDefaultBoard(): Board {
  return {
    id: crypto.randomUUID(),
    name: 'Work Tasks',
    description: 'Default board for work-related tasks',
    color: '#3b82f6',
    isDefault: true,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: undefined,
  };
}

/**
 * Converts board dates from serialized format
 */
export function deserializeBoardDates(board: Board): Board {
  return {
    ...board,
    createdAt: new Date(board.createdAt),
    updatedAt: new Date(board.updatedAt),
    archivedAt: board.archivedAt ? new Date(board.archivedAt) : undefined,
  };
}

/**
 * Determines current board from settings
 */
export function selectCurrentBoard(
  boards: Board[],
  savedBoardId: string | undefined
): string | null {
  if (savedBoardId && boards.some(b => b.id === savedBoardId)) {
    return savedBoardId;
  }
  return boards[0]?.id || null;
}
