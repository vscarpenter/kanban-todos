import type { Task } from '../types';
import { logger } from './logger';

export interface TaskShareOptions {
  includeAppLink?: boolean;
  format?: 'plain' | 'markdown';
}

/**
 * Generate formatted task details for sharing
 */
export function generateTaskShareText(task: Task, options: TaskShareOptions = {}): string {
  const { includeAppLink = true, format = 'markdown' } = options;
  
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPriority = (priority: string) => {
    const priorityMap = {
      low: 'Low',
      medium: 'Medium', 
      high: 'High',
      urgent: 'Urgent'
    };
    return priorityMap[priority as keyof typeof priorityMap] || priority;
  };

  const formatStatus = (status: string) => {
    const statusMap = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      done: 'Done'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (format === 'markdown') {
    let content = `# Task: ${task.title}\n\n`;
    
    if (task.description) {
      content += `## Description\n${task.description}\n\n`;
    }
    
    content += `## Details\n`;
    content += `- **Status:** ${formatStatus(task.status)}\n`;
    content += `- **Priority:** ${formatPriority(task.priority)}\n`;
    content += `- **Created:** ${formatDate(task.createdAt)}\n`;
    
    if (task.completedAt) {
      content += `- **Completed:** ${formatDate(task.completedAt)}\n`;
    }
    
    if (task.tags && task.tags.length > 0) {
      content += `- **Tags:** ${task.tags.join(', ')}\n`;
    }
    
    if (includeAppLink) {
      content += `\n---\n*Sent from ${window.location.origin}*`;
    }
    
    return content;
  } else {
    // Plain text format
    let content = `Task: ${task.title}\n\n`;
    
    if (task.description) {
      content += `Description:\n${task.description}\n\n`;
    }
    
    content += `Details:\n`;
    content += `Status: ${formatStatus(task.status)}\n`;
    content += `Priority: ${formatPriority(task.priority)}\n`;
    content += `Created: ${formatDate(task.createdAt)}\n`;
    
    if (task.completedAt) {
      content += `Completed: ${formatDate(task.completedAt)}\n`;
    }
    
    if (task.tags && task.tags.length > 0) {
      content += `Tags: ${task.tags.join(', ')}\n`;
    }
    
    if (includeAppLink) {
      content += `\nSent from ${window.location.origin}`;
    }
    
    return content;
  }
}

/**
 * Generate mailto link for task sharing
 */
export function generateTaskMailtoLink(task: Task, recipientEmail?: string): string {
  const subject = encodeURIComponent(`Task: ${task.title}`);
  const body = encodeURIComponent(generateTaskShareText(task, { format: 'plain' }));
  
  const recipient = recipientEmail ? encodeURIComponent(recipientEmail) : '';
  
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

/**
 * Copy text to the clipboard via the async Clipboard API.
 *
 * The previous implementation included a `document.execCommand('copy')`
 * fallback for non-secure contexts and old browsers, but `execCommand` is
 * deprecated, requires injecting a hidden DOM node, and is unavailable in
 * every browser our `package.json` browserslist targets — Cascade is also
 * served exclusively over HTTPS, so the fallback path was unreachable in
 * practice. Removing it eliminates dead code and drops a vector that
 * static analysers regularly flag.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard || !window.isSecureContext) {
    logger.error(
      'Clipboard API unavailable. Cascade requires a secure (https://) context.'
    );
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error);
    return false;
  }
}
