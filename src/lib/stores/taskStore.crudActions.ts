/**
 * Task CRUD action creators for the task store.
 * Extracted from taskStore.ts to keep file sizes manageable.
 */

import { Task } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { sanitizeTaskData } from '@/lib/utils/security';
import { applyFiltersToTasks, type TaskStoreState, type StoreSetter } from './taskStore.filters';

type GetState = () => TaskStoreState;

export function createAddTask(_get: GetState, set: StoreSetter) {
  return async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      set({ isLoading: true, error: null });

      const sanitizedData = sanitizeTaskData({
        title: taskData.title,
        description: taskData.description,
        tags: taskData.tags,
      });

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

      // Use functional updater to avoid stale state after await
      set((state) => {
        const updatedTasks = [...state.tasks, newTask];
        return {
          tasks: updatedTasks,
          filteredTasks: applyFiltersToTasks(updatedTasks, state.filters),
          isLoading: false,
          searchCache: new Map(),
        };
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add task',
        isLoading: false
      });
    }
  };
}

export function createUpdateTask(get: GetState, set: StoreSetter) {
  return async (taskId: string, updates: Partial<Task>) => {
    try {
      set({ isLoading: true, error: null });

      const task = get().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      // Sanitize text fields if they're being updated
      const sanitizedUpdates = { ...updates };
      if (updates.title !== undefined || updates.description !== undefined || updates.tags !== undefined) {
        const sanitized = sanitizeTaskData({
          title: updates.title ?? task.title,
          description: updates.description ?? task.description,
          tags: updates.tags ?? task.tags,
        });
        if (updates.title !== undefined) sanitizedUpdates.title = sanitized.title;
        if (updates.description !== undefined) sanitizedUpdates.description = sanitized.description;
        if (updates.tags !== undefined) sanitizedUpdates.tags = sanitized.tags;
      }

      const updatedTask = { ...task, ...sanitizedUpdates, updatedAt: new Date() };
      await taskDB.updateTask(updatedTask);

      // Use functional updater to avoid stale state after await
      set((state) => {
        const updatedTasks = state.tasks.map(t => t.id === taskId ? updatedTask : t);
        return {
          tasks: updatedTasks,
          filteredTasks: applyFiltersToTasks(updatedTasks, state.filters),
          isLoading: false,
          searchCache: new Map(),
        };
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false
      });
    }
  };
}

export function createDeleteTask(_get: GetState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      set({ isLoading: true, error: null });
      await taskDB.deleteTask(taskId);

      // Use functional updater to avoid stale state after await
      set((state) => {
        const updatedTasks = state.tasks.filter(t => t.id !== taskId);
        return {
          tasks: updatedTasks,
          filteredTasks: applyFiltersToTasks(updatedTasks, state.filters),
          isLoading: false,
          searchCache: new Map(),
        };
      });
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false
      });
    }
  };
}

const TASK_COMPLETE_PROGRESS = 100; // progress value indicating task completion

export function createMoveTask(get: GetState, set: StoreSetter) {
  return async (taskId: string, newStatus: Task['status']) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = { status: newStatus, updatedAt: new Date() };

    if (newStatus === 'done') {
      updates.progress = TASK_COMPLETE_PROGRESS;
      if (!task.completedAt) updates.completedAt = new Date();
    } else if (newStatus === 'in-progress') {
      if (task.status === 'todo') updates.progress = 0;
      updates.completedAt = undefined;
    } else if (newStatus === 'todo') {
      updates.progress = undefined;
      updates.completedAt = undefined;
    }

    try {
      await get().updateTask(taskId, updates);
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to move task' });
    }
  };
}

export function createMoveTaskToBoard(get: GetState, set: StoreSetter) {
  return async (taskId: string, targetBoardId: string) => {
    try {
      set({ isLoading: true, error: null });

      const task = get().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      if (task.boardId === targetBoardId) throw new Error('Task is already on this board');

      await get().updateTask(taskId, { boardId: targetBoardId, updatedAt: new Date() });
      await get().applyFilters();
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to move task to board' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  };
}

export function createArchiveTask(get: GetState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      await get().updateTask(taskId, { archivedAt: new Date(), updatedAt: new Date() });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to archive task' });
    }
  };
}

export function createUnarchiveTask(get: GetState, set: StoreSetter) {
  return async (taskId: string) => {
    try {
      await get().updateTask(taskId, { archivedAt: undefined, updatedAt: new Date() });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Failed to unarchive task' });
    }
  };
}
