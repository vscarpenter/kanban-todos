/**
 * Conflict Resolution Module - Consolidated
 * Provides comprehensive conflict resolution for import operations.
 * Merge utilities are in conflictMerge.ts.
 */

import { Task, Board, Settings } from '@/lib/types';
import {
  ExportData,
  ImportConflicts,
  serializeTask,
  deserializeTask,
  serializeBoard,
  deserializeBoard,
} from './exportImport';
import {
  mergeBoards,
  mergeTasks,
  mergeSettings,
  generateUniqueBoardName,
  type MergeStrategy,
} from './conflictMerge';

// ============================================================================
// Types
// ============================================================================

type ConflictResolutionStrategy =
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

// ----------------------------------------------------------------------------
// Board conflict strategy helpers — one per `boardStrategy` case, so the
// dispatch loop in resolveBoardConflicts stays flat (loop + switch + a single
// call per case) instead of nesting `if`s inside each `case`.
// ----------------------------------------------------------------------------

function skipBoardConflict(
  importedBoard: Board,
  hasIdConflict: boolean,
  resolutionLog: ResolutionAction[]
): void {
  resolutionLog.push({
    type: 'skip',
    itemType: 'board',
    itemId: importedBoard.id,
    originalName: importedBoard.name,
    reason: hasIdConflict ? 'ID conflict' : 'Name conflict',
  });
}

function overwriteBoardConflict(
  importedBoard: Board,
  existingBoard: Board | undefined,
  resolved: Board[],
  indexById: Map<string, number>,
  resolutionLog: ResolutionAction[]
): void {
  if (!existingBoard) return;
  const idx = indexById.get(importedBoard.id);
  if (idx !== undefined) resolved[idx] = importedBoard;
  resolutionLog.push({
    type: 'overwrite',
    itemType: 'board',
    itemId: importedBoard.id,
    originalName: importedBoard.name,
    reason: 'Overwrote existing board',
  });
}

function mergeBoardConflict(
  importedBoard: Board,
  existingBoard: Board | undefined,
  resolved: Board[],
  indexById: Map<string, number>,
  mergeStrategy: MergeStrategy,
  resolutionLog: ResolutionAction[]
): void {
  if (!existingBoard) return;
  const result = mergeBoards(existingBoard, importedBoard, mergeStrategy);
  const idx = indexById.get(importedBoard.id);
  if (idx !== undefined) resolved[idx] = result.merged;
  resolutionLog.push({
    type: 'merge',
    itemType: 'board',
    itemId: importedBoard.id,
    originalName: importedBoard.name,
    mergedFields: result.mergedFields,
    reason: 'Merged with existing board',
  });
}

function renameBoardConflict(
  importedBoard: Board,
  resolved: Board[],
  resolutionLog: ResolutionAction[]
): void {
  const renamed = { ...importedBoard, name: generateUniqueBoardName(importedBoard.name, resolved) };
  resolved.push(renamed);
  resolutionLog.push({
    type: 'rename',
    itemType: 'board',
    itemId: importedBoard.id,
    originalName: importedBoard.name,
    newName: renamed.name,
    reason: 'Renamed to avoid conflict',
  });
}

function regenerateBoardId(
  importedBoard: Board,
  resolved: Board[],
  resolutionLog: ResolutionAction[]
): void {
  const newId = crypto.randomUUID();
  resolved.push({ ...importedBoard, id: newId });
  resolutionLog.push({
    type: 'generate_id',
    itemType: 'board',
    itemId: importedBoard.id,
    originalId: importedBoard.id,
    newId,
    reason: 'Generated new ID to avoid conflict',
  });
}

/** Merges an imported board into the existing default board it conflicts with. */
function mergeDefaultBoardConflict(
  importedBoard: Board,
  existingDefault: Board,
  resolved: Board[],
  indexById: Map<string, number>,
  mergeStrategy: MergeStrategy,
  resolutionLog: ResolutionAction[]
): void {
  const result = mergeBoards(existingDefault, importedBoard, mergeStrategy);
  const merged = { ...result.merged, id: existingDefault.id, isDefault: true, updatedAt: new Date() };
  const idx = indexById.get(existingDefault.id);
  if (idx !== undefined) resolved[idx] = merged;
  resolutionLog.push({
    type: 'merge',
    itemType: 'board',
    itemId: existingDefault.id,
    originalName: importedBoard.name,
    mergedFields: result.mergedFields,
    reason: 'Merged imported board with existing default board',
  });
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
  const indexById = new Map(existingBoards.map((b, i) => [b.id, i]));
  const duplicateIds = new Set(conflicts.duplicateBoardIds);
  const nameConflicts = new Set(conflicts.boardNameConflicts);
  const defaultConflictByImportedId = new Map(
    conflicts.defaultBoardConflicts.map(c => [c.importedBoard.id, c])
  );

  for (const importedBoard of importedBoards) {
    const hasIdConflict = duplicateIds.has(importedBoard.id);
    const hasNameConflict = nameConflicts.has(importedBoard.name);
    const defaultConflict = defaultConflictByImportedId.get(importedBoard.id);
    if (!hasIdConflict && !hasNameConflict && !defaultConflict) { resolved.push(importedBoard); continue; }
    if (defaultConflict) {
      mergeDefaultBoardConflict(importedBoard, defaultConflict.existingBoard, resolved, indexById, options.mergeStrategy, resolutionLog);
      continue;
    }

    const existingBoard = existingBoardMap.get(importedBoard.id);
    switch (options.boardStrategy) {
      case 'skip':
        skipBoardConflict(importedBoard, hasIdConflict, resolutionLog);
        break;
      case 'overwrite':
        overwriteBoardConflict(importedBoard, existingBoard, resolved, indexById, resolutionLog);
        break;
      case 'merge':
        mergeBoardConflict(importedBoard, existingBoard, resolved, indexById, options.mergeStrategy, resolutionLog);
        break;
      case 'rename':
        renameBoardConflict(importedBoard, resolved, resolutionLog);
        break;
      case 'generate_new_ids':
        regenerateBoardId(importedBoard, resolved, resolutionLog);
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
  const importedByName = new Map(importedBoards.map(b => [b.name, b]));
  for (const action of resolutionLog) {
    if (action.itemType === 'board' && action.type === 'generate_id') {
      if (action.originalId && action.newId) {
        mapping.set(action.originalId, action.newId);
      }
    }
    if (action.itemType === 'board' && action.type === 'merge' && action.reason === 'Merged imported board with existing default board') {
      const imported = action.originalName ? importedByName.get(action.originalName) : undefined;
      if (imported) mapping.set(imported.id, action.itemId);
    }
  }
  return mapping;
}

// ============================================================================
// Task Conflict Resolution
// ============================================================================

// ----------------------------------------------------------------------------
// Task conflict strategy helpers — mirrors the board helpers above, one per
// `taskStrategy` case, so resolveTaskConflicts stays a flat loop + dispatch.
// ----------------------------------------------------------------------------

function skipTaskConflict(importedTaskId: string, resolutionLog: ResolutionAction[]): void {
  resolutionLog.push({ type: 'skip', itemType: 'task', itemId: importedTaskId, reason: 'ID conflict' });
}

function overwriteTaskConflict(
  importedTaskId: string,
  processed: Task,
  existingTask: Task | undefined,
  resolved: Task[],
  indexById: Map<string, number>,
  resolutionLog: ResolutionAction[]
): void {
  if (!existingTask) return;
  const idx = indexById.get(importedTaskId);
  if (idx !== undefined) resolved[idx] = processed;
  resolutionLog.push({ type: 'overwrite', itemType: 'task', itemId: importedTaskId, reason: 'Overwrote existing task' });
}

function mergeTaskConflict(
  importedTaskId: string,
  processed: Task,
  existingTask: Task | undefined,
  resolved: Task[],
  indexById: Map<string, number>,
  mergeStrategy: MergeStrategy,
  resolutionLog: ResolutionAction[]
): void {
  if (!existingTask) return;
  const result = mergeTasks(existingTask, processed, mergeStrategy);
  const idx = indexById.get(importedTaskId);
  if (idx !== undefined) resolved[idx] = result.merged;
  resolutionLog.push({ type: 'merge', itemType: 'task', itemId: importedTaskId, mergedFields: result.mergedFields, reason: 'Merged with existing task' });
}

function regenerateTaskId(
  importedTaskId: string,
  processed: Task,
  resolved: Task[],
  resolutionLog: ResolutionAction[]
): void {
  const newId = crypto.randomUUID();
  resolved.push({ ...processed, id: newId });
  resolutionLog.push({ type: 'generate_id', itemType: 'task', itemId: importedTaskId, originalId: importedTaskId, newId, reason: 'Generated new ID to avoid conflict' });
}

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
  const indexById = new Map(existingTasks.map((t, i) => [t.id, i]));
  const duplicateIds = new Set(conflicts.duplicateTaskIds);
  const orphaned = new Set(conflicts.orphanedTasks);

  for (const importedTask of importedTasks) {
    let processed = importedTask;
    if (boardIdMap.has(importedTask.boardId)) {
      const newBoardId = boardIdMap.get(importedTask.boardId);
      if (newBoardId) processed = { ...importedTask, boardId: newBoardId };
    }

    const hasIdConflict = duplicateIds.has(importedTask.id);
    const isOrphaned = orphaned.has(importedTask.id);

    if (isOrphaned && options.taskStrategy !== 'generate_new_ids') {
      resolutionLog.push({ type: 'skip', itemType: 'task', itemId: importedTask.id, reason: 'Task references non-existent board' });
      continue;
    }
    if (!hasIdConflict) { resolved.push(processed); continue; }

    const existingTask = existingTaskMap.get(importedTask.id);

    switch (options.taskStrategy) {
      case 'skip':
        skipTaskConflict(importedTask.id, resolutionLog);
        break;
      case 'overwrite':
        overwriteTaskConflict(importedTask.id, processed, existingTask, resolved, indexById, resolutionLog);
        break;
      case 'merge':
        mergeTaskConflict(importedTask.id, processed, existingTask, resolved, indexById, options.mergeStrategy, resolutionLog);
        break;
      case 'generate_new_ids':
        regenerateTaskId(importedTask.id, processed, resolved, resolutionLog);
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
    case 'merge': {
      const result = mergeSettings(existingSettings, importedSettings, options.mergeStrategy);
      resolutionLog.push({ type: 'merge', itemType: 'settings', itemId: 'settings', mergedFields: result.mergedFields, reason: 'Merged settings' });
      return result.merged;
    }
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
      tasks: existingTasks.map(serializeTask),
      boards: existingBoards.map(serializeBoard),
      settings: existingSettings,
    };
  }

  const resolvedBoards = resolveBoardConflicts(
    importData.boards.map(deserializeBoard),
    existingBoards, conflicts, options, resolutionLog
  );

  const boardIdMap = createBoardIdMapping(importData.boards, resolvedBoards, resolutionLog);

  const resolvedTasks = resolveTaskConflicts(
    importData.tasks.map(deserializeTask),
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
    if (action.itemType === 'settings') {
      if (action.type === 'merge') details.settingsMerged++;
      continue;
    }

    const itemPrefix = action.itemType === 'task' ? 'tasks' : 'boards';
    const actionSuffix: Record<ResolutionAction['type'], string> = {
      skip: 'Skipped',
      overwrite: 'Overwritten',
      merge: 'Merged',
      rename: 'Renamed',
      generate_id: 'WithNewIds',
    };
    const key = `${itemPrefix}${actionSuffix[action.type]}`;
    details[key]++;
  }

  return { summary: `Resolved ${Object.values(details).reduce((a, b) => a + b, 0)} conflicts`, details };
}
