/**
 * Merge utilities for combining existing and imported data
 */

import { Task, Board, Settings } from '@/lib/types';
import type { MergeStrategy, MergeResult, FieldConflict } from './types';

/**
 * Merges two boards intelligently based on the specified strategy
 */
export function mergeBoards(
  existing: Board,
  imported: Board,
  strategy: MergeStrategy
): MergeResult<Board> {
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged = { ...existing };

  const fields: (keyof Board)[] = ['name', 'description', 'color', 'isDefault'];

  for (const field of fields) {
    if (existing[field] !== imported[field]) {
      conflicts.push({
        field,
        existingValue: existing[field],
        importedValue: imported[field],
        resolution: 'kept_existing',
        reason: `Different ${field} values`
      });

      switch (strategy) {
        case 'use_imported':
          (merged as Record<string, unknown>)[field] = imported[field];
          mergedFields.push(field);
          break;
        case 'keep_newer':
          if (imported.updatedAt > existing.updatedAt) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
        case 'merge_fields':
          if (field === 'description' && !existing[field] && imported[field]) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
      }
    }
  }

  // Always use the newer updatedAt
  if (imported.updatedAt > existing.updatedAt) {
    merged.updatedAt = imported.updatedAt;
    mergedFields.push('updatedAt');
  }

  return { merged, conflicts, mergedFields };
}

/**
 * Merges two tasks intelligently based on the specified strategy
 */
export function mergeTasks(
  existing: Task,
  imported: Task,
  strategy: MergeStrategy
): MergeResult<Task> {
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged = { ...existing };

  const fields: (keyof Task)[] = [
    'title', 'description', 'status', 'priority', 'tags', 'progress'
  ];

  for (const field of fields) {
    if (JSON.stringify(existing[field]) !== JSON.stringify(imported[field])) {
      conflicts.push({
        field,
        existingValue: existing[field],
        importedValue: imported[field],
        resolution: 'kept_existing',
        reason: `Different ${field} values`
      });

      switch (strategy) {
        case 'use_imported':
          (merged as Record<string, unknown>)[field] = imported[field];
          mergedFields.push(field);
          break;
        case 'keep_newer':
          if (imported.updatedAt > existing.updatedAt) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
        case 'merge_fields':
          if (field === 'tags') {
            // Merge tags arrays
            const existingTags = existing.tags || [];
            const importedTags = imported.tags || [];
            merged.tags = [...new Set([...existingTags, ...importedTags])];
            mergedFields.push(field);
          } else if (field === 'description' && !existing[field] && imported[field]) {
            (merged as Record<string, unknown>)[field] = imported[field];
            mergedFields.push(field);
          }
          break;
      }
    }
  }

  // Always use the newer updatedAt
  if (imported.updatedAt > existing.updatedAt) {
    merged.updatedAt = imported.updatedAt;
    mergedFields.push('updatedAt');
  }

  return { merged, conflicts, mergedFields };
}

/**
 * Merges settings intelligently based on the specified strategy
 */
export function mergeSettings(
  existing: Settings,
  imported: Settings,
  strategy: MergeStrategy
): MergeResult<Settings> {
  const conflicts: FieldConflict[] = [];
  const mergedFields: string[] = [];
  const merged = { ...existing };

  const fields: (keyof Settings)[] = [
    'theme', 'autoArchiveDays', 'enableNotifications',
    'enableKeyboardShortcuts', 'enableDebugMode'
  ];

  for (const field of fields) {
    if (existing[field] !== imported[field]) {
      conflicts.push({
        field,
        existingValue: existing[field],
        importedValue: imported[field],
        resolution: 'kept_existing',
        reason: `Different ${field} values`
      });

      if (strategy === 'use_imported' || strategy === 'merge_fields') {
        (merged as Record<string, unknown>)[field] = imported[field];
        mergedFields.push(field);
      }
    }
  }

  // Merge accessibility settings
  if (JSON.stringify(existing.accessibility) !== JSON.stringify(imported.accessibility)) {
    if (strategy === 'use_imported') {
      merged.accessibility = imported.accessibility;
      mergedFields.push('accessibility');
    } else if (strategy === 'merge_fields') {
      merged.accessibility = {
        ...existing.accessibility,
        ...imported.accessibility
      };
      mergedFields.push('accessibility');
    }
  }

  return { merged, conflicts, mergedFields };
}

/**
 * Generates a unique board name by appending "(Copy)" or "(Copy N)"
 */
export function generateUniqueBoardName(baseName: string, existingBoards: Board[]): string {
  const existingNames = new Set(
    existingBoards.map(board => board.name.toLowerCase())
  );

  let counter = 1;
  let newName = `${baseName} (Copy)`;

  while (existingNames.has(newName.toLowerCase())) {
    counter++;
    newName = `${baseName} (Copy ${counter})`;
  }

  return newName;
}
