/**
 * Export-related functions for application data
 */

import { Task, Board, Settings } from '@/lib/types';
import {
  DATA_FORMAT_VERSION,
  type ExportData,
  type ExportOptions,
  serializeTask,
  serializeBoard,
} from './serialize';
import {
  validateExportData,
  sanitizeData,
  exportDataSchema,
} from '../validation';
import type { DetailedValidationResult } from '../validation';

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
      filteredTasks = filteredTasks.filter(task => options.boardIds?.includes(task.boardId));
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
      filteredBoards = filteredBoards.filter(board => options.boardIds?.includes(board.id));
    }
  } else {
    filteredBoards = [];
  }

  const serializedTasks = filteredTasks.map(serializeTask);
  const serializedBoards = filteredBoards.map(serializeBoard);

  const result: ExportData = {
    version: DATA_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    tasks: serializedTasks,
    boards: serializedBoards,
  };

  if (options.includeSettings && settings) {
    result.settings = settings;
  }

  return result;
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
