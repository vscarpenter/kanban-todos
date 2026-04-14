/**
 * Validation module - runtime validation and sanitization logic.
 * Schema definitions and types live in validationSchemas.ts.
 */

import type { ExportData } from './exportImport';
export type {
  ValidationSchema,
  DetailedValidationResult,
  ValidationError,
  ValidationWarning,
  SanitizationOptions,
} from './validationSchemas';
export {
  taskSchema,
  boardSchema,
  settingsSchema,
  exportDataSchema,
} from './validationSchemas';
import type {
  ValidationSchema,
  ValidationError,
  ValidationWarning,
  SanitizationOptions,
  DetailedValidationResult,
} from './validationSchemas';
import {
  taskSchema,
  boardSchema,
  settingsSchema,
  exportDataSchema,
} from './validationSchemas';

// ============================================================================
// Schema Validation Helpers
// ============================================================================

function schemaIncludesType(schema: ValidationSchema, type: string): boolean {
  return schema.type === type || (Array.isArray(schema.type) && schema.type.includes(type));
}

function validateArraySchema(
  data: unknown[],
  schema: ValidationSchema,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (schema.items) {
    const itemSchema = schema.items;
    data.forEach((item, index) => {
      const result = validateSchema(item, itemSchema, `${path}[${index}]`);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });
  }
  if (schema.maxItems !== undefined && data.length > schema.maxItems) {
    errors.push({ path, message: `Array exceeds maximum length: ${schema.maxItems}`, value: data.length, severity: 'error' });
  }
}

function validateObjectSchema(
  data: Record<string, unknown>,
  schema: ValidationSchema,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (schema.required) {
    for (const prop of schema.required) {
      if (!(prop in data)) {
        errors.push({ path: `${path}.${prop}`, message: `Missing required property: ${prop}`, severity: 'error' });
      }
    }
  }

  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName in data) {
        const result = validateSchema(data[propName], propSchema, path ? `${path}.${propName}` : propName);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }
    }
  }

  if (schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(schema.properties || {}));
    for (const prop of Object.keys(data)) {
      if (!allowed.has(prop)) {
        warnings.push({ path: `${path}.${prop}`, message: `Unexpected property: ${prop}`, value: data[prop], suggestion: 'Will be removed during sanitization' });
      }
    }
  }
}

function validateStringSchema(
  data: string,
  schema: ValidationSchema,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (schema.minLength && data.length < schema.minLength) {
    errors.push({ path, message: `String too short. Minimum: ${schema.minLength}`, value: data.length, severity: 'error' });
  }
  if (schema.maxLength && data.length > schema.maxLength) {
    warnings.push({ path, message: `String too long. Maximum: ${schema.maxLength}`, value: data.length, suggestion: 'Will be truncated' });
  }
  if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
    errors.push({ path, message: `String does not match pattern: ${schema.pattern}`, value: data, severity: 'error' });
  }
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({ path, message: `Invalid value. Must be: ${schema.enum.join(', ')}`, value: data, severity: 'error' });
  }
  if (schema.format === 'date-time' && isNaN(new Date(data).getTime())) {
    errors.push({ path, message: 'Invalid date-time format', value: data, severity: 'error' });
  }
}

function validateNumberSchema(
  data: number,
  schema: ValidationSchema,
  path: string,
  errors: ValidationError[]
): void {
  if (schema.minimum !== undefined && data < schema.minimum) {
    errors.push({ path, message: `Number below minimum: ${schema.minimum}`, value: data, severity: 'error' });
  }
  if (schema.maximum !== undefined && data > schema.maximum) {
    errors.push({ path, message: `Number above maximum: ${schema.maximum}`, value: data, severity: 'error' });
  }
}

// ============================================================================
// Schema Validation (Main Function)
// ============================================================================

export function validateSchema(
  data: unknown,
  schema: ValidationSchema,
  path = ''
): DetailedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (data === undefined || data === null) {
    return { isValid: true, errors, warnings };
  }

  // Type validation
  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    let dataType: string = typeof data;
    if (Array.isArray(data)) dataType = 'array';

    const isValidType = allowedTypes.includes(dataType) ||
      (allowedTypes.includes('null') && data === null) ||
      (allowedTypes.includes('undefined') && data === undefined);

    if (!isValidType) {
      errors.push({ path, message: `Expected ${allowedTypes.join(' or ')}, got ${dataType}`, value: data, severity: 'error' });
      return { isValid: false, errors, warnings };
    }
  }

  // Delegate to type-specific validators
  if (schemaIncludesType(schema, 'array') && Array.isArray(data)) {
    validateArraySchema(data, schema, path, errors, warnings);
  }

  if (schemaIncludesType(schema, 'object') && data && typeof data === 'object' && !Array.isArray(data)) {
    validateObjectSchema(data as Record<string, unknown>, schema, path, errors, warnings);
  }

  if (schemaIncludesType(schema, 'string') && typeof data === 'string') {
    validateStringSchema(data, schema, path, errors, warnings);
  }

  if (schemaIncludesType(schema, 'number') && typeof data === 'number') {
    validateNumberSchema(data, schema, path, errors);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ============================================================================
// Sanitization
// ============================================================================

export function sanitizeData(
  data: unknown,
  schema: ValidationSchema,
  options: SanitizationOptions
): { sanitized: unknown; changes: string[] } {
  const changes: string[] = [];
  let sanitized = JSON.parse(JSON.stringify(data));

  if ((schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object'))) &&
      sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)) {
    sanitized = sanitizeObject(sanitized as Record<string, unknown>, schema, options, changes);
  }

  if ((schema.type === 'string' || (Array.isArray(schema.type) && schema.type.includes('string'))) && typeof sanitized === 'string') {
    sanitized = sanitizeString(sanitized, schema, options, changes);
  }

  if ((schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'))) && Array.isArray(sanitized)) {
    sanitized = sanitizeArray(sanitized, schema, options, changes);
  }

  return { sanitized, changes };
}

function sanitizeObject(
  obj: Record<string, unknown>,
  schema: ValidationSchema,
  options: SanitizationOptions,
  changes: string[]
): Record<string, unknown> {
  if (options.removeInvalidFields && schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(schema.properties || {}));
    for (const prop of Object.keys(obj)) {
      if (!allowed.has(prop)) {
        delete obj[prop];
        changes.push(`Removed invalid property: ${prop}`);
      }
    }
  }

  if (options.setDefaultValues && schema.required && schema.properties) {
    for (const prop of schema.required) {
      if (!(prop in obj)) {
        obj[prop] = getDefaultValue(schema.properties[prop]);
        changes.push(`Set default value for: ${prop}`);
      }
    }
  }

  if (schema.properties) {
    for (const [name, propSchema] of Object.entries(schema.properties)) {
      if (name in obj) {
        const result = sanitizeData(obj[name], propSchema, options);
        obj[name] = result.sanitized;
        changes.push(...result.changes.map(c => `${name}.${c}`));
      }
    }
  }

  return obj;
}

function sanitizeString(value: string, schema: ValidationSchema, options: SanitizationOptions, changes: string[]): string {
  let sanitized = value;
  if (options.normalizeStrings) {
    const trimmed = sanitized.trim();
    if (trimmed !== sanitized) {
      sanitized = trimmed;
      changes.push('Trimmed whitespace');
    }
  }
  if (schema.maxLength && sanitized.length > schema.maxLength) {
    sanitized = sanitized.substring(0, schema.maxLength);
    changes.push(`Truncated to ${schema.maxLength} chars`);
  }
  return sanitized;
}

function sanitizeArray(arr: unknown[], schema: ValidationSchema, options: SanitizationOptions, changes: string[]): unknown[] {
  let sanitized = arr;
  if (schema.maxItems && sanitized.length > schema.maxItems) {
    sanitized = sanitized.slice(0, schema.maxItems);
    changes.push(`Truncated to ${schema.maxItems} items`);
  }
  if (schema.items) {
    const itemSchema = schema.items;
    sanitized = sanitized.map((item, i) => {
      const result = sanitizeData(item, itemSchema, options);
      changes.push(...result.changes.map(c => `[${i}].${c}`));
      return result.sanitized;
    });
  }
  return sanitized;
}

export function getDefaultValue(schema: ValidationSchema): unknown {
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  switch (type) {
    case 'string': return schema.enum ? schema.enum[0] : schema.format === 'date-time' ? new Date().toISOString() : '';
    case 'number': return schema.minimum || 0;
    case 'boolean': return false;
    case 'array': return [];
    case 'object': return {};
    default: return null;
  }
}

// ============================================================================
// Entity Validators
// ============================================================================

export function validateTask(task: unknown): DetailedValidationResult {
  return validateSchema(task, taskSchema, 'task');
}

export function validateBoard(board: unknown): DetailedValidationResult {
  return validateSchema(board, boardSchema, 'board');
}

export function validateSettings(settings: unknown): DetailedValidationResult {
  return validateSchema(settings, settingsSchema, 'settings');
}

export function validateExportData(data: unknown): DetailedValidationResult {
  return validateSchema(data, exportDataSchema, 'exportData');
}

// ============================================================================
// Relationship Validation
// ============================================================================

export function validateDataRelationships(data: ExportData): DetailedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const boardIds = new Set(data.boards.map(b => b.id));

  // Validate task references
  data.tasks.forEach((task, i) => {
    if (!boardIds.has(task.boardId)) {
      errors.push({ path: `tasks[${i}].boardId`, message: `References non-existent board: ${task.boardId}`, value: task.boardId, severity: 'error' });
    }

    // Progress consistency
    if (task.status === 'done' && task.progress !== undefined && task.progress !== 100) {
      warnings.push({ path: `tasks[${i}].progress`, message: 'Completed task should have 100% progress', value: task.progress, suggestion: 'Set to 100' });
    }
    if (task.status === 'todo' && task.progress !== undefined && task.progress > 0) {
      warnings.push({ path: `tasks[${i}].progress`, message: 'Todo task should not have progress', value: task.progress, suggestion: 'Remove progress' });
    }

    // Date consistency
    const created = new Date(task.createdAt);
    const updated = new Date(task.updatedAt);
    if (updated < created) {
      errors.push({ path: `tasks[${i}].updatedAt`, message: 'Updated date before created date', value: task.updatedAt, severity: 'error' });
    }
    if (task.completedAt && new Date(task.completedAt) < created) {
      errors.push({ path: `tasks[${i}].completedAt`, message: 'Completed date before created date', value: task.completedAt, severity: 'error' });
    }
  });

  // Check duplicate board names
  const names = new Map<string, number>();
  data.boards.forEach((board, i) => {
    const normalized = board.name.toLowerCase().trim();
    if (names.has(normalized)) {
      warnings.push({ path: `boards[${i}].name`, message: `Duplicate board name: ${board.name}`, value: board.name, suggestion: 'Consider renaming' });
    } else {
      names.set(normalized, i);
    }
  });

  // Check multiple defaults
  const defaults = data.boards.filter(b => b.isDefault);
  if (defaults.length > 1) {
    warnings.push({ path: 'boards', message: 'Multiple default boards', value: defaults.length, suggestion: 'Will be resolved on import' });
  }

  return { isValid: errors.length === 0, errors, warnings };
}
