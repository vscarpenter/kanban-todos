import { Task } from '@/lib/types';

// Valid enum values for task fields
const VALID_STATUSES = ['todo', 'in-progress', 'done'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;

/**
 * Validates that a task has all required string fields populated
 */
function hasRequiredFields(task: Task): boolean {
  if (!task.id || !task.title || !task.boardId) {
    console.warn('Task missing required fields:', {
      id: task.id,
      title: task.title,
      boardId: task.boardId
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
  // Check string fields
  if (
    typeof task.id !== 'string' ||
    typeof task.title !== 'string' ||
    typeof task.boardId !== 'string'
  ) {
    console.warn('Task has invalid field types:', task);
    return false;
  }

  // Check date fields - must be Date objects, not strings
  if (!(task.createdAt instanceof Date) || !(task.updatedAt instanceof Date)) {
    console.warn('Task has invalid date fields:', task);
    return false;
  }

  // Check tags is array
  if (!Array.isArray(task.tags)) {
    console.warn('Task tags is not an array:', task);
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
  if (!VALID_STATUSES.includes(task.status)) {
    console.warn('Task has invalid status:', {
      taskId: task.id,
      status: task.status,
      validStatuses: VALID_STATUSES
    });
    return false;
  }

  // Validate priority (optional field)
  if (task.priority && !VALID_PRIORITIES.includes(task.priority)) {
    console.warn('Task has invalid priority:', {
      taskId: task.id,
      priority: task.priority,
      validPriorities: VALID_PRIORITIES
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
    console.error('Error validating task integrity:', error);
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
    console.warn(
      `Filtered out ${initialCount - validTasks.length} invalid tasks from collection`
    );
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
