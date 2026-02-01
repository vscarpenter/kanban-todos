import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateTaskIntegrity,
  validateTaskCollection,
  isValidTask
} from '../taskValidation';
import { Task } from '@/lib/types';

// Helper to create a valid test task
function createValidTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    priority: 'medium',
    tags: ['test'],
    boardId: 'board-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

describe('taskValidation utility', () => {
  // Suppress console warnings during tests
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateTaskIntegrity', () => {
    describe('valid tasks', () => {
      it('returns true for a fully valid task', () => {
        const task = createValidTask();
        expect(validateTaskIntegrity(task)).toBe(true);
      });

      it('accepts task without optional priority', () => {
        const task = createValidTask({ priority: undefined });
        expect(validateTaskIntegrity(task)).toBe(true);
      });

      it('accepts task without optional description', () => {
        const task = createValidTask({ description: undefined });
        expect(validateTaskIntegrity(task)).toBe(true);
      });

      it('accepts task with empty tags array', () => {
        const task = createValidTask({ tags: [] });
        expect(validateTaskIntegrity(task)).toBe(true);
      });

      it('accepts all valid status values', () => {
        expect(validateTaskIntegrity(createValidTask({ status: 'todo' }))).toBe(true);
        expect(validateTaskIntegrity(createValidTask({ status: 'in-progress' }))).toBe(true);
        expect(validateTaskIntegrity(createValidTask({ status: 'done' }))).toBe(true);
      });

      it('accepts all valid priority values', () => {
        expect(validateTaskIntegrity(createValidTask({ priority: 'low' }))).toBe(true);
        expect(validateTaskIntegrity(createValidTask({ priority: 'medium' }))).toBe(true);
        expect(validateTaskIntegrity(createValidTask({ priority: 'high' }))).toBe(true);
      });
    });

    describe('missing required fields', () => {
      it('returns false when id is missing', () => {
        const task = createValidTask({ id: '' });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false when title is missing', () => {
        const task = createValidTask({ title: '' });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false when boardId is missing', () => {
        const task = createValidTask({ boardId: '' });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('invalid data types', () => {
      it('returns false when id is not a string', () => {
        const task = createValidTask({ id: 123 as unknown as string });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false when title is not a string', () => {
        const task = createValidTask({ title: null as unknown as string });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false when boardId is not a string', () => {
        const task = createValidTask({ boardId: undefined as unknown as string });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false when createdAt is not a Date', () => {
        const task = createValidTask({ createdAt: '2024-01-01' as unknown as Date });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false when updatedAt is not a Date', () => {
        const task = createValidTask({ updatedAt: new Date().toISOString() as unknown as Date });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false when tags is not an array', () => {
        const task = createValidTask({ tags: 'tag1,tag2' as unknown as string[] });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('invalid enum values', () => {
      it('returns false for invalid status', () => {
        const task = createValidTask({ status: 'completed' as unknown as Task['status'] });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false for invalid priority', () => {
        const task = createValidTask({ priority: 'urgent' as unknown as Task['priority'] });
        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });

      it('returns false for empty string status', () => {
        const task = createValidTask({ status: '' as unknown as Task['status'] });
        expect(validateTaskIntegrity(task)).toBe(false);
      });
    });

    describe('error handling', () => {
      it('returns false and logs error when validation throws', () => {
        // Create a task that will throw when accessed
        const task = new Proxy({} as Task, {
          get() {
            throw new Error('Test error');
          }
        });

        expect(validateTaskIntegrity(task)).toBe(false);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('validateTaskCollection', () => {
    it('returns all tasks when all are valid', () => {
      const tasks = [
        createValidTask({ title: 'Task 1' }),
        createValidTask({ title: 'Task 2' }),
        createValidTask({ title: 'Task 3' })
      ];

      const result = validateTaskCollection(tasks);
      expect(result).toEqual(tasks);
      expect(result).toHaveLength(3);
    });

    it('filters out invalid tasks', () => {
      const tasks = [
        createValidTask({ title: 'Valid 1' }),
        createValidTask({ title: '', id: 'invalid-1' }), // Invalid - empty title
        createValidTask({ title: 'Valid 2' }),
        createValidTask({ status: 'invalid' as unknown as Task['status'], id: 'invalid-2' }), // Invalid status
        createValidTask({ title: 'Valid 3' })
      ];

      const result = validateTaskCollection(tasks);
      expect(result).toHaveLength(3);
      expect(result.map(t => t.title)).toEqual(['Valid 1', 'Valid 2', 'Valid 3']);
    });

    it('logs warning when tasks are filtered', () => {
      const tasks = [
        createValidTask({ title: 'Valid' }),
        createValidTask({ title: '' }) // Invalid
      ];

      validateTaskCollection(tasks);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Filtered out 1 invalid tasks')
      );
    });

    it('does not log when all tasks are valid', () => {
      const tasks = [createValidTask(), createValidTask()];

      validateTaskCollection(tasks);
      expect(console.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Filtered out')
      );
    });

    it('handles empty array', () => {
      const result = validateTaskCollection([]);
      expect(result).toEqual([]);
    });

    it('accepts custom validator function', () => {
      const tasks = [
        createValidTask({ tags: ['important'] }),
        createValidTask({ tags: ['optional'] }),
        createValidTask({ tags: ['important'] })
      ];

      // Custom validator - only accept tasks with 'important' tag
      const customValidator = (task: Task) => task.tags.includes('important');

      const result = validateTaskCollection(tasks, customValidator);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.tags.includes('important'))).toBe(true);
    });
  });

  describe('isValidTask', () => {
    it('returns true for valid task objects', () => {
      const task = createValidTask();
      expect(isValidTask(task)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isValidTask(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidTask(undefined)).toBe(false);
    });

    it('returns false for non-objects', () => {
      expect(isValidTask('task')).toBe(false);
      expect(isValidTask(123)).toBe(false);
      expect(isValidTask(true)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isValidTask([])).toBe(false);
      expect(isValidTask([createValidTask()])).toBe(false);
    });

    it('returns false for objects missing required fields', () => {
      expect(isValidTask({ title: 'Test' })).toBe(false);
      expect(isValidTask({ id: '123' })).toBe(false);
    });

    it('narrows type for TypeScript', () => {
      const unknownData: unknown = createValidTask();

      if (isValidTask(unknownData)) {
        // Type should be narrowed to Task
        const taskId: string = unknownData.id;
        expect(taskId).toBeTruthy();
      }
    });
  });

  describe('real-world scenarios', () => {
    it('handles tasks from corrupted IndexedDB data', () => {
      const corruptedTasks = [
        createValidTask({ title: 'Good Task 1' }),
        {
          // Missing required fields
          id: 'corrupt-1',
          title: 'Corrupt Task'
        } as unknown as Task,
        createValidTask({ title: 'Good Task 2' }),
        {
          // Wrong date type (string instead of Date)
          ...createValidTask({ title: 'Corrupt Task 2' }),
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        } as unknown as Task,
        createValidTask({ title: 'Good Task 3' })
      ];

      const result = validateTaskCollection(corruptedTasks);
      expect(result).toHaveLength(3);
      expect(result.every(t => t.title.startsWith('Good'))).toBe(true);
    });

    it('validates tasks after JSON import', () => {
      // Simulate tasks from JSON.parse (dates become strings)
      const jsonTasks = [
        {
          ...createValidTask(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as unknown as Task
      ];

      const result = validateTaskCollection(jsonTasks);
      expect(result).toHaveLength(0); // Should be filtered due to invalid dates
    });

    it('validates batch of tasks with mixed validity', () => {
      const mixedTasks = Array.from({ length: 100 }, (_, i) => {
        // Every 10th task is invalid
        if (i % 10 === 0) {
          return createValidTask({ title: '', id: `invalid-${i}` });
        }
        return createValidTask({ title: `Task ${i}` });
      });

      const result = validateTaskCollection(mixedTasks);
      expect(result).toHaveLength(90);
    });
  });
});
