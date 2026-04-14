/**
 * Date utility functions for TaskDialog quick-pick due date controls.
 */

export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

export function formatTags(tags: string[]): string {
  return tags.join(", ");
}

export function getToday(): Date {
  const today = new Date();
  today.setHours(17, 0, 0, 0); // Default to 5 PM
  return today;
}

export function getTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0); // Default to 5 PM
  return tomorrow;
}

export function getNextWeek(): Date {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(17, 0, 0, 0); // Default to 5 PM
  return nextWeek;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

export function isNextWeek(date: Date): boolean {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.abs(date.getTime() - nextWeek.getTime()) < MS_PER_DAY;
}

export function formatDueDateQuick(date: Date): string {
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';

  const now = new Date();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / MS_PER_DAY);

  if (diffDays <= 7) return `in ${diffDays} days`;
  return date.toLocaleDateString();
}
