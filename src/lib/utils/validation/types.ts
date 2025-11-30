/**
 * Validation types and interfaces
 */

// JSON Schema definitions for validation
export interface ValidationSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: ValidationSchema;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
}

// Validation result interface
export interface DetailedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedData?: unknown;
}

export interface ValidationError {
  path: string;
  message: string;
  value?: unknown;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  path: string;
  message: string;
  value?: unknown;
  suggestion?: string;
}

// Data sanitization options
export interface SanitizationOptions {
  removeInvalidFields: boolean;
  fixDateFormats: boolean;
  normalizeStrings: boolean;
  validateRelationships: boolean;
  generateMissingIds: boolean;
  setDefaultValues: boolean;
}
