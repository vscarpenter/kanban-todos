import { Task, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

/**
 * Validates that a task has all required string fields populated
 */
function hasRequiredFields(task: Task): boolean {
  if (!task.id || !task.title || !task.boardId) {
    // Log only which fields are missing, never their values — title/
    // description/tags may contain sensitive user content (see
    // coding-standards.md Part 4: "Log with context, no secrets").
    logger.warn('Task missing required fields', {
      taskId: task.id || '(missing)',
      missingFields: [
        !task.id && 'id',
        !task.title && 'title',
        !task.boardId && 'boardId',
      ].filter(Boolean),
    });
    return false;
  }
  return true;
}

/**
 * Validates that task field types match expected types
 * Prevents runtime errors from corrupted or malformed data
 */
function hasValidDataTypes(task: Task): boolean {
  // Every branch below logs only task.id, never the task's title/
  // description/tags — those may contain sensitive user content (see
  // coding-standards.md Part 4: "Log with context, no secrets").
  const taskId = typeof task.id === 'string' ? task.id : '(unknown)';

  // Check string fields
  if (
    typeof task.id !== 'string' ||
    typeof task.title !== 'string' ||
    typeof task.boardId !== 'string'
  ) {
    logger.warn('Task has invalid field types', { taskId });
    return false;
  }

  // Check date fields - must be Date objects, not strings
  if (!(task.createdAt instanceof Date) || !(task.updatedAt instanceof Date)) {
    logger.warn('Task has invalid date fields', { taskId });
    return false;
  }

  // Check tags is array
  if (!Array.isArray(task.tags)) {
    logger.warn('Task tags is not an array', { taskId });
    return false;
  }

  return true;
}

/**
 * Validates that enum fields contain valid values
 * Prevents invalid status/priority values from entering the system
 */
function hasValidEnumValues(task: Task): boolean {
  // Validate status
  if (!TASK_STATUSES.includes(task.status)) {
    logger.warn('Task has invalid status', {
      taskId: task.id,
      status: task.status,
      validStatuses: TASK_STATUSES
    });
    return false;
  }

  // Validate priority (optional field)
  if (task.priority && !TASK_PRIORITIES.includes(task.priority)) {
    logger.warn('Task has invalid priority', {
      taskId: task.id,
      priority: task.priority,
      validPriorities: TASK_PRIORITIES
    });
    return false;
  }

  return true;
}

/**
 * Validates complete task integrity
 * Used to filter out corrupted or malformed tasks from the data store
 *
 * Why this matters:
 * - Prevents runtime errors from corrupted IndexedDB data
 * - Catches data integrity issues early in the application lifecycle
 * - Enables graceful degradation when data is partially corrupted
 *
 * @param task - Task to validate
 * @returns true if task passes all validation checks, false otherwise
 */
export function validateTaskIntegrity(task: Task): boolean {
  try {
    return (
      hasRequiredFields(task) &&
      hasValidDataTypes(task) &&
      hasValidEnumValues(task)
    );
  } catch (error: unknown) {
    logger.error('Error validating task integrity', error);
    return false;
  }
}

/**
 * Filters a collection of tasks to only include valid tasks
 *
 * Why use this instead of manual filtering:
 * - Consistent validation across the application
 * - Logs warnings for invalid tasks (helps debugging data corruption)
 * - Single source of truth for what makes a task valid
 *
 * @param tasks - Array of tasks to validate
 * @param validator - Optional custom validator function (defaults to validateTaskIntegrity)
 * @returns Array containing only valid tasks
 */
export function validateTaskCollection(
  tasks: Task[],
  validator: (task: Task) => boolean = validateTaskIntegrity
): Task[] {
  const initialCount = tasks.length;
  const validTasks = tasks.filter(validator);

  if (validTasks.length !== initialCount) {
    logger.warn('Filtered invalid tasks from collection', {
      filteredCount: initialCount - validTasks.length,
    });
  }

  return validTasks;
}

/**
 * Type guard to check if a task has all required fields at runtime
 * Useful for TypeScript narrowing when handling unknown task data
 */
export function isValidTask(task: unknown): task is Task {
  if (!task || typeof task !== 'object') {
    return false;
  }

  return validateTaskIntegrity(task as Task);
}
