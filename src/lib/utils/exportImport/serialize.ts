/**
 * Date serialization/deserialization helpers and type definitions for export/import
 */

import { Task, Board, Settings } from '@/lib/types';

// Version for data format compatibility
export const DATA_FORMAT_VERSION = '1.0.0';

// Export data types
export interface ExportData {
  version: string;
  exportedAt: string;
  tasks: SerializedTask[];
  boards: SerializedBoard[];
  settings?: SerializedSettings;
}

export interface ExportOptions {
  includeTasks: boolean;
  includeBoards: boolean;
  includeSettings: boolean;
  includeArchivedTasks: boolean;
  includeArchivedBoards: boolean;
  boardIds?: string[]; // Export specific boards only
}

// Serialized versions with Date objects converted to strings
export interface SerializedTask extends Omit<Task, 'createdAt' | 'updatedAt' | 'completedAt' | 'archivedAt' | 'dueDate'> {
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
  dueDate?: string;
}

export interface SerializedBoard extends Omit<Board, 'createdAt' | 'updatedAt' | 'archivedAt'> {
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type SerializedSettings = Settings;

// Import validation results
export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: ExportData;
}

export interface ImportConflicts {
  duplicateTaskIds: string[];
  duplicateBoardIds: string[];
  orphanedTasks: string[]; // Tasks referencing non-existent boards
  boardNameConflicts: string[];
  defaultBoardConflicts: Array<{
    importedBoard: SerializedBoard;
    existingBoard: Board;
  }>;
}

export interface ImportOptions {
  overwriteExisting: boolean;
  generateNewIds: boolean;
  skipConflicts: boolean;
  mergeSettings: boolean;
}

/**
 * Converts Date objects to ISO strings for JSON serialization
 */
export function serializeDate(date: Date): string;
export function serializeDate(date: Date | undefined): string | undefined;
export function serializeDate(date: Date | undefined): string | undefined {
  return date ? date.toISOString() : undefined;
}

/**
 * Converts ISO strings back to Date objects
 */
export function deserializeDate(dateString: string): Date;
export function deserializeDate(dateString: string | undefined): Date | undefined;
export function deserializeDate(dateString: string | undefined): Date | undefined {
  return dateString ? new Date(dateString) : undefined;
}

/**
 * Serializes a task for JSON export
 */
export function serializeTask(task: Task): SerializedTask {
  return {
    ...task,
    createdAt: serializeDate(task.createdAt),
    updatedAt: serializeDate(task.updatedAt),
    completedAt: serializeDate(task.completedAt),
    archivedAt: serializeDate(task.archivedAt),
    dueDate: serializeDate(task.dueDate),
  };
}

/**
 * Deserializes a task from JSON import
 */
export function deserializeTask(serializedTask: SerializedTask): Task {
  return {
    ...serializedTask,
    createdAt: deserializeDate(serializedTask.createdAt),
    updatedAt: deserializeDate(serializedTask.updatedAt),
    completedAt: deserializeDate(serializedTask.completedAt),
    archivedAt: deserializeDate(serializedTask.archivedAt),
    dueDate: deserializeDate(serializedTask.dueDate),
  };
}

/**
 * Serializes a board for JSON export
 */
export function serializeBoard(board: Board): SerializedBoard {
  return {
    ...board,
    createdAt: serializeDate(board.createdAt),
    updatedAt: serializeDate(board.updatedAt),
    archivedAt: serializeDate(board.archivedAt),
  };
}

/**
 * Deserializes a board from JSON import
 */
export function deserializeBoard(serializedBoard: SerializedBoard): Board {
  return {
    ...serializedBoard,
    createdAt: deserializeDate(serializedBoard.createdAt),
    updatedAt: deserializeDate(serializedBoard.updatedAt),
    archivedAt: deserializeDate(serializedBoard.archivedAt),
  };
}
