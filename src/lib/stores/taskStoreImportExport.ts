/**
 * Import/export operations for task store
 * Handles bulk data operations and integration with import/export utilities
 */

import { Task } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportTasks as exportTasksUtil, ExportData } from '@/lib/utils/exportImport';

// Type for store state access
type ImportExportStoreState = {
  tasks: Task[];
  filters: { boardId?: string; crossBoardSearch?: boolean };
  applyFilters: () => Promise<void>;
};

// Type for store setter - using any to avoid complex type inference issues
type StoreSetter = (state: any) => void;

/**
 * Exports tasks to ExportData format
 * Supports filtering by board and including/excluding archived tasks
 */
export function createExportTasks(get: () => ImportExportStoreState) {
  return (options = { includeArchived: true }): ExportData => {
    const { tasks } = get();
    return exportTasksUtil(tasks, options);
  };
}

/**
 * Imports tasks from external source
 * Updates existing tasks or adds new ones based on ID
 */
export function createImportTasks(
  get: () => ImportExportStoreState,
  set: StoreSetter
) {
  return async (tasks: Task[]) => {
    try {
      set({ isLoading: true, error: null });

      const { tasks: existingTasks } = get();
      const existingIds = new Set(existingTasks.map(t => t.id));

      // Add or update tasks in database
      for (const task of tasks) {
        if (existingIds.has(task.id)) {
          // Update existing task
          await taskDB.updateTask(task);
        } else {
          // Add new task
          await taskDB.addTask(task);
        }
      }

      // Update store state
      set((state: any) => {
        const taskMap = new Map(state.tasks.map((t: Task) => [t.id, t]));

        // Add or update imported tasks
        tasks.forEach(task => {
          taskMap.set(task.id, task);
        });

        return {
          tasks: Array.from(taskMap.values()),
          isLoading: false,
        };
      });

      // Reapply filters after import
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
export function createBulkAddTasks(
  get: () => ImportExportStoreState,
  set: StoreSetter
) {
  return async (tasks: Task[]) => {
    try {
      set({ isLoading: true, error: null });

      // Process tasks in batches to avoid overwhelming the database
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < tasks.length; i += batchSize) {
        batches.push(tasks.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.all(batch.map(task => taskDB.addTask(task)));
      }

      // Update store state
      set((state: any) => ({
        tasks: [...state.tasks, ...tasks],
        isLoading: false,
      }));

      // Reapply filters after bulk add
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
