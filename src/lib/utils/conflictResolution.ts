/**
 * Conflict Resolution Module - Consolidated
 * Provides comprehensive conflict resolution for import operations.
 * Merge utilities are in conflictMerge.ts.
 */

import { Task, Board, Settings } from '@/lib/types';
import { ExportData, ImportConflicts } from './exportImport';
import {
  mergeBoards,
  mergeTasks,
  mergeSettings,
  generateUniqueBoardName,
} from './conflictMerge';
export type { MergeStrategy, MergeResult, FieldConflict } from './conflictMerge';

// ============================================================================
// Types
// ============================================================================

export type ConflictResolutionStrategy =
  | 'skip'
  | 'overwrite'
  | 'merge'
  | 'rename'
  | 'generate_new_ids'
  | 'ask_user';

export interface ConflictResolutionOptions {
  taskStrategy: ConflictResolutionStrategy;
  boardStrategy: ConflictResolutionStrategy;
  settingsStrategy: ConflictResolutionStrategy;
  mergeStrategy: import('./conflictMerge').MergeStrategy;
  preserveRelationships: boolean;
  generateBackup: boolean;
}

export interface ConflictResolutionResult {
  resolvedTasks: Task[];
  resolvedBoards: Board[];
  resolvedSettings?: Settings;
  resolutionLog: ResolutionAction[];
  backupData?: ExportData;
}

export interface ResolutionAction {
  type: 'skip' | 'overwrite' | 'merge' | 'rename' | 'generate_id';
  itemType: 'task' | 'board' | 'settings';
  itemId: string;
  originalName?: string;
  newName?: string;
  originalId?: string;
  newId?: string;
  mergedFields?: string[];
  reason: string;
}

export function resolveBoardConflicts(
  importedBoards: Board[],
  existingBoards: Board[],
  conflicts: ImportConflicts,
  options: ConflictResolutionOptions,
  resolutionLog: ResolutionAction[]
): Board[] {
  const resolved: Board[] = [...existingBoards];
  const existingBoardMap = new Map(existingBoards.map(b => [b.id, b]));

  for (const importedBoard of importedBoards) {
    const hasIdConflict = conflicts.duplicateBoardIds.includes(importedBoard.id);
    const hasNameConflict = conflicts.boardNameConflicts.includes(importedBoard.name);
    const defaultConflict = conflicts.defaultBoardConflicts.find(c => c.importedBoard.id === importedBoard.id);

    if (!hasIdConflict && !hasNameConflict && !defaultConflict) { resolved.push(importedBoard); continue; }

    if (defaultConflict) {
      const existing = defaultConflict.existingBoard;
      const result = mergeBoards(existing, importedBoard, options.mergeStrategy);
      const merged = { ...result.merged, id: existing.id, isDefault: true, updatedAt: new Date() };
      resolved[resolved.findIndex(b => b.id === existing.id)] = merged;
      resolutionLog.push({ type: 'merge', itemType: 'board', itemId: existing.id, originalName: importedBoard.name, mergedFields: result.mergedFields, reason: 'Merged imported board with existing default board' });
      continue;
    }

    const existingBoard = existingBoardMap.get(importedBoard.id);

    switch (options.boardStrategy) {
      case 'skip':
        resolutionLog.push({ type: 'skip', itemType: 'board', itemId: importedBoard.id, originalName: importedBoard.name, reason: hasIdConflict ? 'ID conflict' : 'Name conflict' });
        break;
      case 'overwrite':
        if (existingBoard) {
          resolved[resolved.findIndex(b => b.id === importedBoard.id)] = importedBoard;
          resolutionLog.push({ type: 'overwrite', itemType: 'board', itemId: importedBoard.id, originalName: importedBoard.name, reason: 'Overwrote existing board' });
        }
        break;
      case 'merge':
        if (existingBoard) {
          const result = mergeBoards(existingBoard, importedBoard, options.mergeStrategy);
          resolved[resolved.findIndex(b => b.id === importedBoard.id)] = result.merged;
          resolutionLog.push({ type: 'merge', itemType: 'board', itemId: importedBoard.id, originalName: importedBoard.name, mergedFields: result.mergedFields, reason: 'Merged with existing board' });
        }
        break;
      case 'rename':
        const renamed = { ...importedBoard, name: generateUniqueBoardName(importedBoard.name, resolved) };
        resolved.push(renamed);
        resolutionLog.push({ type: 'rename', itemType: 'board', itemId: importedBoard.id, originalName: importedBoard.name, newName: renamed.name, reason: 'Renamed to avoid conflict' });
        break;
      case 'generate_new_ids':
        const newId = crypto.randomUUID();
        resolved.push({ ...importedBoard, id: newId });
        resolutionLog.push({ type: 'generate_id', itemType: 'board', itemId: importedBoard.id, originalId: importedBoard.id, newId, reason: 'Generated new ID to avoid conflict' });
        break;
    }
  }
  return resolved;
}

export function createBoardIdMapping(
  importedBoards: { id: string; name: string }[],
  resolvedBoards: Board[],
  resolutionLog: ResolutionAction[]
): Map<string, string> {
  const mapping = new Map<string, string>();
  for (const action of resolutionLog) {
    if (action.itemType === 'board' && action.type === 'generate_id') {
      if (action.originalId && action.newId) {
        mapping.set(action.originalId, action.newId);
      }
    }
    if (action.itemType === 'board' && action.type === 'merge' && action.reason === 'Merged imported board with existing default board') {
      const imported = importedBoards.find(b => b.name === action.originalName);
      if (imported) mapping.set(imported.id, action.itemId);
    }
  }
  return mapping;
}

// ============================================================================
// Task Conflict Resolution
// ============================================================================

export function resolveTaskConflicts(
  importedTasks: Task[],
  existingTasks: Task[],
  conflicts: ImportConflicts,
  options: ConflictResolutionOptions,
  boardIdMap: Map<string, string>,
  resolutionLog: ResolutionAction[]
): Task[] {
  const resolved: Task[] = [...existingTasks];
  const existingTaskMap = new Map(existingTasks.map(t => [t.id, t]));

  for (const importedTask of importedTasks) {
    let processed = importedTask;
    if (boardIdMap.has(importedTask.boardId)) {
      const newBoardId = boardIdMap.get(importedTask.boardId);
      if (newBoardId) processed = { ...importedTask, boardId: newBoardId };
    }

    const hasIdConflict = conflicts.duplicateTaskIds.includes(importedTask.id);
    const isOrphaned = conflicts.orphanedTasks.includes(importedTask.id);

    if (isOrphaned && options.taskStrategy !== 'generate_new_ids') {
      resolutionLog.push({ type: 'skip', itemType: 'task', itemId: importedTask.id, reason: 'Task references non-existent board' });
      continue;
    }
    if (!hasIdConflict) { resolved.push(processed); continue; }

    const existingTask = existingTaskMap.get(importedTask.id);

    switch (options.taskStrategy) {
      case 'skip':
        resolutionLog.push({ type: 'skip', itemType: 'task', itemId: importedTask.id, reason: 'ID conflict' });
        break;
      case 'overwrite':
        if (existingTask) {
          resolved[resolved.findIndex(t => t.id === importedTask.id)] = processed;
          resolutionLog.push({ type: 'overwrite', itemType: 'task', itemId: importedTask.id, reason: 'Overwrote existing task' });
        }
        break;
      case 'merge':
        if (existingTask) {
          const result = mergeTasks(existingTask, processed, options.mergeStrategy);
          resolved[resolved.findIndex(t => t.id === importedTask.id)] = result.merged;
          resolutionLog.push({ type: 'merge', itemType: 'task', itemId: importedTask.id, mergedFields: result.mergedFields, reason: 'Merged with existing task' });
        }
        break;
      case 'generate_new_ids':
        const newId = crypto.randomUUID();
        resolved.push({ ...processed, id: newId });
        resolutionLog.push({ type: 'generate_id', itemType: 'task', itemId: importedTask.id, originalId: importedTask.id, newId, reason: 'Generated new ID to avoid conflict' });
        break;
    }
  }
  return resolved;
}

// ============================================================================
// Settings Conflict Resolution
// ============================================================================

export function resolveSettingsConflicts(
  importedSettings: Settings | undefined,
  existingSettings: Settings | undefined,
  options: ConflictResolutionOptions,
  resolutionLog: ResolutionAction[]
): Settings | undefined {
  if (!importedSettings) return existingSettings;
  if (!existingSettings) return importedSettings;

  switch (options.settingsStrategy) {
    case 'skip':
      resolutionLog.push({ type: 'skip', itemType: 'settings', itemId: 'settings', reason: 'Kept existing settings' });
      return existingSettings;
    case 'overwrite':
      resolutionLog.push({ type: 'overwrite', itemType: 'settings', itemId: 'settings', reason: 'Overwrote with imported settings' });
      return importedSettings;
    case 'merge':
      const result = mergeSettings(existingSettings, importedSettings, options.mergeStrategy);
      resolutionLog.push({ type: 'merge', itemType: 'settings', itemId: 'settings', mergedFields: result.mergedFields, reason: 'Merged settings' });
      return result.merged;
    default:
      return existingSettings;
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

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

  if (options.generateBackup) {
    backupData = {
      version: importData.version,
      exportedAt: new Date().toISOString(),
      tasks: existingTasks.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(), completedAt: t.completedAt?.toISOString(), archivedAt: t.archivedAt?.toISOString(), dueDate: t.dueDate?.toISOString() })),
      boards: existingBoards.map(b => ({ ...b, createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(), archivedAt: b.archivedAt?.toISOString() })),
      settings: existingSettings,
    };
  }

  const resolvedBoards = resolveBoardConflicts(
    importData.boards.map(b => ({ ...b, createdAt: new Date(b.createdAt), updatedAt: new Date(b.updatedAt), archivedAt: b.archivedAt ? new Date(b.archivedAt) : undefined })),
    existingBoards, conflicts, options, resolutionLog
  );

  const boardIdMap = createBoardIdMapping(importData.boards, resolvedBoards, resolutionLog);

  const resolvedTasks = resolveTaskConflicts(
    importData.tasks.map(t => ({ ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt), completedAt: t.completedAt ? new Date(t.completedAt) : undefined, archivedAt: t.archivedAt ? new Date(t.archivedAt) : undefined, dueDate: t.dueDate ? new Date(t.dueDate) : undefined })),
    existingTasks, conflicts, options, boardIdMap, resolutionLog
  );

  const resolvedSettings = resolveSettingsConflicts(importData.settings, existingSettings, options, resolutionLog);

  return { resolvedTasks, resolvedBoards, resolvedSettings, resolutionLog, backupData };
}

export function generateResolutionSummary(resolutionLog: ResolutionAction[]): { summary: string; details: Record<string, number> } {
  const details: Record<string, number> = {
    tasksSkipped: 0, tasksOverwritten: 0, tasksMerged: 0, tasksRenamed: 0, tasksWithNewIds: 0,
    boardsSkipped: 0, boardsOverwritten: 0, boardsMerged: 0, boardsRenamed: 0, boardsWithNewIds: 0,
    settingsMerged: 0
  };

  for (const action of resolutionLog) {
    const key = `${action.itemType}s${action.type.charAt(0).toUpperCase() + action.type.slice(1).replace('_', '')}`;
    if (key in details) details[key]++;
  }

  return { summary: `Resolved ${Object.values(details).reduce((a, b) => a + b, 0)} conflicts`, details };
}
