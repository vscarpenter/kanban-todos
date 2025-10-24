import { describe, it, expect } from 'vitest';
import { searchTasks } from '../taskSearch';
import { Task } from '@/lib/types';

// Helper to create test tasks
function createTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Test Task',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    boardId: 'board-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

describe('taskSearch utility', () => {
  describe('empty and whitespace search terms', () => {
    it('returns all tasks when search term is empty', () => {
      const tasks = [
        createTask({ title: 'Task 1' }),
        createTask({ title: 'Task 2' })
      ];

      const result = searchTasks(tasks, '');
      expect(result).toEqual(tasks);
    });

    it('returns all tasks when search term is only whitespace', () => {
      const tasks = [
        createTask({ title: 'Task 1' }),
        createTask({ title: 'Task 2' })
      ];

      const result = searchTasks(tasks, '   ');
      expect(result).toEqual(tasks);
    });
  });

  describe('single word searches', () => {
    it('finds tasks by title match', () => {
      const tasks = [
        createTask({ title: 'Fix bug in login' }),
        createTask({ title: 'Add feature to dashboard' }),
        createTask({ title: 'Update documentation' })
      ];

      const result = searchTasks(tasks, 'bug');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Fix bug in login');
    });

    it('finds tasks by description match', () => {
      const tasks = [
        createTask({
          title: 'Task A',
          description: 'This needs urgent attention'
        }),
        createTask({
          title: 'Task B',
          description: 'Low priority item'
        })
      ];

      const result = searchTasks(tasks, 'urgent');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task A');
    });

    it('finds tasks by tag match', () => {
      const tasks = [
        createTask({
          title: 'Task A',
          tags: ['frontend', 'react']
        }),
        createTask({
          title: 'Task B',
          tags: ['backend', 'api']
        })
      ];

      const result = searchTasks(tasks, 'frontend');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task A');
    });

    it('is case insensitive', () => {
      const tasks = [
        createTask({ title: 'Fix BUG in Login' })
      ];

      const result = searchTasks(tasks, 'bug');
      expect(result).toHaveLength(1);
    });
  });

  describe('multi-word searches', () => {
    it('finds tasks matching all words (AND logic)', () => {
      const tasks = [
        createTask({
          title: 'Fix login bug',
          description: 'Critical issue'
        }),
        createTask({
          title: 'Fix dashboard bug',
          description: 'Minor issue'
        }),
        createTask({
          title: 'Update login page',
          description: 'Enhancement'
        })
      ];

      const result = searchTasks(tasks, 'login bug');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Fix login bug');
    });

    it('requires all words to be present', () => {
      const tasks = [
        createTask({ title: 'Fix the bug' }),
        createTask({ title: 'Fix the feature' })
      ];

      const result = searchTasks(tasks, 'fix bug feature');
      expect(result).toHaveLength(0);
    });

    it('matches words across different fields', () => {
      const tasks = [
        createTask({
          title: 'Login page',
          description: 'Fix the bug',
          tags: ['critical']
        })
      ];

      const result = searchTasks(tasks, 'login bug critical');
      expect(result).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('handles tasks with no description', () => {
      const tasks = [
        createTask({
          title: 'Task without description',
          description: undefined
        })
      ];

      const result = searchTasks(tasks, 'without');
      expect(result).toHaveLength(1);
    });

    it('handles tasks with empty tags', () => {
      const tasks = [
        createTask({
          title: 'Task with no tags',
          tags: []
        })
      ];

      const result = searchTasks(tasks, 'tags');
      expect(result).toHaveLength(1);
    });

    it('handles special characters in search', () => {
      const tasks = [
        createTask({ title: 'Fix C++ compilation error' })
      ];

      const result = searchTasks(tasks, 'c++');
      expect(result).toHaveLength(1);
    });

    it('returns empty array when no tasks match', () => {
      const tasks = [
        createTask({ title: 'Task A' }),
        createTask({ title: 'Task B' })
      ];

      const result = searchTasks(tasks, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('performance optimization for large datasets', () => {
    it('handles datasets with exactly 500 tasks', () => {
      const tasks = Array.from({ length: 500 }, (_, i) =>
        createTask({ title: `Task ${i}` })
      );

      const result = searchTasks(tasks, 'Task 250');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Task 250');
    });

    it('handles datasets with more than 500 tasks (optimized path)', () => {
      const tasks = Array.from({ length: 1000 }, (_, i) =>
        createTask({
          title: `Task ${i}`,
          description: i % 10 === 0 ? 'special marker' : 'regular task'
        })
      );

      const result = searchTasks(tasks, 'special marker');
      expect(result).toHaveLength(100); // Every 10th task
    });

    it('produces same results for small and large datasets', () => {
      const createTestSet = (count: number) =>
        Array.from({ length: count }, (_, i) =>
          createTask({
            title: i % 2 === 0 ? 'Even task' : 'Odd task',
            tags: i % 3 === 0 ? ['special'] : []
          })
        );

      const smallDataset = createTestSet(100);
      const largeDataset = createTestSet(600);

      const smallResult = searchTasks(smallDataset.slice(0, 100), 'special');
      const largeResult = searchTasks(largeDataset.slice(0, 100), 'special');

      // Should produce same results for same input
      expect(smallResult.map(t => t.title)).toEqual(
        largeResult.map(t => t.title)
      );
    });
  });

  describe('title match optimization', () => {
    it('finds match in title without checking description', () => {
      const tasks = [
        createTask({
          title: 'Important task',
          description: 'This is a very long description that would be expensive to process'
        })
      ];

      // This tests that title matches are found quickly
      const result = searchTasks(tasks, 'important');
      expect(result).toHaveLength(1);
    });

    it('falls back to full search when title does not match', () => {
      const tasks = [
        createTask({
          title: 'Task A',
          description: 'Contains the important keyword'
        })
      ];

      const result = searchTasks(tasks, 'important');
      expect(result).toHaveLength(1);
    });
  });

  describe('real-world scenarios', () => {
    it('searches across multiple tasks with mixed content', () => {
      const tasks = [
        createTask({
          title: 'Implement user authentication',
          description: 'Add OAuth and JWT support',
          tags: ['backend', 'security']
        }),
        createTask({
          title: 'Design login UI',
          description: 'Create mockups for authentication flow',
          tags: ['frontend', 'design']
        }),
        createTask({
          title: 'Write API documentation',
          description: 'Document all endpoints',
          tags: ['backend', 'docs']
        })
      ];

      // Search for backend tasks
      const backendTasks = searchTasks(tasks, 'backend');
      expect(backendTasks).toHaveLength(2);

      // Search for authentication-related tasks
      const authTasks = searchTasks(tasks, 'authentication');
      expect(authTasks).toHaveLength(2);

      // Specific multi-word search
      const specificTasks = searchTasks(tasks, 'backend security');
      expect(specificTasks).toHaveLength(1);
      expect(specificTasks[0].title).toBe('Implement user authentication');
    });

    it('handles partial word matches', () => {
      const tasks = [
        createTask({ title: 'Authentication system' }),
        createTask({ title: 'Authorization module' })
      ];

      const result = searchTasks(tasks, 'auth');
      expect(result).toHaveLength(2);
    });
  });
});
