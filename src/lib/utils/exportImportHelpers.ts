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
  const existingIds = new Set(existingTasks.map(t => t.id));
  const duplicates: string[] = [];
  for (const task of importTasks) {
    if (existingIds.has(task.id)) duplicates.push(task.id);
  }
  return duplicates;
}

/**
 * Detects duplicate board IDs between import and existing data
 */
export function findDuplicateBoardIds(
  importBoards: SerializedBoard[],
  existingBoards: Board[]
): string[] {
  const existingIds = new Set(existingBoards.map(b => b.id));
  const duplicates: string[] = [];
  for (const board of importBoards) {
    if (existingIds.has(board.id)) duplicates.push(board.id);
  }
  return duplicates;
}

/**
 * Detects conflicts with existing default boards
 */
export function findDefaultBoardConflicts(
  importBoards: SerializedBoard[],
  existingBoards: Board[]
): Array<{ importedBoard: SerializedBoard; existingBoard: Board }> {
  const defaultsByLowerName = new Map<string, Board>();
  for (const existing of existingBoards) {
    if (existing.isDefault) defaultsByLowerName.set(existing.name.toLowerCase(), existing);
  }

  const conflicts: Array<{ importedBoard: SerializedBoard; existingBoard: Board }> = [];
  for (const importedBoard of importBoards) {
    const existingDefaultBoard = defaultsByLowerName.get(importedBoard.name.toLowerCase());
    if (existingDefaultBoard && existingDefaultBoard.id !== importedBoard.id) {
      conflicts.push({ importedBoard, existingBoard: existingDefaultBoard });
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
  const existingByLowerName = new Map<string, Board[]>();
  for (const existing of existingBoards) {
    const key = existing.name.toLowerCase();
    const list = existingByLowerName.get(key);
    if (list) list.push(existing);
    else existingByLowerName.set(key, [existing]);
  }
  const defaultConflictIds = new Set(defaultBoardConflicts.map(c => c.importedBoard.id));

  const conflicts: string[] = [];
  for (const board of importBoards) {
    if (defaultConflictIds.has(board.id)) continue;
    const existingMatches = existingByLowerName.get(board.name.toLowerCase());
    if (existingMatches && existingMatches.some(e => e.id !== board.id)) {
      conflicts.push(board.name);
    }
  }
  return conflicts;
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

  const orphaned: string[] = [];
  for (const task of importData.tasks) {
    if (!existingBoardIds.has(task.boardId)) orphaned.push(task.id);
  }
  return orphaned;
}

/**
 * Generates new IDs for conflicting boards and returns mapping
 */
export function regenerateBoardIds(
  boards: Board[],
  duplicateIds: string[]
): { boards: Board[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();
  const duplicateSet = new Set(duplicateIds);

  const updatedBoards = boards.map(board => {
    if (duplicateSet.has(board.id)) {
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
  const duplicateSet = new Set(duplicateTaskIds);
  return tasks.map(task => {
    let updatedTask = task;

    if (boardIdMap.has(task.boardId)) {
      const newBoardId = boardIdMap.get(task.boardId);
      if (newBoardId) updatedTask = { ...updatedTask, boardId: newBoardId };
    }

    if (duplicateSet.has(task.id)) {
      updatedTask = { ...updatedTask, id: crypto.randomUUID() };
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
  const dupTaskIds = new Set(conflicts.duplicateTaskIds);
  const dupBoardIds = new Set(conflicts.duplicateBoardIds);
  return {
    tasks: tasks.filter(task => !dupTaskIds.has(task.id)),
    boards: boards.filter(board => !dupBoardIds.has(board.id)),
  };
}

/**
 * Removes orphaned tasks from the task list
 */
export function removeOrphanedTasks(
  tasks: Task[],
  orphanedTaskIds: string[]
): Task[] {
  const orphanSet = new Set(orphanedTaskIds);
  return tasks.filter(task => !orphanSet.has(task.id));
}
