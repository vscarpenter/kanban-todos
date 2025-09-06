import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeTextInput as sanitizeInput,
  sanitizeSearchQuery,
  sanitizeTaskData,
  sanitizeBoardData,
  validateImportFile,
  validateImportJson,
  sanitizeTaskId,
  searchRateLimiter
} from '../security';

describe('sanitizeInput', () => {
  it('should remove dangerous HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello World';
    const result = sanitizeInput(input, 'TASK_TITLE');
    expect(result).toBe('Hello World');
  });

  it('should preserve allowed tags when HTML is allowed', () => {
    const input = '<b>Bold</b> and <i>italic</i> text';
    const result = sanitizeInput(input, 'TASK_DESCRIPTION', { allowHtml: true });
    expect(result).toBe('<b>Bold</b> and <i>italic</i> text');
  });

  it('should remove dangerous attributes', () => {
    const input = '<div onclick="alert(\'xss\')">Click me</div>';
    const result = sanitizeInput(input, 'TASK_TITLE');
    expect(result).toBe('<div>Click me</div>');
  });

  it('should handle empty string', () => {
    const result = sanitizeInput('', 'TASK_TITLE');
    expect(result).toBe('');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeInput(null as never, 'TASK_TITLE')).toBe('');
    expect(sanitizeInput(undefined as never, 'TASK_TITLE')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeInput(123 as never, 'TASK_TITLE')).toBe('123');
    expect(sanitizeInput({} as never, 'TASK_TITLE')).toBe('[object Object]');
  });
});

describe('sanitizeSearchQuery', () => {
  it('should remove dangerous characters', () => {
    const query = '<script>alert("xss")</script>search term';
    const result = sanitizeSearchQuery(query);
    expect(result).toBe('search term');
  });

  it('should preserve safe search characters', () => {
    const query = 'search term with spaces & special chars!';
    const result = sanitizeSearchQuery(query);
    expect(result).toBe('search term with spaces & special chars!');
  });

  it('should handle empty query', () => {
    const result = sanitizeSearchQuery('');
    expect(result).toBe('');
  });

  it('should trim whitespace', () => {
    const query = '  search term  ';
    const result = sanitizeSearchQuery(query);
    expect(result).toBe('search term');
  });
});

describe('sanitizeTaskData', () => {
  it('should sanitize valid task data', () => {
    const taskData = {
      title: '<script>alert("xss")</script>Task Title',
      description: 'Task <b>description</b> with <script>alert("xss")</script>',
      priority: 'high',
      status: 'todo',
      tags: ['<script>alert("xss")</script>tag1', 'tag2']
    };
    
    const result = sanitizeTaskData(taskData);
    
    expect(result.title).toBe('Task Title');
    expect(result.description).toBe('Task <b>description</b> with ');
    expect(result.priority).toBe('high');
    expect(result.status).toBe('todo');
    expect(result.tags).toEqual(['tag1', 'tag2']);
  });

  it('should handle missing optional fields', () => {
    const taskData = {
      title: 'Task Title',
      priority: 'medium',
      status: 'todo'
    };
    
    const result = sanitizeTaskData(taskData);
    
    expect(result.title).toBe('Task Title');
    expect(result.description).toBeUndefined();
    expect(result.tags).toEqual([]);
  });

  it('should handle invalid data gracefully', () => {
    const invalidData = {
      title: 123,
      priority: 'invalid',
      status: null
    };
    
    const result = sanitizeTaskData(invalidData);
    
    expect(result.title).toBe('123');
    expect(result.priority).toBe('medium'); // Default value
    expect(result.status).toBe('todo'); // Default value
  });

  it('should handle null and undefined input', () => {
    expect(() => sanitizeTaskData(null)).toThrow();
    expect(() => sanitizeTaskData(undefined)).toThrow();
  });
});

describe('sanitizeBoardData', () => {
  it('should sanitize valid board data', () => {
    const boardData = {
      name: '<script>alert("xss")</script>Board Name',
      description: 'Board <b>description</b> with <script>alert("xss")</script>',
      columns: [
        { name: '<script>alert("xss")</script>Column 1', order: 0 },
        { name: 'Column 2', order: 1 }
      ]
    };
    
    const result = sanitizeBoardData(boardData);
    
    expect(result.name).toBe('Board Name');
    expect(result.description).toBe('Board <b>description</b> with ');
    expect(result.columns[0].name).toBe('Column 1');
    expect(result.columns[1].name).toBe('Column 2');
  });

  it('should handle missing optional fields', () => {
    const boardData = {
      name: 'Board Name',
      columns: []
    };
    
    const result = sanitizeBoardData(boardData);
    
    expect(result.name).toBe('Board Name');
    expect(result.description).toBeUndefined();
    expect(result.columns).toEqual([]);
  });

  it('should handle invalid data gracefully', () => {
    const invalidData = {
      name: 123,
      columns: 'invalid'
    };
    
    const result = sanitizeBoardData(invalidData);
    
    expect(result.name).toBe('123');
    expect(result.columns).toEqual([]);
  });
});

describe('validateImportFile', () => {
  it('should validate JSON file', async () => {
    const file = new File(['{"test": "data"}'], 'test.json', { type: 'application/json' });
    const result = await validateImportFile(file);
    expect(result).toBe(true);
  });

  it('should validate CSV file', async () => {
    const file = new File(['title,description\nTask 1,Description 1'], 'test.csv', { type: 'text/csv' });
    const result = await validateImportFile(file);
    expect(result).toBe(true);
  });

  it('should reject invalid file type', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const result = await validateImportFile(file);
    expect(result).toBe(false);
  });

  it('should reject file that is too large', async () => {
    const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
    const file = new File([largeContent], 'large.json', { type: 'application/json' });
    const result = await validateImportFile(file);
    expect(result).toBe(false);
  });

  it('should handle file read error', async () => {
    const file = new File([''], 'test.json', { type: 'application/json' });
    
    // Mock FileReader to throw error
    const originalFileReader = window.FileReader;
    window.FileReader = vi.fn().mockImplementation(() => ({
      readAsText: vi.fn().mockImplementation(() => {
        throw new Error('Read error');
      })
    }));
    
    const result = await validateImportFile(file);
    expect(result).toBe(false);
    
    window.FileReader = originalFileReader;
  });
});

describe('validateImportJson', () => {
  it('should validate valid JSON', () => {
    const validJson = '{"tasks": [{"title": "Task 1", "status": "todo"}]}';
    const result = validateImportJson(validJson);
    expect(result).toBe(true);
  });

  it('should reject invalid JSON', () => {
    const invalidJson = '{"tasks": [{"title": "Task 1", "status": "todo"}]';
    const result = validateImportJson(invalidJson);
    expect(result).toBe(false);
  });

  it('should reject empty string', () => {
    const result = validateImportJson('');
    expect(result).toBe(false);
  });

  it('should reject non-object JSON', () => {
    const result = validateImportJson('"just a string"');
    expect(result).toBe(false);
  });

  it('should validate JSON with required structure', () => {
    const validJson = JSON.stringify({
      tasks: [
        { title: 'Task 1', status: 'todo', priority: 'medium' }
      ],
      boards: [
        { name: 'Board 1', columns: [] }
      ]
    });
    
    const result = validateImportJson(validJson);
    expect(result).toBe(true);
  });

  it('should reject JSON without required structure', () => {
    const invalidJson = JSON.stringify({
      someOtherData: 'value'
    });
    
    const result = validateImportJson(invalidJson);
    expect(result).toBe(false);
  });
});

describe('sanitizeTaskId', () => {
  it('should sanitize valid UUID', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';
    const result = sanitizeTaskId(validId);
    expect(result).toBe(validId);
  });

  it('should sanitize invalid characters', () => {
    const invalidId = '<script>alert("xss")</script>123e4567-e89b-12d3-a456-426614174000';
    const result = sanitizeTaskId(invalidId);
    expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should handle empty string', () => {
    const result = sanitizeTaskId('');
    expect(result).toBe('');
  });

  it('should handle non-string input', () => {
    const result = sanitizeTaskId(123 as never);
    expect(result).toBe('123');
  });

  it('should limit length', () => {
    const longId = 'a'.repeat(1000);
    const result = sanitizeTaskId(longId);
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe('RateLimiter', () => {
  let rateLimiter: typeof searchRateLimiter;

  beforeEach(() => {
    // Reset the rate limiter for each test
    rateLimiter = searchRateLimiter;
    // Clear any existing state
    rateLimiter.reset('test-key');
  });

  it('should allow requests within limit', () => {
    expect(rateLimiter.isAllowed('user1')).toBe(true);
    expect(rateLimiter.isAllowed('user1')).toBe(true);
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    // Make 3 requests (within limit)
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    
    // 4th request should be blocked
    expect(rateLimiter.isAllowed('user1')).toBe(false);
  });

  it('should track different keys separately', () => {
    // User 1 makes 3 requests
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    
    // User 2 should still be allowed
    expect(rateLimiter.isAllowed('user2')).toBe(true);
  });

  it('should reset after time window', async () => {
    // Make 3 requests
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    
    // Should be blocked
    expect(rateLimiter.isAllowed('user1')).toBe(false);
    
    // Wait for time window to reset
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be allowed again
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('should reset specific key', () => {
    // Make 3 requests
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    
    // Should be blocked
    expect(rateLimiter.isAllowed('user1')).toBe(false);
    
    // Reset user1
    rateLimiter.reset('user1');
    
    // Should be allowed again
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('should handle edge case with zero limit', () => {
    const zeroLimitRateLimiter = new RateLimiter(0, 1000);
    expect(zeroLimitRateLimiter.isAllowed('user1')).toBe(false);
  });

  it('should handle edge case with zero window', () => {
    const zeroWindowRateLimiter = new RateLimiter(3, 0);
    expect(zeroWindowRateLimiter.isAllowed('user1')).toBe(true);
    expect(zeroWindowRateLimiter.isAllowed('user1')).toBe(true);
    expect(zeroWindowRateLimiter.isAllowed('user1')).toBe(true);
    expect(zeroWindowRateLimiter.isAllowed('user1')).toBe(false);
  });
});

describe('Security Edge Cases', () => {
  it('should handle very long input strings', () => {
    const longString = 'x'.repeat(100000);
    const result = sanitizeInput(longString, 'TASK_TITLE');
    expect(result.length).toBeLessThanOrEqual(200); // Should be truncated to TASK_TITLE limit
  });

  it('should handle malformed HTML', () => {
    const malformedHtml = '<div><p>Unclosed paragraph<div>Nested div</div>';
    const result = sanitizeInput(malformedHtml, 'TASK_TITLE');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('javascript:');
  });

  it('should handle special characters in search queries', () => {
    const specialQuery = 'search with "quotes" and \'apostrophes\' and \\backslashes\\';
    const result = sanitizeSearchQuery(specialQuery);
    expect(result).toBe('search with "quotes" and \'apostrophes\' and \\backslashes\\');
  });

  it('should handle null and undefined in task data', () => {
    const taskData = {
      title: 'Task',
      description: null,
      tags: undefined,
      priority: 'medium',
      status: 'todo'
    };
    
    const result = sanitizeTaskData(taskData);
    expect(result.description).toBeUndefined();
    expect(result.tags).toEqual([]);
  });

  it('should handle circular references in data', () => {
    const circularData: Record<string, unknown> = { title: 'Task' };
    circularData.self = circularData;
    
    // This should not throw an error
    expect(() => sanitizeTaskData(circularData)).not.toThrow();
  });
});
