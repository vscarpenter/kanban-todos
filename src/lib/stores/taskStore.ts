import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskFilters } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportTasks, ExportData } from '@/lib/utils/exportImport';

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  filters: TaskFilters;
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  // State management
  setTasks: (tasks: Task[]) => void;
  setFilteredTasks: (tasks: Task[]) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  setBoardFilter: (boardId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: Task['status']) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  unarchiveTask: (taskId: string) => Promise<void>;
  
  // Filtering and search
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Import/Export operations
  exportTasks: (options?: { includeArchived: boolean; boardIds?: string[] }) => ExportData;
  importTasks: (tasks: Task[]) => Promise<void>;
  bulkAddTasks: (tasks: Task[]) => Promise<void>;
  
  // Store initialization
  initializeStore: () => Promise<void>;
}

const initialState: TaskState = {
  tasks: [],
  filteredTasks: [],
  filters: {
    search: '',
    tags: [],
  },
  isLoading: false,
  error: null,
};

// Helper function to apply filters to a task list
const applyFiltersToTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  let filteredTasks = tasks;
  
  // Filter by board first (most important filter)
  if (filters.boardId) {
    filteredTasks = filteredTasks.filter(task => task.boardId === filters.boardId);
  }
  
  // Apply other filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  if (filters.status) {
    filteredTasks = filteredTasks.filter(task => task.status === filters.status);
  }

  if (filters.priority) {
    filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
  }

  if (filters.tags.length > 0) {
    filteredTasks = filteredTasks.filter(task =>
      filters.tags.some(tag => task.tags.includes(tag))
    );
  }

  if (filters.dateRange) {
    filteredTasks = filteredTasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= filters.dateRange!.start && 
             taskDate <= filters.dateRange!.end;
    });
  }
  
  return filteredTasks;
};

export const useTaskStore = create<TaskState & TaskActions>()(
  devtools(
    (set, get) => ({
        ...initialState,

        setTasks: (tasks) => set({ tasks }),
        setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),
        setFilters: (filters) => {
          set((state) => ({ 
            filters: { ...state.filters, ...filters } 
          }));
          get().applyFilters();
        },
        setBoardFilter: (boardId) => {
          set((state) => ({
            filters: { ...state.filters, boardId: boardId || undefined }
          }));
          get().applyFilters();
        },
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        addTask: async (taskData) => {
          try {
            set({ isLoading: true, error: null });
            
            const newTask: Task = {
              ...taskData,
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
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to add task',
              isLoading: false 
            });
          }
        },

        updateTask: async (taskId, updates) => {
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
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update task',
              isLoading: false 
            });
          }
        },

        deleteTask: async (taskId) => {
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
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete task',
              isLoading: false 
            });
          }
        },

        moveTask: async (taskId, newStatus) => {
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
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to move task'
            });
          }
        },

        archiveTask: async (taskId) => {
          try {
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) return;

            const updates: Partial<Task> = {
              archivedAt: new Date(),
              updatedAt: new Date(),
            };

            await get().updateTask(taskId, updates);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to archive task'
            });
          }
        },

        unarchiveTask: async (taskId) => {
          try {
            const task = get().tasks.find(t => t.id === taskId);
            if (!task) return;

            const updates: Partial<Task> = {
              archivedAt: undefined,
              updatedAt: new Date(),
            };

            await get().updateTask(taskId, updates);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to unarchive task'
            });
          }
        },

        applyFilters: () => {
          const { tasks, filters } = get();
          const filteredTasks = applyFiltersToTasks(tasks, filters);
          set({ filteredTasks });
        },

        clearFilters: () => {
          const { filters } = get();
          set({ 
            filters: { 
              search: '', 
              tags: [],
              boardId: filters.boardId // Keep board filter when clearing other filters
            }
          });
          get().applyFilters();
        },

        // Export/Import operations
        exportTasks: (options = { includeArchived: true }) => {
          const { tasks } = get();
          return exportTasks(tasks, options);
        },

        importTasks: async (tasks: Task[]) => {
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
            set((state) => {
              const taskMap = new Map(state.tasks.map(t => [t.id, t]));
              
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
            get().applyFilters();
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to import tasks',
              isLoading: false 
            });
            throw error;
          }
        },

        bulkAddTasks: async (tasks: Task[]) => {
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
            set((state) => ({
              tasks: [...state.tasks, ...tasks],
              isLoading: false,
            }));
            
            // Reapply filters after bulk add
            get().applyFilters();
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to bulk add tasks',
              isLoading: false 
            });
            throw error;
          }
        },

        initializeStore: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // Only initialize if we're in a browser environment
            if (typeof window === 'undefined') {
              set({ isLoading: false });
              return;
            }
            
            await taskDB.init();
            const tasks = await taskDB.getTasks();
            
            const processedTasks = tasks.map(task => ({
              ...task,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt),
              completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
              archivedAt: task.archivedAt ? new Date(task.archivedAt) : undefined,
            }));
            
            set({ 
              tasks: processedTasks,
              filteredTasks: processedTasks,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize store',
              isLoading: false 
            });
          }
        },
      })
    )
);
