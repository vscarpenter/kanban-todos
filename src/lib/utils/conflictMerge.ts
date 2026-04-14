/**
 * Merge utilities for conflict resolution during import operations.
 * Called by conflictResolution.ts when items need to be merged instead of skipped/overwritten.
 */

import { Task, Board, Settings } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export type MergeStrategy =
  | 'keep_existing'
  | 'use_imported'
  | 'merge_fields'
  | 'keep_newer'
  | 'keep_older';

export interface MergeResult<T> {
  merged: T;
  conflicts: FieldConflict[];
  mergedFields: string[];
}

export interface FieldConflict {
  field: string;
  existingValue: unknown;
  importedValue: unknown;
  resolution: 'kept_existing' | 'used_imported' | 'merged';
  reason: string;
}

// ============================================================================
// Internal Helpers
// ============================================================================

interface MergeFieldConfig {
  field: string;
  deepCompare?: boolean;
  /** Custom merge_fields handler. Return undefined to skip the field. */
  customMerge?: (existing: Record<string, unknown>, imported: Record<string, unknown>) => unknown;
}

interface MergeEntityOptions {
  fields: MergeFieldConfig[];
  /** Whether to update updatedAt from imported when newer */
  trackUpdatedAt?: boolean;
  /** Additional merge_fields logic run after field iteration */
  extraMergeFields?: (merged: Record<string, unknown>, existing: Record<string, unknown>, imported: Record<string, unknown>, mergedFields: string[]) => void;
}

function mergeEntities(
  existing: Record<string, unknown>,
  imported: Record<string, unknown>,
  strategy: MergeStrategy,
  options: MergeEntityOptions,
): { merged: Record<string, unknown>; conflicts: FieldConflict[]; mergedFields: string[] } {
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged = { ...existing };

  for (const { field, deepCompare, customMerge } of options.fields) {
    const existingVal = existing[field];
    const importedVal = imported[field];
    const isDifferent = deepCompare
      ? JSON.stringify(existingVal) !== JSON.stringify(importedVal)
      : existingVal !== importedVal;

    if (!isDifferent) continue;

    conflicts.push({
      field,
      existingValue: existingVal,
      importedValue: importedVal,
      resolution: 'kept_existing',
      reason: `Different ${field} values`,
    });

    if (strategy === 'use_imported') {
      merged[field] = importedVal;
      mergedFields.push(field);
    } else if (
      strategy === 'keep_newer' &&
      options.trackUpdatedAt &&
      imported.updatedAt && existing.updatedAt &&
      (imported.updatedAt as Date) > (existing.updatedAt as Date)
    ) {
      merged[field] = importedVal;
      mergedFields.push(field);
    } else if (strategy === 'merge_fields' && customMerge) {
      const result = customMerge(existing, imported);
      if (result !== undefined) {
        merged[field] = result;
        mergedFields.push(field);
      }
    }
  }

  if (options.trackUpdatedAt && imported.updatedAt && existing.updatedAt) {
    if ((imported.updatedAt as Date) > (existing.updatedAt as Date)) {
      merged.updatedAt = imported.updatedAt;
      mergedFields.push('updatedAt');
    }
  }

  if (strategy === 'merge_fields' && options.extraMergeFields) {
    options.extraMergeFields(merged, existing, imported, mergedFields);
  }

  return { merged, conflicts, mergedFields };
}

/** Fill empty field from imported value */
const fillEmpty = (field: string) =>
  (existing: Record<string, unknown>, imported: Record<string, unknown>) =>
    !existing[field] && imported[field] ? imported[field] : undefined;

// ============================================================================
// Entity Merge Functions
// ============================================================================

export function mergeBoards(existing: Board, imported: Board, strategy: MergeStrategy): MergeResult<Board> {
  const result = mergeEntities(existing as unknown as Record<string, unknown>, imported as unknown as Record<string, unknown>, strategy, {
    trackUpdatedAt: true,
    fields: [
      { field: 'name' },
      { field: 'description', customMerge: fillEmpty('description') },
      { field: 'color' },
      { field: 'isDefault' },
    ],
  });
  return { ...result, merged: result.merged as unknown as Board };
}

export function mergeTasks(existing: Task, imported: Task, strategy: MergeStrategy): MergeResult<Task> {
  const result = mergeEntities(existing as unknown as Record<string, unknown>, imported as unknown as Record<string, unknown>, strategy, {
    trackUpdatedAt: true,
    fields: [
      { field: 'title' },
      { field: 'description', deepCompare: true, customMerge: fillEmpty('description') },
      { field: 'status', deepCompare: true },
      { field: 'priority', deepCompare: true },
      {
        field: 'tags',
        deepCompare: true,
        customMerge: (e, i) => [...new Set([...((e.tags as string[]) || []), ...((i.tags as string[]) || [])])],
      },
      { field: 'progress', deepCompare: true },
    ],
  });
  return { ...result, merged: result.merged as unknown as Task };
}

export function mergeSettings(existing: Settings, imported: Settings, strategy: MergeStrategy): MergeResult<Settings> {
  const result = mergeEntities(existing as unknown as Record<string, unknown>, imported as unknown as Record<string, unknown>, strategy, {
    fields: [
      { field: 'theme' },
      { field: 'autoArchiveDays' },
      { field: 'enableNotifications' },
      { field: 'enableKeyboardShortcuts' },
      { field: 'enableDebugMode' },
      { field: 'enableDeveloperMode' },
    ],
    extraMergeFields: (merged, existing, imported, mergedFields) => {
      if (JSON.stringify(existing.accessibility) !== JSON.stringify(imported.accessibility)) {
        merged.accessibility = { ...(existing.accessibility as object), ...(imported.accessibility as object) };
        mergedFields.push('accessibility');
      }
    },
  });
  return { ...result, merged: result.merged as unknown as Settings };
}

export function generateUniqueBoardName(baseName: string, existingBoards: Board[]): string {
  const existingNames = new Set(existingBoards.map(b => b.name.toLowerCase()));
  let counter = 1;
  let newName = `${baseName} (Copy)`;
  while (existingNames.has(newName.toLowerCase())) { counter++; newName = `${baseName} (Copy ${counter})`; }
  return newName;
}
