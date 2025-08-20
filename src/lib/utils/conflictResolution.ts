import { Task, Board, Settings } from '@/lib/types';
import { ExportData, ImportConflicts } from './exportImport';

// Conflict resolution strategies
export type ConflictResolutionStrategy = 
  | 'skip'           // Skip conflicting items
  | 'overwrite'      // Overwrite existing items
  | 'merge'          // Merge data intelligently
  | 'rename'         // Rename conflicting items
  | 'generate_new_ids' // Generate new IDs for conflicts
  | 'ask_user';      // Prompt user for each conflict

// Merge strategies for different data types
export type MergeStrategy = 
  | 'keep_existing'   // Keep existing data
  | 'use_imported'    // Use imported data
  | 'merge_fields'    // Merge individual fields
  | 'keep_newer'      // Keep newer based on updatedAt
  | 'keep_older';     // Keep older based on createdAt

export interface ConflictResolutionOptions {
  taskStrategy: ConflictResolutionStrategy;
  boardStrategy: ConflictResolutionStrategy;
  settingsStrategy: ConflictResolutionStrategy;
  mergeStrategy: MergeStrategy;
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

export interface MergeResult<T> {
  merged: T;
  conflicts: FieldConflict[];
  mergedFields: string[];
}

export interface FieldConflict {
  field: string;
  existingValue: unknown;
  importedValue: unknown;
  resolution: 'kept_existing' | 'used_imported' | 'merged';
  reason: string;
}

/**
 * Resolves import conflicts using specified strategies
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
 * Resolves board conflicts
 */
function resolveBoardConflicts(
  importedBoards: Board[],
  existingBoards: Board[],
  conflicts: ImportConflicts,
  options: ConflictResolutionOptions,
  resolutionLog: ResolutionAction[]
): Board[] {
  const resolved: Board[] = [...existingBoards];
  const existingBoardMap = new Map(existingBoards.map(board => [board.id, board]));

  for (const importedBoard of importedBoards) {
    const hasIdConflict = conflicts.duplicateBoardIds.includes(importedBoard.id);
    const hasNameConflict = conflicts.boardNameConflicts.includes(importedBoard.name);

    if (!hasIdConflict && !hasNameConflict) {
      // No conflict, add directly
      resolved.push(importedBoard);
      continue;
    }

    const existingBoard = existingBoardMap.get(importedBoard.id);

    switch (options.boardStrategy) {
      case 'skip':
        resolutionLog.push({
          type: 'skip',
          itemType: 'board',
          itemId: importedBoard.id,
          originalName: importedBoard.name,
          reason: hasIdConflict ? 'ID conflict' : 'Name conflict'
        });
        break;

      case 'overwrite':
        if (existingBoard) {
          const index = resolved.findIndex(b => b.id === importedBoard.id);
          resolved[index] = importedBoard;
          resolutionLog.push({
            type: 'overwrite',
            itemType: 'board',
            itemId: importedBoard.id,
            originalName: importedBoard.name,
            reason: 'Overwrote existing board'
          });
        }
        break;

      case 'merge':
        if (existingBoard) {
          const mergeResult = mergeBoards(existingBoard, importedBoard, options.mergeStrategy);
          const index = resolved.findIndex(b => b.id === importedBoard.id);
          resolved[index] = mergeResult.merged;
          resolutionLog.push({
            type: 'merge',
            itemType: 'board',
            itemId: importedBoard.id,
            originalName: importedBoard.name,
            mergedFields: mergeResult.mergedFields,
            reason: 'Merged with existing board'
          });
        }
        break;

      case 'rename':
        const renamedBoard = {
          ...importedBoard,
          name: generateUniqueBoardName(importedBoard.name, resolved)
        };
        resolved.push(renamedBoard);
        resolutionLog.push({
          type: 'rename',
          itemType: 'board',
          itemId: importedBoard.id,
          originalName: importedBoard.name,
          newName: renamedBoard.name,
          reason: 'Renamed to avoid conflict'
        });
        break;

      case 'generate_new_ids':
        const newId = crypto.randomUUID();
        const newBoard = { ...importedBoard, id: newId };
        resolved.push(newBoard);
        resolutionLog.push({
          type: 'generate_id',
          itemType: 'board',
          itemId: importedBoard.id,
          originalId: importedBoard.id,
          newId: newId,
          reason: 'Generated new ID to avoid conflict'
        });
        break;
    }
  }

  return resolved;
}

/**
 * Resolves task conflicts
 */
function resolveTaskConflicts(
  importedTasks: Task[],
  existingTasks: Task[],
  conflicts: ImportConflicts,
  options: ConflictResolutionOptions,
  boardIdMap: Map<string, string>,
  resolutionLog: ResolutionAction[]
): Task[] {
  const resolved: Task[] = [...existingTasks];
  const existingTaskMap = new Map(existingTasks.map(task => [task.id, task]));

  for (const importedTask of importedTasks) {
    // Update board reference if board ID was changed
    let processedTask = importedTask;
    if (boardIdMap.has(importedTask.boardId)) {
      processedTask = {
        ...importedTask,
        boardId: boardIdMap.get(importedTask.boardId)!
      };
    }

    const hasIdConflict = conflicts.duplicateTaskIds.includes(importedTask.id);
    const isOrphaned = conflicts.orphanedTasks.includes(importedTask.id);

    if (isOrphaned && options.taskStrategy !== 'generate_new_ids') {
      // Skip orphaned tasks unless we're generating new IDs
      resolutionLog.push({
        type: 'skip',
        itemType: 'task',
        itemId: importedTask.id,
        reason: 'Task references non-existent board'
      });
      continue;
    }

    if (!hasIdConflict) {
      // No conflict, add directly
      resolved.push(processedTask);
      continue;
    }

    const existingTask = existingTaskMap.get(importedTask.id);

    switch (options.taskStrategy) {
      case 'skip':
        resolutionLog.push({
          type: 'skip',
          itemType: 'task',
          itemId: importedTask.id,
          reason: 'ID conflict'
        });
        break;

      case 'overwrite':
        if (existingTask) {
          const index = resolved.findIndex(t => t.id === importedTask.id);
          resolved[index] = processedTask;
          resolutionLog.push({
            type: 'overwrite',
            itemType: 'task',
            itemId: importedTask.id,
            reason: 'Overwrote existing task'
          });
        }
        break;

      case 'merge':
        if (existingTask) {
          const mergeResult = mergeTasks(existingTask, processedTask, options.mergeStrategy);
          const index = resolved.findIndex(t => t.id === importedTask.id);
          resolved[index] = mergeResult.merged;
          resolutionLog.push({
            type: 'merge',
            itemType: 'task',
            itemId: importedTask.id,
            mergedFields: mergeResult.mergedFields,
            reason: 'Merged with existing task'
          });
        }
        break;

      case 'generate_new_ids':
        const newId = crypto.randomUUID();
        const newTask = { ...processedTask, id: newId };
        resolved.push(newTask);
        resolutionLog.push({
          type: 'generate_id',
          itemType: 'task',
          itemId: importedTask.id,
          originalId: importedTask.id,
          newId: newId,
          reason: 'Generated new ID to avoid conflict'
        });
        break;
    }
  }

  return resolved;
}

/**
 * Resolves settings conflicts
 */
function resolveSettingsConflicts(
  importedSettings: Settings | undefined,
  existingSettings: Settings | undefined,
  options: ConflictResolutionOptions,
  resolutionLog: ResolutionAction[]
): Settings | undefined {
  if (!importedSettings) {
    return existingSettings;
  }

  if (!existingSettings) {
    return importedSettings;
  }

  switch (options.settingsStrategy) {
    case 'skip':
      resolutionLog.push({
        type: 'skip',
        itemType: 'settings',
        itemId: 'settings',
        reason: 'Kept existing settings'
      });
      return existingSettings;

    case 'overwrite':
      resolutionLog.push({
        type: 'overwrite',
        itemType: 'settings',
        itemId: 'settings',
        reason: 'Overwrote with imported settings'
      });
      return importedSettings;

    case 'merge':
      const mergeResult = mergeSettings(existingSettings, importedSettings, options.mergeStrategy);
      resolutionLog.push({
        type: 'merge',
        itemType: 'settings',
        itemId: 'settings',
        mergedFields: mergeResult.mergedFields,
        reason: 'Merged settings'
      });
      return mergeResult.merged;

    default:
      return existingSettings;
  }
}

/**
 * Merges two boards intelligently
 */
function mergeBoards(existing: Board, imported: Board, strategy: MergeStrategy): MergeResult<Board> {
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged = { ...existing };

  const fields: (keyof Board)[] = ['name', 'description', 'color', 'isDefault'];

  for (const field of fields) {
    if (existing[field] !== imported[field]) {
      conflicts.push({
        field,
        existingValue: existing[field],
        importedValue: imported[field],
        resolution: 'kept_existing',
        reason: `Different ${field} values`
      });

      switch (strategy) {
        case 'use_imported':
          (merged as Record<string, unknown>)[field] = imported[field];
          mergedFields.push(field);
          break;
        case 'keep_newer':
          if (imported.updatedAt > existing.updatedAt) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
        case 'merge_fields':
          if (field === 'description' && !existing[field] && imported[field]) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
      }
    }
  }

  // Always use the newer updatedAt
  if (imported.updatedAt > existing.updatedAt) {
    merged.updatedAt = imported.updatedAt;
    mergedFields.push('updatedAt');
  }

  return { merged, conflicts, mergedFields };
}

/**
 * Merges two tasks intelligently
 */
function mergeTasks(existing: Task, imported: Task, strategy: MergeStrategy): MergeResult<Task> {
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged = { ...existing };

  const fields: (keyof Task)[] = [
    'title', 'description', 'status', 'priority', 'tags', 'progress'
  ];

  for (const field of fields) {
    if (JSON.stringify(existing[field]) !== JSON.stringify(imported[field])) {
      conflicts.push({
        field,
        existingValue: existing[field],
        importedValue: imported[field],
        resolution: 'kept_existing',
        reason: `Different ${field} values`
      });

      switch (strategy) {
        case 'use_imported':
          (merged as Record<string, unknown>)[field] = imported[field];
          mergedFields.push(field);
          break;
        case 'keep_newer':
          if (imported.updatedAt > existing.updatedAt) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
        case 'merge_fields':
          if (field === 'tags') {
            // Merge tags arrays
            const existingTags = existing.tags || [];
            const importedTags = imported.tags || [];
            merged.tags = [...new Set([...existingTags, ...importedTags])];
            mergedFields.push(field);
          } else if (field === 'description' && !existing[field] && imported[field]) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
      }
    }
  }

  // Always use the newer updatedAt
  if (imported.updatedAt > existing.updatedAt) {
    merged.updatedAt = imported.updatedAt;
    mergedFields.push('updatedAt');
  }

  return { merged, conflicts, mergedFields };
}

/**
 * Merges settings intelligently
 */
function mergeSettings(existing: Settings, imported: Settings, strategy: MergeStrategy): MergeResult<Settings> {
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged = { ...existing };

  const fields: (keyof Settings)[] = [
    'theme', 'autoArchiveDays', 'enableNotifications', 
    'enableKeyboardShortcuts', 'enableDebugMode'
  ];

  for (const field of fields) {
    if (existing[field] !== imported[field]) {
      conflicts.push({
        field,
        existingValue: existing[field],
        importedValue: imported[field],
        resolution: 'kept_existing',
        reason: `Different ${field} values`
      });

      if (strategy === 'use_imported' || strategy === 'merge_fields') {
        (merged as Record<string, unknown>)[field] = imported[field];
        mergedFields.push(field);
      }
    }
  }

  // Merge accessibility settings
  if (JSON.stringify(existing.accessibility) !== JSON.stringify(imported.accessibility)) {
    if (strategy === 'use_imported') {
      merged.accessibility = imported.accessibility;
      mergedFields.push('accessibility');
    } else if (strategy === 'merge_fields') {
      merged.accessibility = {
        ...existing.accessibility,
        ...imported.accessibility
      };
      mergedFields.push('accessibility');
    }
  }

  return { merged, conflicts, mergedFields };
}

/**
 * Creates a mapping of old board IDs to new board IDs
 */
function createBoardIdMapping(
  importedBoards: { id: string; name: string }[],
  resolvedBoards: Board[],
  resolutionLog: ResolutionAction[]
): Map<string, string> {
  const mapping = new Map<string, string>();

  for (const action of resolutionLog) {
    if (action.itemType === 'board' && action.type === 'generate_id') {
      mapping.set(action.originalId!, action.newId!);
    }
  }

  return mapping;
}

/**
 * Generates a unique board name
 */
function generateUniqueBoardName(baseName: string, existingBoards: Board[]): string {
  const existingNames = new Set(
    existingBoards.map(board => board.name.toLowerCase())
  );

  let counter = 1;
  let newName = `${baseName} (Copy)`;

  while (existingNames.has(newName.toLowerCase())) {
    counter++;
    newName = `${baseName} (Copy ${counter})`;
  }

  return newName;
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
