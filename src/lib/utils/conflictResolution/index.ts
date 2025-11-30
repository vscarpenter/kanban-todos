/**
 * Conflict Resolution Module
 *
 * Provides comprehensive conflict resolution for import operations.
 * Split into focused sub-modules:
 * - types.ts: Type definitions and interfaces
 * - merging.ts: Merge utilities for combining data
 * - boardConflicts.ts: Board-specific conflict resolution
 * - taskConflicts.ts: Task-specific conflict resolution
 * - settingsConflicts.ts: Settings-specific conflict resolution
 */

import { Task, Board, Settings } from '@/lib/types';
import { ExportData, ImportConflicts } from '../exportImport';
import type { ConflictResolutionOptions, ConflictResolutionResult, ResolutionAction } from './types';
import { resolveBoardConflicts, createBoardIdMapping } from './boardConflicts';
import { resolveTaskConflicts } from './taskConflicts';
import { resolveSettingsConflicts } from './settingsConflicts';

// Re-export types
export type {
  ConflictResolutionStrategy,
  MergeStrategy,
  ConflictResolutionOptions,
  ConflictResolutionResult,
  ResolutionAction,
  MergeResult,
  FieldConflict,
} from './types';

// Re-export merge utilities
export {
  mergeBoards,
  mergeTasks,
  mergeSettings,
  generateUniqueBoardName,
} from './merging';

// Re-export conflict resolution functions
export { resolveBoardConflicts, createBoardIdMapping } from './boardConflicts';
export { resolveTaskConflicts } from './taskConflicts';
export { resolveSettingsConflicts } from './settingsConflicts';

/**
 * Resolves import conflicts using specified strategies
 * Main orchestrator function that coordinates all conflict resolution
 */
export function resolveImportConflicts(
  importData: ExportData,
  existingTasks: Task[],
  existingBoards: Board[],
  existingSettings: Settings | undefined,
  conflicts: ImportConflicts,
  options: ConflictResolutionOptions
): ConflictResolutionResult {
  const resolutionLog: ResolutionAction[] = [];
  let backupData: ExportData | undefined;

  // Generate backup if requested
  if (options.generateBackup) {
    backupData = {
      version: importData.version,
      exportedAt: new Date().toISOString(),
      tasks: existingTasks.map(task => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        archivedAt: task.archivedAt?.toISOString(),
        dueDate: task.dueDate?.toISOString(),
      })),
      boards: existingBoards.map(board => ({
        ...board,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
        archivedAt: board.archivedAt?.toISOString(),
      })),
      settings: existingSettings,
    };
  }

  // Resolve board conflicts first (tasks depend on boards)
  const resolvedBoards = resolveBoardConflicts(
    importData.boards.map(board => ({
      ...board,
      createdAt: new Date(board.createdAt),
      updatedAt: new Date(board.updatedAt),
      archivedAt: board.archivedAt ? new Date(board.archivedAt) : undefined,
    })),
    existingBoards,
    conflicts,
    options,
    resolutionLog
  );

  // Create board ID mapping for task resolution
  const boardIdMap = createBoardIdMapping(
    importData.boards,
    resolvedBoards,
    resolutionLog
  );

  // Resolve task conflicts
  const resolvedTasks = resolveTaskConflicts(
    importData.tasks.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      archivedAt: task.archivedAt ? new Date(task.archivedAt) : undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    })),
    existingTasks,
    conflicts,
    options,
    boardIdMap,
    resolutionLog
  );

  // Resolve settings conflicts
  const resolvedSettings = resolveSettingsConflicts(
    importData.settings,
    existingSettings,
    options,
    resolutionLog
  );

  return {
    resolvedTasks,
    resolvedBoards,
    resolvedSettings,
    resolutionLog,
    backupData,
  };
}

/**
 * Generates a summary of conflict resolution actions
 */
export function generateResolutionSummary(resolutionLog: ResolutionAction[]): {
  summary: string;
  details: { [key: string]: number };
} {
  const details = {
    tasksSkipped: 0,
    tasksOverwritten: 0,
    tasksMerged: 0,
    tasksRenamed: 0,
    tasksWithNewIds: 0,
    boardsSkipped: 0,
    boardsOverwritten: 0,
    boardsMerged: 0,
    boardsRenamed: 0,
    boardsWithNewIds: 0,
    settingsMerged: 0,
  };

  for (const action of resolutionLog) {
    const key = `${action.itemType}s${action.type.charAt(0).toUpperCase() + action.type.slice(1).replace('_', '')}`;
    if (key in details) {
      (details as Record<string, number>)[key]++;
    }
  }

  const totalActions = Object.values(details).reduce((sum, count) => sum + count, 0);
  const summary = `Resolved ${totalActions} conflicts: ${resolutionLog.length} actions taken`;

  return { summary, details };
}
