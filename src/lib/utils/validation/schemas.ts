/**
 * Validation schemas for all entities
 */
import type { ValidationSchema } from './types';

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
