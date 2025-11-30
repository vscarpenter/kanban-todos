/**
 * Task CRUD operations - create, read, update, delete, move, archive
 */

import { Task } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { sanitizeTaskData } from '@/lib/utils/security';
import type { TaskStoreState, StoreSetter } from './types';
import { applyFiltersToTasks } from './helpers';

/**
 * Creates the addTask action
 * Adds a new task to the store and database
 */
export function createAddTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ isLoading: true, error: null });

      // Sanitize and validate input data
      const sanitizedData = sanitizeTaskData({
        title: taskData.title,
        description: taskData.description,
        tags: taskData.tags,
      });

      // Validate required fields
      if (!sanitizedData.title.trim()) {
        throw new Error('Task title is required');
      }

      const newTask: Task = {
        ...taskData,
        ...sanitizedData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await taskDB.addTask(newTask);

      const { tasks, filters } = get();
      const updatedTasks = [...tasks, newTask];
      const filteredTasks = applyFiltersToTasks(updatedTasks, filters);

      set({
        tasks: updatedTasks,
        filteredTasks: filteredTasks,
        isLoading: false,
        searchCache: new Map(), // Clear cache when tasks change
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add task',
        isLoading: false
      });
    }
  };
}

/**
 * Creates the updateTask action
 * Updates an existing task in the store and database
 */
export function createUpdateTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string, updates: Partial<Task>) => {
    try {
      set({ isLoading: true, error: null });

      const updatedTask = {
        ...get().tasks.find(t => t.id === taskId)!,
        ...updates,
        updatedAt: new Date(),
      };

      await taskDB.updateTask(updatedTask);

      const { tasks, filters } = get();
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? updatedTask : t
      );
      const filteredTasks = applyFiltersToTasks(updatedTasks, filters);

      set({
        tasks: updatedTasks,
        filteredTasks: filteredTasks,
        isLoading: false,
        searchCache: new Map(), // Clear cache when tasks change
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false
      });
    }
  };
}

/**
 * Creates the deleteTask action
 * Deletes a task from the store and database
 */
export function createDeleteTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      set({ isLoading: true, error: null });

      await taskDB.deleteTask(taskId);

      const { tasks, filters } = get();
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      const filteredTasks = applyFiltersToTasks(updatedTasks, filters);

      set({
        tasks: updatedTasks,
        filteredTasks: filteredTasks,
        isLoading: false,
        searchCache: new Map(), // Clear cache when tasks change
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false
      });
    }
  };
}

/**
 * Creates the moveTask action
 * Moves a task to a different status column
 * Handles progress tracking and completion timestamps
 */
export function createMoveTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string, newStatus: Task['status']) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<Task> = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Handle progress tracking based on status
      if (newStatus === 'done') {
        updates.progress = 100;
        if (!task.completedAt) {
          updates.completedAt = new Date();
        }
      } else if (newStatus === 'in-progress') {
        // Keep existing progress or set to 0 if moving from todo
        if (task.status === 'todo') {
          updates.progress = 0;
        }
        updates.completedAt = undefined;
      } else if (newStatus === 'todo') {
        // Clear progress when moving back to todo
        updates.progress = undefined;
        updates.completedAt = undefined;
      }

      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move task'
      });
    }
  };
}

/**
 * Creates the moveTaskToBoard action
 * Moves a task to a different board
 */
export function createMoveTaskToBoard(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string, targetBoardId: string) => {
    try {
      set({ isLoading: true, error: null });

      const task = get().tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      if (task.boardId === targetBoardId) {
        throw new Error('Task is already on this board');
      }

      const updates: Partial<Task> = {
        boardId: targetBoardId,
        updatedAt: new Date(),
      };

      await get().updateTask(taskId, updates);

      // Refresh filtered tasks to reflect board change
      await get().applyFilters();

    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to move task to board'
      });
      throw error; // Re-throw so UI can handle it
    } finally {
      set({ isLoading: false });
    }
  };
}

/**
 * Creates the archiveTask action
 * Archives a task (soft delete)
 */
export function createArchiveTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<Task> = {
        archivedAt: new Date(),
        updatedAt: new Date(),
      };

      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to archive task'
      });
    }
  };
}

/**
 * Creates the unarchiveTask action
 * Unarchives a task
 */
export function createUnarchiveTask(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updates: Partial<Task> = {
        archivedAt: undefined,
        updatedAt: new Date(),
      };

      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to unarchive task'
      });
    }
  };
}
