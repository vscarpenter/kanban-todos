import { describe, it, expect, vi } from 'vitest';
import {
  validateSchema,
  sanitizeData,
  getDefaultValue,
  validateExportData,
  validateDataRelationships,
} from '../validation';
import { taskSchema, boardSchema, settingsSchema, exportDataSchema } from '../validationSchemas';
import type { ExportData } from '../exportImport';

describe('validation utilities', () => {
  describe('validateSchema', () => {
    it('accepts valid data matching schema', () => {
      const data = { 
        id: 'board-1',
        name: 'Test Board', 
        color: '#3b82f6',
        isDefault: true,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = validateSchema(data, boardSchema, 'board');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects data with wrong type', () => {
      const data = 123;
      const result = validateSchema(data, boardSchema, 'board');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Expected object');
    });

    it('validates required properties', () => {
      const data = { description: 'Missing name' };
      const result = validateSchema(data, boardSchema, 'board');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Missing required property'))).toBe(true);
    });

    it('validates string length constraints', () => {
      const schema = {
        type: 'string' as const,
        minLength: 3,
        maxLength: 10,
      };
      
      const tooShort = validateSchema('ab', schema, 'field');
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors.some(e => e.message.includes('too short'))).toBe(true);

      const tooLong = validateSchema('abcdefghijk', schema, 'field');
      expect(tooLong.isValid).toBe(true); // Only warning for too long
      expect(tooLong.warnings.some(w => w.message.includes('too long'))).toBe(true);
    });

    it('validates string patterns', () => {
      const schema = {
        type: 'string' as const,
        pattern: /^[a-z]+$/,
      };
      
      const result = validateSchema('ABC123', schema, 'field');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('does not match pattern'))).toBe(true);
    });

    it('validates string enums', () => {
      const schema = {
        type: 'string' as const,
        enum: ['todo', 'in-progress', 'done'],
      };
      
      const invalid = validateSchema('cancelled', schema, 'status');
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.some(e => e.message.includes('Invalid value'))).toBe(true);
    });

    it('validates number constraints', () => {
      const schema = {
        type: 'number' as const,
        minimum: 0,
        maximum: 100,
      };
      
      const tooLow = validateSchema(-5, schema, 'value');
      expect(tooLow.isValid).toBe(false);
      expect(tooLow.errors.some(e => e.message.includes('below minimum'))).toBe(true);

      const tooHigh = validateSchema(150, schema, 'value');
      expect(tooHigh.isValid).toBe(false);
      expect(tooHigh.errors.some(e => e.message.includes('above maximum'))).toBe(true);
    });

    it('validates array length', () => {
      const schema = {
        type: 'array' as const,
        maxItems: 3,
      };
      
      const result = validateSchema([1, 2, 3, 4], schema, 'items');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('exceeds maximum length'))).toBe(true);
    });

    it('validates nested objects', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          nested: {
            type: 'string' as const,
            minLength: 1,
          },
        },
        required: ['nested'],
      };
      
      const result = validateSchema({ nested: '' }, schema, 'obj');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('too short'))).toBe(true);
    });

    it('warns about additional properties when not allowed', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
        },
        additionalProperties: false,
      };
      
      const result = validateSchema({ name: 'test', extra: 'field' }, schema, 'obj');
      expect(result.warnings.some(w => w.message.includes('Unexpected property'))).toBe(true);
    });

    it('validates date-time format', () => {
      const schema = {
        type: 'string' as const,
        format: 'date-time' as const,
      };
      
      const invalid = validateSchema('not-a-date', schema, 'date');
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.some(e => e.message.includes('Invalid date-time'))).toBe(true);
    });

    it('handles null and undefined gracefully', () => {
      const result = validateSchema(null, boardSchema, 'board');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates array items with item schema', () => {
      const schema = {
        type: 'array' as const,
        items: {
          type: 'string' as const,
          minLength: 2,
        },
      };
      
      const result = validateSchema(['a', 'ab', 'abc'], schema, 'items');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('too short'))).toBe(true);
    });
  });

  describe('sanitizeData', () => {
    it('trims strings when normalizeStrings is true', () => {
      const schema = {
        type: 'string' as const,
      };
      
      const result = sanitizeData('  test  ', schema, { normalizeStrings: true });
      expect(result.sanitized).toBe('test');
      expect(result.changes).toContain('Trimmed whitespace');
    });

    it('truncates strings to maxLength', () => {
      const schema = {
        type: 'string' as const,
        maxLength: 5,
      };
      
      const result = sanitizeData('abcdefghij', schema, { normalizeStrings: false });
      expect(result.sanitized).toBe('abcde');
      expect(result.changes).toContain('Truncated to 5 chars');
    });

    it('removes invalid properties when removeInvalidFields is true', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
        },
        additionalProperties: false,
      };
      
      const result = sanitizeData(
        { name: 'test', extra: 'field' },
        schema,
        { removeInvalidFields: true, normalizeStrings: false }
      );
      expect(result.sanitized).toEqual({ name: 'test' });
      expect(result.changes).toContain('Removed invalid property: extra');
    });

    it('sets default values when setDefaultValues is true', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          count: { type: 'number' as const },
        },
        required: ['name', 'count'],
      };
      
      const result = sanitizeData(
        { name: 'test' },
        schema,
        { setDefaultValues: true, normalizeStrings: false }
      );
      expect(result.sanitized).toEqual({ name: 'test', count: 0 });
      expect(result.changes).toContain('Set default value for: count');
    });

    it('truncates arrays to maxItems', () => {
      const schema = {
        type: 'array' as const,
        maxItems: 2,
      };
      
      const result = sanitizeData([1, 2, 3, 4], schema, { normalizeStrings: false });
      expect(result.sanitized).toEqual([1, 2]);
      expect(result.changes).toContain('Truncated to 2 items');
    });

    it('sanitizes nested array items', () => {
      const schema = {
        type: 'array' as const,
        items: {
          type: 'string' as const,
          maxLength: 3,
        },
      };
      
      const result = sanitizeData(['abcd', 'efgh'], schema, { normalizeStrings: false });
      expect(result.sanitized).toEqual(['abc', 'efg']);
    });

    it('handles complex nested structures', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const, maxLength: 5 },
          items: {
            type: 'array' as const,
            items: { type: 'string' as const },
            maxItems: 2,
          },
        },
      };
      
      const result = sanitizeData(
        { name: 'longname', items: ['a', 'b', 'c'] },
        schema,
        { normalizeStrings: false }
      );
      expect(result.sanitized).toEqual({ name: 'longn', items: ['a', 'b'] });
    });
  });

  describe('getDefaultValue', () => {
    it('returns empty string for string type', () => {
      expect(getDefaultValue({ type: 'string' })).toBe('');
    });

    it('returns first enum value for string with enum', () => {
      expect(getDefaultValue({ type: 'string', enum: ['a', 'b', 'c'] })).toBe('a');
    });

    it('returns ISO date for date-time format', () => {
      const result = getDefaultValue({ type: 'string', format: 'date-time' });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('returns minimum for number type', () => {
      expect(getDefaultValue({ type: 'number', minimum: 10 })).toBe(10);
    });

    it('returns 0 for number without minimum', () => {
      expect(getDefaultValue({ type: 'number' })).toBe(0);
    });

    it('returns false for boolean type', () => {
      expect(getDefaultValue({ type: 'boolean' })).toBe(false);
    });

    it('returns empty array for array type', () => {
      expect(getDefaultValue({ type: 'array' })).toEqual([]);
    });

    it('returns empty object for object type', () => {
      expect(getDefaultValue({ type: 'object' })).toEqual({});
    });

    it('returns null for unknown types', () => {
      expect(getDefaultValue({ type: 'unknown' as any })).toBeNull();
    });

    it('handles union types', () => {
      expect(getDefaultValue({ type: ['string', 'number'] as any })).toBe('');
    });
  });

  describe('validateExportData', () => {
    it('validates complete export data structure', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [{
          id: 'board-1',
          name: 'Test Board',
          color: '#3b82f6',
          isDefault: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        tasks: [],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateExportData(data);
      expect(result.isValid).toBe(true);
    });

    it('rejects export data with missing required fields', () => {
      const data = {
        version: '1.0.0',
        // Missing other required fields
      };
      
      const result = validateExportData(data);
      expect(result.isValid).toBe(false);
    });

    it('validates boards array structure', () => {
      const data: Partial<ExportData> = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [{ name: 'Invalid Board' }] as any, // Missing required fields
        tasks: [],
        settings: {},
      };
      
      const result = validateExportData(data);
      expect(result.isValid).toBe(false);
    });

    it('validates tasks array structure', () => {
      const data: Partial<ExportData> = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [],
        tasks: [{ title: 'Invalid Task' }] as any, // Missing required fields
        settings: {},
      };
      
      const result = validateExportData(data);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateDataRelationships', () => {
    it('validates task-board relationships', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [{
          id: 'board-1',
          name: 'Board 1',
          color: '#3b82f6',
          isDefault: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        tasks: [{
          id: 'task-1',
          title: 'Task 1',
          status: 'todo',
          boardId: 'non-existent-board', // Invalid reference
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: 'Medium',
          tags: [],
        }],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateDataRelationships(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('References non-existent board'))).toBe(true);
    });

    it('warns about inconsistent progress for completed tasks', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [{
          id: 'board-1',
          name: 'Board 1',
          color: '#3b82f6',
          isDefault: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        tasks: [{
          id: 'task-1',
          title: 'Task 1',
          status: 'done',
          boardId: 'board-1',
          progress: 50, // Should be 100 for done tasks
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: 'Medium',
          tags: [],
        }],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateDataRelationships(data);
      expect(result.warnings.some(w => w.message.includes('Completed task should have 100% progress'))).toBe(true);
    });

    it('warns about progress on todo tasks', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [{
          id: 'board-1',
          name: 'Board 1',
          color: '#3b82f6',
          isDefault: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        tasks: [{
          id: 'task-1',
          title: 'Task 1',
          status: 'todo',
          boardId: 'board-1',
          progress: 25, // Should not have progress
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: 'Medium',
          tags: [],
        }],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateDataRelationships(data);
      expect(result.warnings.some(w => w.message.includes('Todo task should not have progress'))).toBe(true);
    });

    it('errors when updated date is before created date', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [{
          id: 'board-1',
          name: 'Board 1',
          color: '#3b82f6',
          isDefault: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        tasks: [{
          id: 'task-1',
          title: 'Task 1',
          status: 'todo',
          boardId: 'board-1',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z', // Before created
          priority: 'Medium',
          tags: [],
        }],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateDataRelationships(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Updated date before created date'))).toBe(true);
    });

    it('warns about duplicate board names', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [
          {
            id: 'board-1',
            name: 'Same Name',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'board-2',
            name: 'same name', // Case-insensitive duplicate
            color: '#3b82f6',
            isDefault: false,
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        tasks: [],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateDataRelationships(data);
      expect(result.warnings.some(w => w.message.includes('Duplicate board name'))).toBe(true);
    });

    it('warns about multiple default boards', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [
          {
            id: 'board-1',
            name: 'Board 1',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'board-2',
            name: 'Board 2',
            color: '#3b82f6',
            isDefault: true, // Second default
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        tasks: [],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateDataRelationships(data);
      expect(result.warnings.some(w => w.message.includes('Multiple default boards'))).toBe(true);
    });

    it('passes validation for consistent data', () => {
      const data: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        boards: [{
          id: 'board-1',
          name: 'Board 1',
          color: '#3b82f6',
          isDefault: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        tasks: [{
          id: 'task-1',
          title: 'Task 1',
          status: 'todo',
          boardId: 'board-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          priority: 'Medium',
          tags: [],
        }],
        settings: {
          theme: 'light',
          autoArchiveDays: 30,
          enableNotifications: true,
          enableKeyboardShortcuts: true,
          searchPreferences: {
            defaultScope: 'current-board',
            rememberScope: true,
          },
          accessibility: {
            highContrast: false,
            reduceMotion: false,
            fontSize: 'medium',
          },
        },
      };
      
      const result = validateDataRelationships(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});