import { Task } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Flag, AlertTriangle, Clock } from '@/lib/icons';

/**
 * Returns the appropriate color classes for task priority badge
 */
export function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

/**
 * Returns the appropriate icon for task priority
 */
export function getPriorityIcon(priority: Task['priority']) {
  switch (priority) {
    case 'high':
      return <Flag className="h-3 w-3 fill-red-600 text-red-600" />;
    case 'medium':
      return <Flag className="h-3 w-3 fill-yellow-600 text-yellow-600" />;
    case 'low':
      return <Flag className="h-3 w-3 fill-green-600 text-green-600" />;
    default:
      return <Flag className="h-3 w-3" />;
  }
}

/**
 * Analyzes task due date status
 */
export function getDueDateStatus(task: Task) {
  if (!task.dueDate) return null;

  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < now && task.status !== 'done';
  const isDueSoon = dueDate > now && (dueDate.getTime() - now.getTime()) <= (24 * 60 * 60 * 1000);

  return { isOverdue, isDueSoon, dueDate };
}

/**
 * Formats due date for display
 */
export function formatDueDate(dueDate: Date): string {
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();

  // If due within 24 hours, show relative time
  if (Math.abs(timeDiff) <= (24 * 60 * 60 * 1000)) {
    return formatDistanceToNow(dueDate, { addSuffix: true });
  }

  // Otherwise show date
  return dueDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Returns the appropriate icon for due date status
 */
export function getDueDateIcon(isOverdue: boolean) {
  return isOverdue ?
    <AlertTriangle className="h-3 w-3" aria-hidden="true" /> :
    <Clock className="h-3 w-3" aria-hidden="true" />;
}

/**
 * Gets CSS classes for due date display
 */
export function getDueDateClasses(isOverdue: boolean, isDueSoon: boolean): string {
  if (isOverdue) {
    return 'text-red-600 dark:text-red-400';
  }
  if (isDueSoon) {
    return 'text-orange-600 dark:text-orange-400';
  }
  return 'text-muted-foreground';
}
