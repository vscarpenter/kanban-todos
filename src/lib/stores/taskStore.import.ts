/**
 * Task store import/export operations
 * Handles bulk data operations and integration with import/export utilities
 */

import { Task } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportTasks as exportTasksUtil, ExportData } from '@/lib/utils/exportImport';

// Type for store state access - minimal interface needed by import/export
type ImportExportState = {
  tasks: Task[];
  applyFilters: () => Promise<void>;
};

// Using any for setter to avoid complex type inference issues with Zustand
// This is a pragmatic choice - the actual type safety comes from the store definition
type StoreSetter = (partial: any) => void;

/**
 * Exports tasks to ExportData format
 */
export function createExportTasks(get: () => ImportExportState) {
  return (options = { includeArchived: true }): ExportData => {
    return exportTasksUtil(get().tasks, options);
  };
}

/**
 * Imports tasks from external source
 * Updates existing tasks or adds new ones based on ID
 */
export function createImportTasks(get: () => ImportExportState, set: StoreSetter) {
  return async (tasks: Task[]) => {
    try {
      set({ isLoading: true, error: null });

      const existingIds = new Set(get().tasks.map(t => t.id));

      for (const task of tasks) {
        if (existingIds.has(task.id)) {
          await taskDB.updateTask(task);
        } else {
          await taskDB.addTask(task);
        }
      }

      set((state: { tasks: Task[] }) => {
        const taskMap = new Map(state.tasks.map(t => [t.id, t]));
        tasks.forEach(task => taskMap.set(task.id, task));
        return { tasks: Array.from(taskMap.values()), isLoading: false };
      });

      void get().applyFilters();
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import tasks',
        isLoading: false
      });
      throw error;
    }
  };
}

/**
 * Bulk adds tasks to the store and database
 * Processes in batches to avoid overwhelming the database
 */
export function createBulkAddTasks(get: () => ImportExportState, set: StoreSetter) {
  return async (tasks: Task[]) => {
    try {
      set({ isLoading: true, error: null });

      const batchSize = 50;
      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        await Promise.all(batch.map(task => taskDB.addTask(task)));
      }

      set((state: { tasks: Task[] }) => ({
        tasks: [...state.tasks, ...tasks],
        isLoading: false
      }));

      void get().applyFilters();
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to bulk add tasks',
        isLoading: false
      });
      throw error;
    }
  };
}
