import { describe, it, expect } from 'vitest';
import { CASCADE_TOOLS } from '../tools';

const EXPECTED_NAMES = [
  'cascade_list_boards',
  'cascade_get_board',
  'cascade_list_tasks',
  'cascade_get_task',
  'cascade_create_task',
  'cascade_update_task',
  'cascade_move_task',
  'cascade_delete_task',
];

describe('CASCADE_TOOLS registry', () => {
  it('registers the eight tools in a stable order', () => {
    expect(CASCADE_TOOLS.map((tool) => tool.name)).toEqual(EXPECTED_NAMES);
  });

  it('uses names that every MCP client accepts: cascade_ prefix, snake_case, no dots', () => {
    for (const tool of CASCADE_TOOLS) {
      expect(tool.name).toMatch(/^cascade_[a-z0-9_]{1,120}$/);
    }
  });

  it('gives every tool a title, a description, and a schema with described properties', () => {
    for (const tool of CASCADE_TOOLS) {
      expect(tool.title, tool.name).toEqual(expect.any(String));
      expect(tool.description.length, tool.name).toBeGreaterThan(40);
      expect(tool.inputSchema.type, tool.name).toBe('object');
      expect(Array.isArray(tool.inputSchema.required), tool.name).toBe(true);
      const properties = tool.inputSchema.properties as Record<string, { description?: string }>;
      for (const [key, property] of Object.entries(properties)) {
        expect(property.description, `${tool.name}.${key}`).toEqual(expect.any(String));
      }
    }
  });

  it('marks reads as read-only untrusted content and never marks a write read-only', () => {
    for (const tool of CASCADE_TOOLS) {
      const isRead = /_(list|get)_/.test(tool.name);
      if (isRead) {
        expect(tool.annotations, tool.name).toEqual({ readOnlyHint: true, untrustedContentHint: true });
      } else {
        expect(tool.annotations?.readOnlyHint, tool.name).toBeFalsy();
      }
    }
  });
});
