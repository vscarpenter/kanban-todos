/**
 * Export/Import utilities - re-export barrel
 * All implementation has been split into src/lib/utils/exportImport/ directory.
 * This file ensures backward compatibility for imports from '@/lib/utils/exportImport'.
 */

// Types and serialization helpers
export {
  DATA_FORMAT_VERSION,
  type ExportData,
  type ExportOptions,
  type SerializedBoard,
  type ImportValidationResult,
  type ImportConflicts,
  serializeDate,
  deserializeDate,
  serializeTask,
  deserializeTask,
  serializeBoard,
  deserializeBoard,
} from './exportImport/serialize';

// Export functions
export {
  exportData,
  exportTasks,
  exportBoards,
  exportSettings,
  validateAndSanitizeExport,
  downloadAsJson,
  generateExportFilename,
} from './exportImport/exportData';

// Import functions
export {
  validateImportData,
  detectImportConflicts,
  processImportData,
  processAdvancedImport,
} from './exportImport/importData';
