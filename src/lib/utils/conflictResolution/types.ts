/**
 * Type definitions for conflict resolution operations
 */

import { Task, Board, Settings } from '@/lib/types';
import { ExportData } from '../exportImport';

// ============================================================================
// Strategy Types
// ============================================================================

/**
 * Conflict resolution strategies for handling duplicate items
 */
export type ConflictResolutionStrategy =
  | 'skip'           // Skip conflicting items
  | 'overwrite'      // Overwrite existing items
  | 'merge'          // Merge data intelligently
  | 'rename'         // Rename conflicting items
  | 'generate_new_ids' // Generate new IDs for conflicts
  | 'ask_user';      // Prompt user for each conflict

/**
 * Merge strategies for different data types
 */
export type MergeStrategy =
  | 'keep_existing'   // Keep existing data
  | 'use_imported'    // Use imported data
  | 'merge_fields'    // Merge individual fields
  | 'keep_newer'      // Keep newer based on updatedAt
  | 'keep_older';     // Keep older based on createdAt

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Options for controlling conflict resolution behavior
 */
export interface ConflictResolutionOptions {
  taskStrategy: ConflictResolutionStrategy;
  boardStrategy: ConflictResolutionStrategy;
  settingsStrategy: ConflictResolutionStrategy;
  mergeStrategy: MergeStrategy;
  preserveRelationships: boolean;
  generateBackup: boolean;
}

// ============================================================================
// Result Interfaces
// ============================================================================

/**
 * Result of conflict resolution operation
 */
export interface ConflictResolutionResult {
  resolvedTasks: Task[];
  resolvedBoards: Board[];
  resolvedSettings?: Settings;
  resolutionLog: ResolutionAction[];
  backupData?: ExportData;
}

/**
 * Individual resolution action taken during conflict resolution
 */
export interface ResolutionAction {
  type: 'skip' | 'overwrite' | 'merge' | 'rename' | 'generate_id';
  itemType: 'task' | 'board' | 'settings';
  itemId: string;
  originalName?: string;
  newName?: string;
  originalId?: string;
  newId?: string;
  mergedFields?: string[];
  reason: string;
}

// ============================================================================
// Merge Interfaces
// ============================================================================

/**
 * Result of merging two items
 */
export interface MergeResult<T> {
  merged: T;
  conflicts: FieldConflict[];
  mergedFields: string[];
}

/**
 * Information about a conflict between two field values
 */
export interface FieldConflict {
  field: string;
  existingValue: unknown;
  importedValue: unknown;
  resolution: 'kept_existing' | 'used_imported' | 'merged';
  reason: string;
}
