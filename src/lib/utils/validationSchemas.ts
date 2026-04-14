/**
 * Validation schemas and type definitions for import/export data structures.
 * Consumed by validation.ts for runtime validation and sanitization.
 */

// ============================================================================
// Types
// ============================================================================

export interface ValidationSchema {
  type: string | string[];
  properties?: Record<string, ValidationSchema>;
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

export interface SanitizationOptions {
  removeInvalidFields: boolean;
  fixDateFormats: boolean;
  normalizeStrings: boolean;
  validateRelationships: boolean;
  generateMissingIds: boolean;
  setDefaultValues: boolean;
}

// ============================================================================
// Schemas
// ============================================================================

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
    tags: { type: 'array', items: { type: 'string', maxLength: 50 }, maxItems: 20 },
    progress: { type: ['number', 'undefined'], minimum: 0, maximum: 100 }
  },
  required: ['id', 'title', 'status', 'boardId', 'createdAt', 'updatedAt', 'priority', 'tags'],
  additionalProperties: false
};

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

export const settingsSchema: ValidationSchema = {
  type: 'object',
  properties: {
    id: { type: ['string', 'undefined'] },
    theme: { type: 'string', enum: ['light', 'dark', 'system'] },
    autoArchiveDays: { type: 'number', minimum: 1, maximum: 365 },
    enableNotifications: { type: 'boolean' },
    enableKeyboardShortcuts: { type: 'boolean' },
    enableDebugMode: { type: 'boolean' },
    enableDeveloperMode: { type: 'boolean' },
    currentBoardId: { type: ['string', 'undefined'] },
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
  required: ['theme', 'autoArchiveDays', 'enableNotifications', 'enableKeyboardShortcuts', 'enableDebugMode', 'enableDeveloperMode', 'searchPreferences', 'accessibility'],
  additionalProperties: false
};

export const exportDataSchema: ValidationSchema = {
  type: 'object',
  properties: {
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    exportedAt: { type: 'string', format: 'date-time' },
    tasks: { type: 'array', items: taskSchema },
    boards: { type: 'array', items: boardSchema },
    settings: settingsSchema
  },
  required: ['version', 'exportedAt', 'tasks', 'boards'],
  additionalProperties: false
};
