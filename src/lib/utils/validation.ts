/**
 * Validation module - re-exports from modular validation files
 *
 * This file exists for backward compatibility. All validation functionality
 * has been split into focused modules in the ./validation/ directory.
 */

// Re-export everything from the validation module
export {
  // Types
  type ValidationSchema,
  type DetailedValidationResult,
  type ValidationError,
  type ValidationWarning,
  type SanitizationOptions,

  // Schemas
  taskSchema,
  boardSchema,
  settingsSchema,
  exportDataSchema,

  // Schema validation
  validateSchema,

  // Sanitization
  sanitizeData,
  getDefaultValue,

  // Entity validators
  validateTask,
  validateBoard,
  validateSettings,
  validateExportData,

  // Relationship validation
  validateDataRelationships
} from './validation/index';
