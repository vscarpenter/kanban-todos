/**
 * Import-related functions for application data
 */

import { Task, Board, Settings } from '@/lib/types';
import {
  type ExportData,
  type ImportConflicts,
  type ImportOptions,
  type ImportValidationResult,
  type SerializedBoard,
  type SerializedTask,
  deserializeTask,
  deserializeBoard,
} from './serialize';
import {
  validateExportData,
  validateDataRelationships,
  sanitizeData,
  type SanitizationOptions,
  type DetailedValidationResult,
  exportDataSchema,
  type ValidationSchema,
} from '../validation';
import {
  resolveImportConflicts,
  type ConflictResolutionOptions,
  type ConflictResolutionResult,
} from '../conflictResolution';
import {
  findDuplicateTaskIds,
  findDuplicateBoardIds,
  findDefaultBoardConflicts,
  findBoardNameConflicts,
  findOrphanedTasks,
  regenerateBoardIds,
  regenerateTaskIds,
  filterConflictingItems,
  removeOrphanedTasks,
} from '../exportImportHelpers';
import { sanitizeTaskData, sanitizeBoardData } from '../security';

/**
 * Validates imported JSON data with enhanced validation
 */
export function validateImportData(jsonData: unknown): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is an object
  if (!jsonData || typeof jsonData !== 'object') {
    errors.push('Invalid JSON format: Expected an object');
    return { isValid: false, errors, warnings };
  }

  // Use detailed schema validation
  const schemaValidation = validateExportData(jsonData);

  // Convert detailed validation to simple format for backward compatibility
  errors.push(...schemaValidation.errors.map(e => `${e.path}: ${e.message}`));
  warnings.push(...schemaValidation.warnings.map(w => `${w.path}: ${w.message}`));

  // Additional relationship validation
  if (schemaValidation.isValid) {
    const relationshipValidation = validateDataRelationships(jsonData as ExportData);
    errors.push(...relationshipValidation.errors.map(e => `${e.path}: ${e.message}`));
    warnings.push(...relationshipValidation.warnings.map(w => `${w.path}: ${w.message}`));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? jsonData as ExportData : undefined,
  };
}

/**
 * Detects conflicts in import data
 * Simplified by extracting conflict detection logic to helper functions
 */
export function detectImportConflicts(
  importData: ExportData,
  existingTasks: Task[],
  existingBoards: Board[]
): ImportConflicts {
  const duplicateTaskIds = findDuplicateTaskIds(importData.tasks, existingTasks);
  const duplicateBoardIds = findDuplicateBoardIds(importData.boards, existingBoards);
  const defaultBoardConflicts = findDefaultBoardConflicts(importData.boards, existingBoards);
  const boardNameConflicts = findBoardNameConflicts(
    importData.boards,
    existingBoards,
    defaultBoardConflicts
  );
  const orphanedTasks = findOrphanedTasks(importData, existingBoards);

  return {
    duplicateTaskIds,
    duplicateBoardIds,
    orphanedTasks,
    boardNameConflicts,
    defaultBoardConflicts,
  };
}

/**
 * Processes import data with advanced conflict resolution and sanitization
 * Simplified by extracting ID regeneration and filtering logic to helpers
 */
export function processImportData(
  importData: ExportData,
  conflicts: ImportConflicts,
  options: ImportOptions
): { tasks: Task[]; boards: Board[]; settings?: Settings } {
  // Deserialize and sanitize tasks
  let processedTasks: Task[] = importData.tasks.map(serializedTask => {
    const task = deserializeTask(serializedTask);
    const sanitized = sanitizeTaskData({
      title: task.title,
      description: task.description,
      tags: task.tags,
    });
    // Apply sanitized values, preserving undefined for optional fields
    task.title = sanitized.title;
    task.tags = sanitized.tags;
    if (task.description !== undefined) {
      task.description = sanitized.description;
    }
    return task;
  });

  // Deserialize and sanitize boards
  let processedBoards: Board[] = importData.boards.map(serializedBoard => {
    const board = deserializeBoard(serializedBoard);
    const sanitized = sanitizeBoardData({
      name: board.name,
      description: board.description,
    });
    // Apply sanitized values, preserving undefined for optional fields
    board.name = sanitized.name;
    if (board.description !== undefined) {
      board.description = sanitized.description;
    }
    return board;
  });

  // Handle ID conflicts based on strategy
  if (options.generateNewIds) {
    const { boards, idMap: boardIdMap } = regenerateBoardIds(
      processedBoards,
      conflicts.duplicateBoardIds
    );
    processedBoards = boards;
    processedTasks = regenerateTaskIds(
      processedTasks,
      conflicts.duplicateTaskIds,
      boardIdMap
    );
  } else if (options.skipConflicts) {
    const filtered = filterConflictingItems(processedTasks, processedBoards, conflicts);
    processedTasks = filtered.tasks;
    processedBoards = filtered.boards;
  }

  // Handle orphaned tasks
  if (conflicts.orphanedTasks.length > 0 && options.skipConflicts) {
    processedTasks = removeOrphanedTasks(processedTasks, conflicts.orphanedTasks);
  }
  // Note: If not skipping conflicts, orphaned tasks will cause import to fail
  // This should be handled at the UI level

  return {
    tasks: processedTasks,
    boards: processedBoards,
    settings: importData.settings,
  };
}

/**
 * Sanitizes import data if validation found issues
 */
function sanitizeImportData(
  importData: ExportData,
  validationResult: DetailedValidationResult,
  sanitizationOptions: SanitizationOptions
): { data: ExportData; log: string[] } {
  const sanitizedData = { ...importData };
  const log: string[] = [];

  const needsSanitization = validationResult.warnings.length > 0 ||
    validationResult.errors.some(e => e.severity === 'error');

  if (!needsSanitization) {
    return { data: sanitizedData, log };
  }

  // exportDataSchema.properties is always defined — it's a compile-time constant.
  // Use a local reference to avoid repeated property access and suppress lint noise.
  const schemaProperties = exportDataSchema.properties ?? {};

  // Sanitize tasks
  const taskSanitization = sanitizeData(
    sanitizedData.tasks,
    schemaProperties.tasks as ValidationSchema,
    sanitizationOptions
  );
  sanitizedData.tasks = taskSanitization.sanitized as SerializedTask[];
  log.push(...taskSanitization.changes.map(c => `Tasks: ${c}`));

  // Sanitize boards
  const boardSanitization = sanitizeData(
    importData.boards,
    schemaProperties.boards as ValidationSchema,
    sanitizationOptions
  );
  sanitizedData.boards = boardSanitization.sanitized as SerializedBoard[];
  log.push(...boardSanitization.changes.map(c => `Boards: ${c}`));

  // Sanitize settings if present
  if (importData.settings) {
    const settingsSanitization = sanitizeData(
      importData.settings,
      schemaProperties.settings as ValidationSchema,
      sanitizationOptions
    );
    sanitizedData.settings = settingsSanitization.sanitized as Settings;
    log.push(...settingsSanitization.changes.map(c => `Settings: ${c}`));
  }

  return { data: sanitizedData, log };
}

/**
 * Advanced import processing with validation, sanitization, and conflict resolution
 */
export function processAdvancedImport(
  importData: ExportData,
  existingTasks: Task[],
  existingBoards: Board[],
  existingSettings: Settings | undefined,
  conflictResolutionOptions: ConflictResolutionOptions,
  sanitizationOptions: SanitizationOptions = {
    removeInvalidFields: true,
    fixDateFormats: true,
    normalizeStrings: true,
    validateRelationships: true,
    generateMissingIds: true,
    setDefaultValues: true,
  }
): {
  result: ConflictResolutionResult;
  sanitizationLog: string[];
  validationResult: DetailedValidationResult;
} {
  // Step 1: Validate the import data
  const validationResult = validateExportData(importData);

  // Step 2: Sanitize the data if needed
  const { data: sanitizedData, log: sanitizationLog } = sanitizeImportData(
    importData,
    validationResult,
    sanitizationOptions
  );

  // Step 3: Detect conflicts
  const conflicts = detectImportConflicts(sanitizedData, existingTasks, existingBoards);

  // Step 4: Resolve conflicts
  const result = resolveImportConflicts(
    sanitizedData,
    existingTasks,
    existingBoards,
    existingSettings,
    conflicts,
    conflictResolutionOptions
  );

  return {
    result,
    sanitizationLog,
    validationResult,
  };
}
