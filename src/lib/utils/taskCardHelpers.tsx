import { Task } from '@/lib/types';
import { format } from 'date-fns';
import { Calendar, AlertTriangle } from '@/lib/icons';

/**
 * Priority badge token mapping. Each priority gets a muted editorial fill
 * (status-50 bg + status-700 fg) plus a 6px status-500 dot.
 */
export const PRIORITY_BADGE_TOKENS = {
  low:    { bg: 'var(--ok-50)',     fg: 'var(--ok-700)',     dot: 'var(--ok-500)' },
  medium: { bg: 'var(--warn-50)',   fg: 'var(--warn-700)',   dot: 'var(--warn-500)' },
  high:   { bg: 'var(--danger-50)', fg: 'var(--danger-700)', dot: 'var(--danger-500)' },
} as const;

/**
 * Analyzes task due date status.
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
 * Editorial date format — short month + day, in mono.
 * Example: "Apr 21" (or "Apr 21 · 2027" if not the current year).
 */
export function formatDueDate(dueDate: Date): string {
  const now = new Date();
  const sameYear = dueDate.getFullYear() === now.getFullYear();
  return sameYear
    ? format(dueDate, 'MMM d')
    : `${format(dueDate, 'MMM d')} · ${dueDate.getFullYear()}`;
}

/**
 * Footer icon — Calendar normally, AlertTriangle for overdue.
 */
export function getDueDateIcon(isOverdue: boolean) {
  return isOverdue
    ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
    : <Calendar className="h-3.5 w-3.5" aria-hidden="true" />;
}
