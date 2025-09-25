import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task } from '@/lib/types';
import { exportTasks, ExportData } from '@/lib/utils/exportImport';

interface TaskDataState {
  isImporting: boolean;
  isExporting: boolean;
  importError: string | null;
  exportError: string | null;
}

interface TaskDataActions {
  // Import/Export operations
  exportTasks: (options?: { includeArchived: boolean; boardIds?: string[] }) => ExportData;
  importTasks: (tasks: Task[]) => Promise<void>;
  bulkAddTasks: (tasks: Task[]) => Promise<void>;

  // State management
  setImporting: (importing: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setImportError: (error: string | null) => void;
  setExportError: (error: string | null) => void;
  clearErrors: () => void;
}

const initialState: TaskDataState = {
  isImporting: false,
  isExporting: false,
  importError: null,
  exportError: null,
};

export const useTaskDataStore = create<TaskDataState & TaskDataActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setImporting: (importing) => set({ isImporting: importing }),
      setExporting: (exporting) => set({ isExporting: exporting }),
      setImportError: (error) => set({ importError: error }),
      setExportError: (error) => set({ exportError: error }),
      clearErrors: () => set({ importError: null, exportError: null }),

      exportTasks: (options = { includeArchived: false }) => {
        const { setExporting, setExportError } = get();
        setExporting(true);
        setExportError(null);

        try {
          // This would need access to tasks from the CRUD store
          // For now, return empty export data
          const result = exportTasks([], options);
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to export tasks';
          setExportError(message);
          throw error;
        } finally {
          setExporting(false);
        }
      },

      importTasks: async (tasks) => {
        const { setImporting, setImportError, bulkAddTasks } = get();
        setImporting(true);
        setImportError(null);

        try {
          await bulkAddTasks(tasks);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to import tasks';
          setImportError(message);
          throw error;
        } finally {
          setImporting(false);
        }
      },

      bulkAddTasks: async (tasks) => {
        const { setImportError } = get();
        setImportError(null);

        try {
          // Validate tasks
          const validTasks = tasks.filter(task => {
            return !!(
              task.title?.trim() &&
              task.boardId &&
              task.status &&
              task.priority
            );
          });

          if (validTasks.length === 0) {
            throw new Error('No valid tasks to import');
          }

          // Process in batches for better performance
          const BATCH_SIZE = 50;
          for (let i = 0; i < validTasks.length; i += BATCH_SIZE) {
            const batch = validTasks.slice(i, i + BATCH_SIZE);

            // Add unique IDs and timestamps
            const processedBatch = batch.map(task => ({
              ...task,
              id: task.id || crypto.randomUUID(),
              createdAt: task.createdAt || new Date(),
              updatedAt: new Date(),
            }));

            // This would need to integrate with the CRUD store
            // For now, just validate the structure
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, processedBatch);
          }

        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to bulk add tasks';
          setImportError(message);
          throw error;
        }
      },
    }),
    {
      name: 'task-data-store',
    }
  )
);