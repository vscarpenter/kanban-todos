import { ExportData } from './exportImport';

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

// Task validation schema
export const taskSchema: ValidationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    title: { type: 'string', minLength: 1, maxLength: 500 },
    description: { type: ['string', 'undefined'], maxLength: 2000 },
    status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
    boardId: { type: 'string', minLength: 1 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    completedAt: { type: ['string', 'undefined'], format: 'date-time' },
    archivedAt: { type: ['string', 'undefined'], format: 'date-time' },
    dueDate: { type: ['string', 'undefined'], format: 'date-time' },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    tags: { 
      type: 'array', 
      items: { type: 'string', maxLength: 50 },
      maxItems: 20
    },
    progress: { type: ['number', 'undefined'], minimum: 0, maximum: 100 }
  },
  required: ['id', 'title', 'status', 'boardId', 'createdAt', 'updatedAt', 'priority', 'tags'],
  additionalProperties: false
};

// Board validation schema
export const boardSchema: ValidationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: ['string', 'undefined'], maxLength: 500 },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
    isDefault: { type: 'boolean' },
    order: { type: 'number', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    archivedAt: { type: ['string', 'undefined'], format: 'date-time' }
  },
  required: ['id', 'name', 'color', 'isDefault', 'order', 'createdAt', 'updatedAt'],
  additionalProperties: false
};

// Settings validation schema
export const settingsSchema: ValidationSchema = {
  type: 'object',
  properties: {
    id: { type: ['string', 'undefined'] }, // Allow optional id property
    theme: { type: 'string', enum: ['light', 'dark', 'system'] },
    autoArchiveDays: { type: 'number', minimum: 1, maximum: 365 },
    enableNotifications: { type: 'boolean' },
    enableKeyboardShortcuts: { type: 'boolean' },
    enableDebugMode: { type: 'boolean' },
    currentBoardId: { type: ['string', 'undefined'] }, // Optional current board ID
    searchPreferences: {
      type: 'object',
      properties: {
        defaultScope: { type: 'string', enum: ['current-board', 'all-boards'] },
        rememberScope: { type: 'boolean' }
      },
      required: ['defaultScope', 'rememberScope'],
      additionalProperties: false
    },
    accessibility: {
      type: 'object',
      properties: {
        highContrast: { type: 'boolean' },
        reduceMotion: { type: 'boolean' },
        fontSize: { type: 'string', enum: ['small', 'medium', 'large'] }
      },
      required: ['highContrast', 'reduceMotion', 'fontSize'],
      additionalProperties: false
    }
  },
  required: ['theme', 'autoArchiveDays', 'enableNotifications', 'enableKeyboardShortcuts', 'enableDebugMode', 'searchPreferences', 'accessibility'],
  additionalProperties: false
};

// Export data validation schema
export const exportDataSchema: ValidationSchema = {
  type: 'object',
  properties: {
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    exportedAt: { type: 'string', format: 'date-time' },
    tasks: { 
      type: 'array',
      items: taskSchema
    },
    boards: {
      type: 'array',
      items: boardSchema
    },
    settings: settingsSchema
  },
  required: ['version', 'exportedAt', 'tasks', 'boards'],
  additionalProperties: false
};

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

/**
 * Validates data against a JSON schema
 */
export function validateSchema(data: unknown, schema: ValidationSchema, path = ''): DetailedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Handle undefined/null values for optional fields
  if (data === undefined || data === null) {
    // If the field is optional (not in required array), allow undefined/null
    // Field is optional, allow undefined/null
    
    // For now, allow undefined/null values - they will be handled during sanitization
    return { isValid: true, errors, warnings };
  }

  // Type validation
  if (schema.type) {
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    
    // Get the actual data type, handling arrays specially
    let dataType: string = typeof data;
    if (Array.isArray(data)) {
      dataType = 'array';
    }
    
    const isValidType = allowedTypes.includes(dataType as string) || 
                       (allowedTypes.includes('null') && data === null) ||
                       (allowedTypes.includes('undefined') && data === undefined);
    
    if (!isValidType) {
      errors.push({
        path,
        message: `Expected ${allowedTypes.join(' or ')}, got ${dataType}`,
        value: data,
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
  }

  // Array validation
  if (schema.type === 'array' && Array.isArray(data)) {
    // Validate array items
    if (schema.items) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const itemResult = validateSchema(item, schema.items!, itemPath);
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
      });
    }

    // Check array constraints
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({
        path,
        message: `Array exceeds maximum length: ${schema.maxItems}`,
        value: data.length,
        severity: 'error'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // Object property validation
  if (schema.type === 'object' && data && typeof data === 'object' && !Array.isArray(data)) {
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          errors.push({
            path: `${path}.${requiredProp}`,
            message: `Missing required property: ${requiredProp}`,
            severity: 'error'
          });
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in data) {
          const propPath = path ? `${path}.${propName}` : propName;
          const propResult = validateSchema((data as Record<string, unknown>)[propName], propSchema as ValidationSchema, propPath);
          errors.push(...propResult.errors);
          warnings.push(...propResult.warnings);
        }
      }
    }

    // Check for additional properties
    if (schema.additionalProperties === false) {
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      for (const prop of Object.keys(data)) {
        if (!allowedProps.has(prop)) {
          warnings.push({
            path: `${path}.${prop}`,
            message: `Unexpected property: ${prop}`,
            value: (data as Record<string, unknown>)[prop],
            suggestion: 'This property will be removed during sanitization'
          });
        }
      }
    }
  }

  // Array validation
  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items) {
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const itemResult = validateSchema(item, schema.items!, itemPath);
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);
      });
    }

    if (schema.maxItems && data.length > schema.maxItems) {
      warnings.push({
        path,
        message: `Array exceeds maximum length of ${schema.maxItems}`,
        value: data.length,
        suggestion: `Consider reducing to ${schema.maxItems} items`
      });
    }
  }

  // String validation
  if (schema.type === 'string' && typeof data === 'string') {
    if (schema.minLength && data.length < schema.minLength) {
      errors.push({
        path,
        message: `String too short. Minimum length: ${schema.minLength}`,
        value: data.length,
        severity: 'error'
      });
    }

    if (schema.maxLength && data.length > schema.maxLength) {
      warnings.push({
        path,
        message: `String too long. Maximum length: ${schema.maxLength}`,
        value: data.length,
        suggestion: 'String will be truncated during sanitization'
      });
    }

    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        errors.push({
          path,
          message: `String does not match required pattern: ${schema.pattern}`,
          value: data,
          severity: 'error'
        });
      }
    }

    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        path,
        message: `Invalid value. Must be one of: ${schema.enum.join(', ')}`,
        value: data,
        severity: 'error'
      });
    }

    if (schema.format === 'date-time') {
      const date = new Date(data);
      if (isNaN(date.getTime())) {
        errors.push({
          path,
          message: 'Invalid date-time format',
          value: data,
          severity: 'error'
        });
      }
    }
  }

  // Number validation
  if (schema.type === 'number' && typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        path,
        message: `Number below minimum value: ${schema.minimum}`,
        value: data,
        severity: 'error'
      });
    }

    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        path,
        message: `Number above maximum value: ${schema.maximum}`,
        value: data,
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitizes data based on validation results and options
 */
export function sanitizeData(
  data: unknown, 
  schema: ValidationSchema, 
  options: SanitizationOptions
): { sanitized: unknown; changes: string[] } {
  const changes: string[] = [];
  let sanitized = JSON.parse(JSON.stringify(data)); // Deep clone

  if (schema.type === 'object' && sanitized && typeof sanitized === 'object') {
    // Remove invalid fields
    if (options.removeInvalidFields && schema.additionalProperties === false) {
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      for (const prop of Object.keys(sanitized)) {
        if (!allowedProps.has(prop)) {
          delete sanitized[prop];
          changes.push(`Removed invalid property: ${prop}`);
        }
      }
    }

    // Set default values for missing required fields
    if (options.setDefaultValues && schema.required && schema.properties) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in sanitized)) {
          const propSchema = schema.properties[requiredProp] as ValidationSchema;
          sanitized[requiredProp] = getDefaultValue(propSchema);
          changes.push(`Set default value for missing property: ${requiredProp}`);
        }
      }
    }

    // Sanitize properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in sanitized) {
          const result = sanitizeData(sanitized[propName], propSchema as ValidationSchema, options);
          sanitized[propName] = result.sanitized;
          changes.push(...result.changes.map(change => `${propName}.${change}`));
        }
      }
    }
  }

  // String sanitization
  if (schema.type === 'string' && typeof sanitized === 'string') {
    if (options.normalizeStrings) {
      const normalized = sanitized.trim();
      if (normalized !== sanitized) {
        sanitized = normalized;
        changes.push('Normalized string (trimmed whitespace)');
      }
    }

    if (schema.maxLength && sanitized.length > schema.maxLength) {
      sanitized = sanitized.substring(0, schema.maxLength);
      changes.push(`Truncated string to ${schema.maxLength} characters`);
    }
  }

  // Array sanitization
  if (schema.type === 'array' && Array.isArray(sanitized)) {
    if (schema.maxItems && sanitized.length > schema.maxItems) {
      sanitized = sanitized.slice(0, schema.maxItems);
      changes.push(`Truncated array to ${schema.maxItems} items`);
    }

    if (schema.items) {
      sanitized = sanitized.map((item: unknown, index: number) => {
        const result = sanitizeData(item, schema.items!, options);
        if (result.changes.length > 0) {
          changes.push(...result.changes.map(change => `[${index}].${change}`));
        }
        return result.sanitized;
      });
    }
  }

  return { sanitized, changes };
}

/**
 * Gets default value for a schema type
 */
function getDefaultValue(schema: ValidationSchema): unknown {
  switch (schema.type) {
    case 'string':
      if (schema.enum) return schema.enum[0];
      if (schema.format === 'date-time') return new Date().toISOString();
      return '';
    case 'number':
      return schema.minimum || 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return null;
  }
}

/**
 * Validates task data with detailed error reporting
 */
export function validateTask(task: unknown): DetailedValidationResult {
  return validateSchema(task, taskSchema, 'task');
}

/**
 * Validates board data with detailed error reporting
 */
export function validateBoard(board: unknown): DetailedValidationResult {
  return validateSchema(board, boardSchema, 'board');
}

/**
 * Validates settings data with detailed error reporting
 */
export function validateSettings(settings: unknown): DetailedValidationResult {
  return validateSchema(settings, settingsSchema, 'settings');
}

/**
 * Validates export data with detailed error reporting
 */
export function validateExportData(data: unknown): DetailedValidationResult {
  return validateSchema(data, exportDataSchema, 'exportData');
}

/**
 * Validates data relationships and dependencies
 */
export function validateDataRelationships(data: ExportData): {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Create board ID set for validation
  const boardIds = new Set(data.boards.map(board => board.id));

  // Check if tasks reference valid boards
  data.tasks.forEach((task, index) => {
    if (!boardIds.has(task.boardId)) {
      errors.push({
        path: `tasks[${index}].boardId`,
        message: `Task references non-existent board: ${task.boardId}`,
        value: task.boardId,
        severity: 'error'
      });
    }

    // Validate progress field consistency
    if (task.status === 'done' && task.progress !== undefined && task.progress !== 100) {
      warnings.push({
        path: `tasks[${index}].progress`,
        message: 'Completed task should have 100% progress',
        value: task.progress,
        suggestion: 'Set progress to 100 for completed tasks'
      });
    }

    if (task.status === 'todo' && task.progress !== undefined && task.progress > 0) {
      warnings.push({
        path: `tasks[${index}].progress`,
        message: 'Todo task should not have progress',
        value: task.progress,
        suggestion: 'Remove progress for todo tasks'
      });
    }

    // Validate date consistency
    const createdAt = new Date(task.createdAt);
    const updatedAt = new Date(task.updatedAt);
    
    if (updatedAt < createdAt) {
      errors.push({
        path: `tasks[${index}].updatedAt`,
        message: 'Updated date cannot be before created date',
        value: task.updatedAt,
        severity: 'error'
      });
    }

    if (task.completedAt) {
      const completedAt = new Date(task.completedAt);
      if (completedAt < createdAt) {
        errors.push({
          path: `tasks[${index}].completedAt`,
          message: 'Completed date cannot be before created date',
          value: task.completedAt,
          severity: 'error'
        });
      }
    }
  });

  // Check for duplicate board names
  const boardNames = new Map<string, number>();
  data.boards.forEach((board, index) => {
    const normalizedName = board.name.toLowerCase().trim();
    if (boardNames.has(normalizedName)) {
      warnings.push({
        path: `boards[${index}].name`,
        message: `Duplicate board name: ${board.name}`,
        value: board.name,
        suggestion: 'Consider renaming to avoid confusion'
      });
    } else {
      boardNames.set(normalizedName, index);
    }
  });

  // Check for multiple default boards
  const defaultBoards = data.boards.filter(board => board.isDefault);
  if (defaultBoards.length > 1) {
    warnings.push({
      path: 'boards',
      message: 'Multiple boards marked as default - will be resolved during import',
      value: defaultBoards.length,
      suggestion: 'Default boards will be automatically merged with existing boards'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
