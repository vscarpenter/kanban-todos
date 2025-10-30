/**
 * Helper functions for export/import operations
 * Extracted to reduce complexity of main export/import module
 */

import { Task, Board } from '@/lib/types';
import {  ExportData, ImportConflicts, SerializedBoard } from './exportImport';

/**
 * Detects duplicate task IDs between import and existing data
 */
export function findDuplicateTaskIds(
  importTasks: ExportData['tasks'],
  existingTasks: Task[]
): string[] {
  return importTasks
    .filter(task => existingTasks.some(existing => existing.id === task.id))
    .map(task => task.id);
}

/**
 * Detects duplicate board IDs between import and existing data
 */
export function findDuplicateBoardIds(
  importBoards: SerializedBoard[],
  existingBoards: Board[]
): string[] {
  return importBoards
    .filter(board => existingBoards.some(existing => existing.id === board.id))
    .map(board => board.id);
}

/**
 * Detects conflicts with existing default boards
 */
export function findDefaultBoardConflicts(
  importBoards: SerializedBoard[],
  existingBoards: Board[]
): Array<{ importedBoard: SerializedBoard; existingBoard: Board }> {
  const conflicts: Array<{ importedBoard: SerializedBoard; existingBoard: Board }> = [];

  for (const importedBoard of importBoards) {
    const existingDefaultBoard = existingBoards.find(existing =>
      existing.isDefault &&
      existing.name.toLowerCase() === importedBoard.name.toLowerCase() &&
      existing.id !== importedBoard.id
    );

    if (existingDefaultBoard) {
      conflicts.push({
        importedBoard,
        existingBoard: existingDefaultBoard
      });
    }
  }

  return conflicts;
}

/**
 * Detects board name conflicts (excluding default board conflicts)
 */
export function findBoardNameConflicts(
  importBoards: SerializedBoard[],
  existingBoards: Board[],
  defaultBoardConflicts: Array<{ importedBoard: SerializedBoard }>
): string[] {
  return importBoards
    .filter(board => {
      const hasNameConflict = existingBoards.some(existing =>
        existing.name.toLowerCase() === board.name.toLowerCase() && existing.id !== board.id
      );
      // Exclude boards that are already handled as default board conflicts
      const isDefaultConflict = defaultBoardConflicts.some(conflict =>
        conflict.importedBoard.id === board.id
      );
      return hasNameConflict && !isDefaultConflict;
    })
    .map(board => board.name);
}

/**
 * Finds orphaned tasks (tasks referencing non-existent boards)
 */
export function findOrphanedTasks(
  importData: ExportData,
  existingBoards: Board[]
): string[] {
  const existingBoardIds = new Set([
    ...existingBoards.map(b => b.id),
    ...importData.boards.map(b => b.id)
  ]);

  return importData.tasks
    .filter(task => !existingBoardIds.has(task.boardId))
    .map(task => task.id);
}

/**
 * Generates new IDs for conflicting boards and returns mapping
 */
export function regenerateBoardIds(
  boards: Board[],
  duplicateIds: string[]
): { boards: Board[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();

  const updatedBoards = boards.map(board => {
    if (duplicateIds.includes(board.id)) {
      const newId = crypto.randomUUID();
      idMap.set(board.id, newId);
      return { ...board, id: newId };
    }
    return board;
  });

  return { boards: updatedBoards, idMap };
}

/**
 * Generates new IDs for conflicting tasks and updates board references
 */
export function regenerateTaskIds(
  tasks: Task[],
  duplicateTaskIds: string[],
  boardIdMap: Map<string, string>
): Task[] {
  return tasks.map(task => {
    let updatedTask = task;

    // Update board reference if board ID was changed
    if (boardIdMap.has(task.boardId)) {
      updatedTask = { ...updatedTask, boardId: boardIdMap.get(task.boardId)! };
    }

    // Generate new task ID if conflicting
    if (duplicateTaskIds.includes(task.id)) {
      const newId = crypto.randomUUID();
      updatedTask = { ...updatedTask, id: newId };
    }

    return updatedTask;
  });
}

/**
 * Filters out conflicting items when skipConflicts option is enabled
 */
export function filterConflictingItems(
  tasks: Task[],
  boards: Board[],
  conflicts: ImportConflicts
): { tasks: Task[]; boards: Board[] } {
  const filteredTasks = tasks.filter(task =>
    !conflicts.duplicateTaskIds.includes(task.id)
  );
  const filteredBoards = boards.filter(board =>
    !conflicts.duplicateBoardIds.includes(board.id)
  );

  return { tasks: filteredTasks, boards: filteredBoards };
}

/**
 * Removes orphaned tasks from the task list
 */
export function removeOrphanedTasks(
  tasks: Task[],
  orphanedTaskIds: string[]
): Task[] {
  return tasks.filter(task => !orphanedTaskIds.includes(task.id));
}
