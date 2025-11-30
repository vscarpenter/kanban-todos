/**
 * Validates data relationships and dependencies
 */
import type { ExportData } from '../exportImport';
import type { ValidationError, ValidationWarning } from './types';

interface RelationshipValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validates data relationships and dependencies between entities
 */
export function validateDataRelationships(data: ExportData): RelationshipValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Create board ID set for validation
  const boardIds = new Set(data.boards.map(board => board.id));

  // Validate tasks
  data.tasks.forEach((task, index) => {
    validateTaskRelationships(task, index, boardIds, errors, warnings);
  });

  // Check for duplicate board names
  validateBoardNames(data.boards, warnings);

  // Check for multiple default boards
  validateDefaultBoards(data.boards, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates task relationships and data consistency
 */
function validateTaskRelationships(
  task: ExportData['tasks'][0],
  index: number,
  boardIds: Set<string>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check if task references valid board
  if (!boardIds.has(task.boardId)) {
    errors.push({
      path: `tasks[${index}].boardId`,
      message: `Task references non-existent board: ${task.boardId}`,
      value: task.boardId,
      severity: 'error'
    });
  }

  // Validate progress field consistency
  if (task.status === 'done' && task.progress !== undefined && task.progress !== 100) {
    warnings.push({
      path: `tasks[${index}].progress`,
      message: 'Completed task should have 100% progress',
      value: task.progress,
      suggestion: 'Set progress to 100 for completed tasks'
    });
  }

  if (task.status === 'todo' && task.progress !== undefined && task.progress > 0) {
    warnings.push({
      path: `tasks[${index}].progress`,
      message: 'Todo task should not have progress',
      value: task.progress,
      suggestion: 'Remove progress for todo tasks'
    });
  }

  // Validate date consistency
  validateTaskDates(task, index, errors);
}

/**
 * Validates task date consistency
 */
function validateTaskDates(
  task: ExportData['tasks'][0],
  index: number,
  errors: ValidationError[]
): void {
  const createdAt = new Date(task.createdAt);
  const updatedAt = new Date(task.updatedAt);

  if (updatedAt < createdAt) {
    errors.push({
      path: `tasks[${index}].updatedAt`,
      message: 'Updated date cannot be before created date',
      value: task.updatedAt,
      severity: 'error'
    });
  }

  if (task.completedAt) {
    const completedAt = new Date(task.completedAt);
    if (completedAt < createdAt) {
      errors.push({
        path: `tasks[${index}].completedAt`,
        message: 'Completed date cannot be before created date',
        value: task.completedAt,
        severity: 'error'
      });
    }
  }
}

/**
 * Validates board names for duplicates
 */
function validateBoardNames(
  boards: ExportData['boards'],
  warnings: ValidationWarning[]
): void {
  const boardNames = new Map<string, number>();

  boards.forEach((board, index) => {
    const normalizedName = board.name.toLowerCase().trim();
    if (boardNames.has(normalizedName)) {
      warnings.push({
        path: `boards[${index}].name`,
        message: `Duplicate board name: ${board.name}`,
        value: board.name,
        suggestion: 'Consider renaming to avoid confusion'
      });
    } else {
      boardNames.set(normalizedName, index);
    }
  });
}

/**
 * Validates that only one board is marked as default
 */
function validateDefaultBoards(
  boards: ExportData['boards'],
  warnings: ValidationWarning[]
): void {
  const defaultBoards = boards.filter(board => board.isDefault);

  if (defaultBoards.length > 1) {
    warnings.push({
      path: 'boards',
      message: 'Multiple boards marked as default - will be resolved during import',
      value: defaultBoards.length,
      suggestion: 'Default boards will be automatically merged with existing boards'
    });
  }
}
