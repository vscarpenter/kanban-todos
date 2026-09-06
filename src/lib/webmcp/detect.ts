import type { ModelContext } from './types';

/**
 * Finds the WebMCP entry point. The spec puts it on document; early Chrome
 * builds put it on navigator. Returns null when the browser has neither, so
 * callers can leave the app exactly as it is today.
 */
export function getModelContext(): ModelContext | null {
  if (typeof document === 'undefined') return null;
  if (document.modelContext) return document.modelContext;
  if (typeof navigator !== 'undefined' && navigator.modelContext) return navigator.modelContext;
  return null;
}
