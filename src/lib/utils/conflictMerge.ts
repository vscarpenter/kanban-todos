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

interface MergeResult<T> {
  merged: T;
  conflicts: FieldConflict[];
  mergedFields: string[];
}

interface FieldConflict {
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

/**
 * Generic field-by-field merge algorithm shared by every entity type
 * (Board/Task/Settings — see mergeBoards/mergeTasks/mergeSettings below).
 * It's driven entirely by the field *names* in `options.fields`, so it needs
 * to read/write entity properties by a runtime string key.
 *
 * TypeScript has no way to express "index an arbitrary object type T by a
 * runtime string key" while preserving T's static shape, so the dynamic-key
 * work below is done through a `Record<string, unknown>` view of `existing`/
 * `imported`/`merged`. That view requires an `as unknown as` erasure at the
 * boundary — this is the one place in the module that needs it, instead of
 * once per entity, which is why `mergeBoards`/`mergeTasks`/`mergeSettings`
 * below stay cast-free.
 *
 * It's safe: `merged` starts as a full copy of `existing` (already a valid
 * T), and this loop only ever overwrites the field names listed in
 * `options.fields` — names the caller hand-writes to match T's own keys —
 * with values read from `imported` (itself a valid T). No keys are added,
 * renamed, or dropped, so `merged` is still a valid T; the cast back to T
 * at the end just restores that guarantee for the type checker.
 */
function mergeEntities<T extends object>(
  existing: T,
  imported: T,
  strategy: MergeStrategy,
  options: MergeEntityOptions,
): { merged: T; conflicts: FieldConflict[]; mergedFields: string[] } {
  const existingFields = existing as unknown as Record<string, unknown>;
  const importedFields = imported as unknown as Record<string, unknown>;
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged: Record<string, unknown> = { ...existingFields };

  for (const { field, deepCompare, customMerge } of options.fields) {
    const existingVal = existingFields[field];
    const importedVal = importedFields[field];
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
      importedFields.updatedAt && existingFields.updatedAt &&
      (importedFields.updatedAt as Date) > (existingFields.updatedAt as Date)
    ) {
      merged[field] = importedVal;
      mergedFields.push(field);
    } else if (strategy === 'merge_fields' && customMerge) {
      const result = customMerge(existingFields, importedFields);
      if (result !== undefined) {
        merged[field] = result;
        mergedFields.push(field);
      }
    }
  }

  if (options.trackUpdatedAt && importedFields.updatedAt && existingFields.updatedAt) {
    if ((importedFields.updatedAt as Date) > (existingFields.updatedAt as Date)) {
      merged.updatedAt = importedFields.updatedAt;
      mergedFields.push('updatedAt');
    }
  }

  if (strategy === 'merge_fields' && options.extraMergeFields) {
    options.extraMergeFields(merged, existingFields, importedFields, mergedFields);
  }

  return { merged: merged as unknown as T, conflicts, mergedFields };
}

/** Fill empty field from imported value */
const fillEmpty = (field: string) =>
  (existing: Record<string, unknown>, imported: Record<string, unknown>) =>
    !existing[field] && imported[field] ? imported[field] : undefined;

// ============================================================================
// Entity Merge Functions
// ============================================================================

export function mergeBoards(existing: Board, imported: Board, strategy: MergeStrategy): MergeResult<Board> {
  return mergeEntities(existing, imported, strategy, {
    trackUpdatedAt: true,
    fields: [
      { field: 'name' },
      { field: 'description', customMerge: fillEmpty('description') },
      { field: 'color' },
      { field: 'isDefault' },
    ],
  });
}

export function mergeTasks(existing: Task, imported: Task, strategy: MergeStrategy): MergeResult<Task> {
  return mergeEntities(existing, imported, strategy, {
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
}

export function mergeSettings(existing: Settings, imported: Settings, strategy: MergeStrategy): MergeResult<Settings> {
  return mergeEntities(existing, imported, strategy, {
    fields: [
      { field: 'theme' },
      { field: 'autoArchiveDays' },
      { field: 'enableNotifications' },
      { field: 'enableKeyboardShortcuts' },
    ],
    extraMergeFields: (merged, existing, imported, mergedFields) => {
      if (JSON.stringify(existing.accessibility) !== JSON.stringify(imported.accessibility)) {
        merged.accessibility = { ...(existing.accessibility as object), ...(imported.accessibility as object) };
        mergedFields.push('accessibility');
      }
    },
  });
}

export function generateUniqueBoardName(baseName: string, existingBoards: Board[]): string {
  const existingNames = new Set(existingBoards.map(b => b.name.toLowerCase()));
  let counter = 1;
  let newName = `${baseName} (Copy)`;
  while (existingNames.has(newName.toLowerCase())) { counter++; newName = `${baseName} (Copy ${counter})`; }
  return newName;
}
