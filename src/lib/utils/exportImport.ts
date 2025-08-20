import { Task, Board, Settings } from '@/lib/types';
import { 
  validateExportData, 
  validateDataRelationships, 
  sanitizeData, 
  SanitizationOptions,
  DetailedValidationResult,
  exportDataSchema,
  ValidationSchema
} from './validation';
import { 
  resolveImportConflicts, 
  ConflictResolutionOptions, 
  ConflictResolutionResult
} from './conflictResolution';

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
function serializeDate(date: Date | undefined): string | undefined {
  return date ? date.toISOString() : undefined;
}

/**
 * Converts ISO strings back to Date objects
 */
function deserializeDate(dateString: string | undefined): Date | undefined {
  return dateString ? new Date(dateString) : undefined;
}

/**
 * Serializes a task for JSON export
 */
function serializeTask(task: Task): SerializedTask {
  return {
    ...task,
    createdAt: serializeDate(task.createdAt)!,
    updatedAt: serializeDate(task.updatedAt)!,
    completedAt: serializeDate(task.completedAt),
    archivedAt: serializeDate(task.archivedAt),
    dueDate: serializeDate(task.dueDate),
  };
}

/**
 * Deserializes a task from JSON import
 */
function deserializeTask(serializedTask: SerializedTask): Task {
  return {
    ...serializedTask,
    createdAt: deserializeDate(serializedTask.createdAt)!,
    updatedAt: deserializeDate(serializedTask.updatedAt)!,
    completedAt: deserializeDate(serializedTask.completedAt),
    archivedAt: deserializeDate(serializedTask.archivedAt),
    dueDate: deserializeDate(serializedTask.dueDate),
  };
}

/**
 * Serializes a board for JSON export
 */
function serializeBoard(board: Board): SerializedBoard {
  return {
    ...board,
    createdAt: serializeDate(board.createdAt)!,
    updatedAt: serializeDate(board.updatedAt)!,
    archivedAt: serializeDate(board.archivedAt),
  };
}

/**
 * Deserializes a board from JSON import
 */
function deserializeBoard(serializedBoard: SerializedBoard): Board {
  return {
    ...serializedBoard,
    createdAt: deserializeDate(serializedBoard.createdAt)!,
    updatedAt: deserializeDate(serializedBoard.updatedAt)!,
    archivedAt: deserializeDate(serializedBoard.archivedAt),
  };
}

/**
 * Exports application data to JSON format
 */
export function exportData(
  tasks: Task[],
  boards: Board[],
  settings?: Settings,
  options: ExportOptions = {
    includeTasks: true,
    includeBoards: true,
    includeSettings: true,
    includeArchivedTasks: true,
    includeArchivedBoards: true,
  }
): ExportData {
  let filteredTasks = tasks;
  let filteredBoards = boards;

  // Filter tasks based on options
  if (options.includeTasks) {
    if (!options.includeArchivedTasks) {
      filteredTasks = filteredTasks.filter(task => !task.archivedAt);
    }
    if (options.boardIds && options.boardIds.length > 0) {
      filteredTasks = filteredTasks.filter(task => options.boardIds!.includes(task.boardId));
    }
  } else {
    filteredTasks = [];
  }

  // Filter boards based on options
  if (options.includeBoards) {
    if (!options.includeArchivedBoards) {
      filteredBoards = filteredBoards.filter(board => !board.archivedAt);
    }
    if (options.boardIds && options.boardIds.length > 0) {
      filteredBoards = filteredBoards.filter(board => options.boardIds!.includes(board.id));
    }
  } else {
    filteredBoards = [];
  }

  const serializedTasks = filteredTasks.map(serializeTask);
  const serializedBoards = filteredBoards.map(serializeBoard);

  const exportData: ExportData = {
    version: DATA_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: serializedTasks,
    boards: serializedBoards,
  };

  if (options.includeSettings && settings) {
    exportData.settings = settings;
  }

  return exportData;
}

/**
 * Exports only tasks to JSON format
 */
export function exportTasks(
  tasks: Task[],
  options: { includeArchived: boolean; boardIds?: string[] } = { includeArchived: true }
): ExportData {
  return exportData(tasks, [], undefined, {
    includeTasks: true,
    includeBoards: false,
    includeSettings: false,
    includeArchivedTasks: options.includeArchived,
    includeArchivedBoards: false,
    boardIds: options.boardIds,
  });
}

/**
 * Exports only boards to JSON format
 */
export function exportBoards(
  boards: Board[],
  options: { includeArchived: boolean } = { includeArchived: true }
): ExportData {
  return exportData([], boards, undefined, {
    includeTasks: false,
    includeBoards: true,
    includeSettings: false,
    includeArchivedTasks: false,
    includeArchivedBoards: options.includeArchived,
  });
}

/**
 * Exports only settings to JSON format
 */
export function exportSettings(settings: Settings): ExportData {
  return exportData([], [], settings, {
    includeTasks: false,
    includeBoards: false,
    includeSettings: true,
    includeArchivedTasks: false,
    includeArchivedBoards: false,
  });
}

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
 */
export function detectImportConflicts(
  importData: ExportData,
  existingTasks: Task[],
  existingBoards: Board[]
): ImportConflicts {
  const duplicateTaskIds = importData.tasks
    .filter(task => existingTasks.some(existing => existing.id === task.id))
    .map(task => task.id);

  const duplicateBoardIds = importData.boards
    .filter(board => existingBoards.some(existing => existing.id === board.id))
    .map(board => board.id);

  const boardNameConflicts = importData.boards
    .filter(board => existingBoards.some(existing => 
      existing.name.toLowerCase() === board.name.toLowerCase() && existing.id !== board.id
    ))
    .map(board => board.name);

  const existingBoardIds = new Set([
    ...existingBoards.map(b => b.id),
    ...importData.boards.map(b => b.id)
  ]);

  const orphanedTasks = importData.tasks
    .filter(task => !existingBoardIds.has(task.boardId))
    .map(task => task.id);

  return {
    duplicateTaskIds,
    duplicateBoardIds,
    orphanedTasks,
    boardNameConflicts,
  };
}

/**
 * Processes import data with advanced conflict resolution and sanitization
 */
export function processImportData(
  importData: ExportData,
  conflicts: ImportConflicts,
  options: ImportOptions
): { tasks: Task[]; boards: Board[]; settings?: Settings } {
  let processedTasks = importData.tasks.map(deserializeTask);
  let processedBoards = importData.boards.map(deserializeBoard);

  // Handle ID conflicts
  if (options.generateNewIds) {
    // Generate new IDs for conflicting items
    const taskIdMap = new Map<string, string>();
    const boardIdMap = new Map<string, string>();

    // Generate new board IDs
    processedBoards = processedBoards.map(board => {
      if (conflicts.duplicateBoardIds.includes(board.id)) {
        const newId = crypto.randomUUID();
        boardIdMap.set(board.id, newId);
        return { ...board, id: newId };
      }
      return board;
    });

    // Generate new task IDs and update board references
    processedTasks = processedTasks.map(task => {
      let updatedTask = task;

      // Update board reference if board ID was changed
      if (boardIdMap.has(task.boardId)) {
        updatedTask = { ...updatedTask, boardId: boardIdMap.get(task.boardId)! };
      }

      // Generate new task ID if conflicting
      if (conflicts.duplicateTaskIds.includes(task.id)) {
        const newId = crypto.randomUUID();
        taskIdMap.set(task.id, newId);
        updatedTask = { ...updatedTask, id: newId };
      }

      return updatedTask;
    });
  } else if (options.skipConflicts) {
    // Remove conflicting items
    processedTasks = processedTasks.filter(task => 
      !conflicts.duplicateTaskIds.includes(task.id)
    );
    processedBoards = processedBoards.filter(board => 
      !conflicts.duplicateBoardIds.includes(board.id)
    );
  }

  // Handle orphaned tasks
  if (conflicts.orphanedTasks.length > 0) {
    if (options.skipConflicts) {
      processedTasks = processedTasks.filter(task => 
        !conflicts.orphanedTasks.includes(task.id)
      );
    }
    // Note: If not skipping conflicts, orphaned tasks will cause import to fail
    // This should be handled at the UI level
  }

  return {
    tasks: processedTasks,
    boards: processedBoards,
    settings: importData.settings,
  };
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
  
  // Step 2: Sanitize the data if there are warnings or recoverable errors
  const sanitizedData = { ...importData };
  const sanitizationLog: string[] = [];
  
  if (validationResult.warnings.length > 0 || 
      validationResult.errors.some(e => e.severity === 'error')) {
    
    // Sanitize tasks
    const taskSanitization = sanitizeData(sanitizedData.tasks, exportDataSchema.properties!.tasks as ValidationSchema, sanitizationOptions);
    sanitizedData.tasks = taskSanitization.sanitized as SerializedTask[];
    sanitizationLog.push(...taskSanitization.changes.map(c => `Tasks: ${c}`));
    
    // Sanitize boards
    const boardSanitization = sanitizeData(importData.boards, exportDataSchema.properties!.boards as ValidationSchema, sanitizationOptions);
    sanitizedData.boards = boardSanitization.sanitized as SerializedBoard[];
    sanitizationLog.push(...boardSanitization.changes.map(c => `Boards: ${c}`));
    
    // Sanitize settings if present
    if (importData.settings) {
      const settingsSanitization = sanitizeData(importData.settings, exportDataSchema.properties!.settings as ValidationSchema, sanitizationOptions);
      sanitizedData.settings = settingsSanitization.sanitized as Settings;
      sanitizationLog.push(...settingsSanitization.changes.map(c => `Settings: ${c}`));
    }
  }

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

/**
 * Validates and sanitizes export data before saving
 */
export function validateAndSanitizeExport(
  tasks: Task[],
  boards: Board[],
  settings?: Settings,
  options: ExportOptions = {
    includeTasks: true,
    includeBoards: true,
    includeSettings: true,
    includeArchivedTasks: true,
    includeArchivedBoards: true,
  }
): {
  exportData: ExportData;
  validationResult: DetailedValidationResult;
  sanitizationLog: string[];
} {
  // Create export data
  const exportedData = exportData(tasks, boards, settings, options);
  
  // Validate the export
  const validationResult = validateExportData(exportedData);
  
  // Sanitize if needed
  let sanitizedExportData = exportedData;
  const sanitizationLog: string[] = [];
  
  if (validationResult.warnings.length > 0) {
    const sanitizationResult = sanitizeData(exportedData, exportDataSchema, {
      removeInvalidFields: true,
      fixDateFormats: true,
      normalizeStrings: true,
      validateRelationships: true,
      generateMissingIds: false, // Don't generate new IDs for export
      setDefaultValues: false,   // Don't set defaults for export
    });
    
    sanitizedExportData = sanitizationResult.sanitized as ExportData;
    sanitizationLog.push(...sanitizationResult.changes);
  }

  return {
    exportData: sanitizedExportData,
    validationResult,
    sanitizationLog,
  };
}

/**
 * Downloads data as JSON file
 */
export function downloadAsJson(data: ExportData, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generates a filename for export
 */
export function generateExportFilename(options: ExportOptions): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const parts = [];
  
  if (options.includeTasks && options.includeBoards && options.includeSettings) {
    parts.push('cascade-full-export');
  } else {
    if (options.includeTasks) parts.push('tasks');
    if (options.includeBoards) parts.push('boards');
    if (options.includeSettings) parts.push('settings');
  }
  
  return `${parts.join('-')}-${timestamp}.json`;
}
