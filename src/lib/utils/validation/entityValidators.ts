/**
 * Entity-specific validation functions
 */
import type { DetailedValidationResult } from './types';
import { validateSchema } from './schemaValidator';
import { taskSchema, boardSchema, settingsSchema, exportDataSchema } from './schemas';

/**
 * Validates task data with detailed error reporting
 */
export function validateTask(task: unknown): DetailedValidationResult {
  return validateSchema(task, taskSchema, 'task');
}

/**
 * Validates board data with detailed error reporting
 */
export function validateBoard(board: unknown): DetailedValidationResult {
  return validateSchema(board, boardSchema, 'board');
}

/**
 * Validates settings data with detailed error reporting
 */
export function validateSettings(settings: unknown): DetailedValidationResult {
  return validateSchema(settings, settingsSchema, 'settings');
}

/**
 * Validates export data with detailed error reporting
 */
export function validateExportData(data: unknown): DetailedValidationResult {
  return validateSchema(data, exportDataSchema, 'exportData');
}
