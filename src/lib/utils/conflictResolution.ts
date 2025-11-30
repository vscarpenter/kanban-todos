/**
 * Conflict Resolution - Re-exports from modular structure
 *
 * This file maintains backward compatibility by re-exporting from the
 * new modular structure in conflictResolution/
 *
 * Module structure:
 * - conflictResolution/types.ts - Type definitions
 * - conflictResolution/merging.ts - Merge utilities
 * - conflictResolution/boardConflicts.ts - Board conflict resolution
 * - conflictResolution/taskConflicts.ts - Task conflict resolution
 * - conflictResolution/settingsConflicts.ts - Settings conflict resolution
 * - conflictResolution/index.ts - Main orchestrator
 */

export {
  // Types
  type ConflictResolutionStrategy,
  type MergeStrategy,
  type ConflictResolutionOptions,
  type ConflictResolutionResult,
  type ResolutionAction,
  type MergeResult,
  type FieldConflict,

  // Merge utilities
  mergeBoards,
  mergeTasks,
  mergeSettings,
  generateUniqueBoardName,

  // Conflict resolution functions
  resolveBoardConflicts,
  createBoardIdMapping,
  resolveTaskConflicts,
  resolveSettingsConflicts,

  // Main orchestrator
  resolveImportConflicts,
  generateResolutionSummary,
} from './conflictResolution/index';
