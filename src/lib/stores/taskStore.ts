import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Task, TaskFilters } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';

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
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: Task['status']) => Promise<void>;
  archiveTask: (taskId: string, reason?: string) => Promise<void>;
  
  // Filtering and search
  applyFilters: () => void;
  clearFilters: () => void;
  
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

export const useTaskStore = create<TaskState & TaskActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setTasks: (tasks) => set({ tasks }),
        setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),
        setFilters: (filters) => set((state) => ({ 
          filters: { ...state.filters, ...filters } 
        })),
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
            
            set((state) => {
              const newTasks = [...state.tasks, newTask];
              return {
                tasks: newTasks,
                filteredTasks: newTasks,
                isLoading: false,
              };
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
            
            set((state) => {
              const newTasks = state.tasks.map(t => 
                t.id === taskId ? updatedTask : t
              );
              return {
                tasks: newTasks,
                filteredTasks: newTasks,
                isLoading: false,
              };
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
            
            set((state) => {
              const newTasks = state.tasks.filter(t => t.id !== taskId);
              return {
                tasks: newTasks,
                filteredTasks: newTasks,
                isLoading: false,
              };
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

        archiveTask: async (taskId, reason?) => {
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

        applyFilters: () => {
          const { tasks, filters } = get();
          let filtered = tasks;

          // Filter by search
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(task =>
              task.title.toLowerCase().includes(searchLower) ||
              task.description?.toLowerCase().includes(searchLower) ||
              task.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
          }

          // Filter by status
          if (filters.status) {
            filtered = filtered.filter(task => task.status === filters.status);
          }

          // Filter by priority
          if (filters.priority) {
            filtered = filtered.filter(task => task.priority === filters.priority);
          }

          // Filter by tags
          if (filters.tags.length > 0) {
            filtered = filtered.filter(task =>
              filters.tags.some(tag => task.tags.includes(tag))
            );
          }

          // Filter by date range
          if (filters.dateRange) {
            filtered = filtered.filter(task => {
              const taskDate = new Date(task.createdAt);
              return taskDate >= filters.dateRange!.start && 
                     taskDate <= filters.dateRange!.end;
            });
          }

          set({ filteredTasks: filtered });
        },

        clearFilters: () => {
          set({ 
            filters: { search: '', tags: [] },
            filteredTasks: get().tasks 
          });
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
            
            set({ 
              tasks: tasks.map(task => ({
                ...task,
                createdAt: new Date(task.createdAt),
                updatedAt: new Date(task.updatedAt),
                completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
                archivedAt: task.archivedAt ? new Date(task.archivedAt) : undefined,
              })),
              filteredTasks: tasks,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize store',
              isLoading: false 
            });
          }
        },
      }),
      {
        name: 'cascade-tasks',
        partialize: (state) => ({ 
          tasks: state.tasks,
          filters: state.filters 
        }),
      }
    )
  )
);
