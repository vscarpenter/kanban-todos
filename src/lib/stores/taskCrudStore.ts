import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';

interface TaskCrudState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

interface TaskCrudActions {
  // Basic CRUD operations
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: Task['status']) => Promise<void>;
  moveTaskToBoard: (taskId: string, targetBoardId: string) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  unarchiveTask: (taskId: string) => Promise<void>;

  // Board management
  handleBoardDeletion: (deletedBoardId: string) => void;
  validateTaskIntegrity: (task: Task) => boolean;

  // Store initialization
  initializeStore: () => Promise<void>;
  loadTasks: () => Promise<void>;
}

const initialState: TaskCrudState = {
  tasks: [],
  isLoading: false,
  error: null,
};

export const useTaskCrudStore = create<TaskCrudState & TaskCrudActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setTasks: (tasks) => set({ tasks }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      addTask: async (taskData) => {
        const { setError, setLoading, tasks, setTasks } = get();
        setLoading(true);
        setError(null);

        try {
          const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await taskDB.addTask(newTask);
          setTasks([...tasks, newTask]);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add task';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      updateTask: async (taskId, updates) => {
        const { setError, setLoading, tasks, setTasks } = get();
        setLoading(true);
        setError(null);

        try {
          const updatedTask = { ...updates, updatedAt: new Date() };
          const taskToUpdate = tasks.find(t => t.id === taskId);
          if (!taskToUpdate) throw new Error('Task not found');
          await taskDB.updateTask({ ...taskToUpdate, ...updatedTask });

          const updatedTasks = tasks.map(task =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          );
          setTasks(updatedTasks);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update task';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      deleteTask: async (taskId) => {
        const { setError, setLoading, tasks, setTasks } = get();
        setLoading(true);
        setError(null);

        try {
          await taskDB.deleteTask(taskId);
          const filteredTasks = tasks.filter(task => task.id !== taskId);
          setTasks(filteredTasks);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete task';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      moveTask: async (taskId, newStatus) => {
        const { updateTask } = get();
        await updateTask(taskId, { status: newStatus });
      },

      moveTaskToBoard: async (taskId, targetBoardId) => {
        const { updateTask } = get();
        await updateTask(taskId, { boardId: targetBoardId });
      },

      archiveTask: async (taskId) => {
        const { updateTask } = get();
        await updateTask(taskId, { archivedAt: new Date() });
      },

      unarchiveTask: async (taskId) => {
        const { updateTask } = get();
        await updateTask(taskId, { archivedAt: undefined });
      },

      handleBoardDeletion: (deletedBoardId) => {
        const { tasks, setTasks } = get();
        // Move tasks from deleted board to a default board or archive them
        const updatedTasks = tasks.map(task =>
          task.boardId === deletedBoardId
            ? { ...task, archivedAt: new Date(), updatedAt: new Date() }
            : task
        );
        setTasks(updatedTasks);
      },

      validateTaskIntegrity: (task) => {
        return !!(
          task.id &&
          task.title?.trim() &&
          task.boardId &&
          task.status &&
          task.priority &&
          task.createdAt &&
          task.updatedAt
        );
      },

      loadTasks: async () => {
        const { setError, setLoading, setTasks } = get();
        setLoading(true);
        setError(null);

        try {
          const tasks = await taskDB.getTasks();
          setTasks(tasks.filter(task => get().validateTaskIntegrity(task)));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load tasks';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      initializeStore: async () => {
        const { loadTasks } = get();
        await loadTasks();
      },
    }),
    {
      name: 'task-crud-store',
    }
  )
);