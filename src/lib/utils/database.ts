import { Task, Board, Settings } from '@/lib/types';

const DB_NAME = 'cascade-tasks';
const DB_VERSION = 1;

export class TaskDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not available');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      // Fires when another tab holds an older-version connection open,
      // preventing this upgrade from proceeding. Without this handler the
      // open request neither resolves nor rejects — the app hangs
      // indefinitely with no error surfaced. Reject with a clear message
      // instead, since a working DB connection is required to proceed.
      request.onblocked = () => {
        reject(new Error('Database upgrade blocked — please close other tabs with this app open and retry.'));
      };
      request.onsuccess = () => {
        this.db = request.result;

        // Handle version change from another tab upgrading the DB
        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
        };

        // Handle unexpected connection close
        this.db.onclose = () => {
          this.db = null;
        };

        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Migration ladder, guarded by oldVersion so an upgrade from any
        // prior version applies every step in between. IndexedDB can't
        // alter an existing store's keyPath or index set outside
        // onupgradeneeded, so this scaffold needs to exist before a real
        // migration is needed — add `if (oldVersion < 2) { ... }` etc. here
        // the next time DB_VERSION changes.
        if (oldVersion < 1) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('boardId', 'boardId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('archivedAt', 'archivedAt', { unique: false });
          taskStore.createIndex('dueDate', 'dueDate', { unique: false });

          const boardStore = db.createObjectStore('boards', { keyPath: 'id' });
          boardStore.createIndex('isDefault', 'isDefault', { unique: false });
          boardStore.createIndex('order', 'order', { unique: false });

          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  async getTasks(boardId?: string): Promise<Task[]> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');

      // Use the boardId index for efficient filtered lookups
      const request = boardId
        ? store.index('boardId').getAll(boardId)
        : store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addTask(task: Task): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.add(task);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateTask(task: Task): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.put(task);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.delete(taskId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Adds or updates many tasks in a single transaction. Unlike calling
   * addTask/updateTask per item, this doesn't open one transaction per task —
   * used by the import flow, which can otherwise fire hundreds of
   * transactions for one backup restore.
   */
  async upsertTasks(tasks: Task[]): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');
    if (tasks.length === 0) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tasks'], 'readwrite');
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      const store = transaction.objectStore('tasks');
      for (const task of tasks) {
        store.put(task);
      }
    });
  }

  async getBoards(): Promise<Board[]> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['boards'], 'readonly');
      const store = transaction.objectStore('boards');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addBoard(board: Board): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.add(board);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateBoard(board: Board): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.put(board);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Adds or updates many boards in a single transaction — see upsertTasks.
   */
  async upsertBoards(boards: Board[]): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');
    if (boards.length === 0) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['boards'], 'readwrite');
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      const store = transaction.objectStore('boards');
      for (const board of boards) {
        store.put(board);
      }
    });
  }

  async deleteBoard(boardId: string): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    // A board owns its tasks: delete the board and every task on it in one
    // transaction so tasks can never outlive their board (no orphaned tasks).
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tasks', 'boards'], 'readwrite');
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      const tasks = transaction.objectStore('tasks');
      const taskKeysRequest = tasks.index('boardId').getAllKeys(boardId);
      taskKeysRequest.onsuccess = () => {
        for (const key of taskKeysRequest.result) {
          tasks.delete(key);
        }
      };

      transaction.objectStore('boards').delete(boardId);
    });
  }

  async getSettings(): Promise<Settings | null> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('default');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateSettings(settings: Settings): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ id: 'default', ...settings });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async exportData(): Promise<{ version: string; exportedAt: string; tasks: Task[]; boards: Board[]; settings: Settings | null; }> {
    const [tasks, boards, settings] = await Promise.all([
      this.getTasks(),
      this.getBoards(),
      this.getSettings(),
    ]);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks,
      boards,
      settings,
    };
  }

  async importData(data: { tasks?: Task[]; boards?: Board[]; settings?: Settings; }): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    // Use a single transaction for atomicity — all-or-nothing
    const storeNames = ['tasks', 'boards', 'settings'] as const;
    const transaction = db.transaction([...storeNames], 'readwrite');

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      // Clear all stores first
      for (const storeName of storeNames) {
        transaction.objectStore(storeName).clear();
      }

      // Import new data within the same transaction
      if (data.tasks) {
        const taskStore = transaction.objectStore('tasks');
        for (const task of data.tasks) {
          taskStore.add(task);
        }
      }

      if (data.boards) {
        const boardStore = transaction.objectStore('boards');
        for (const board of data.boards) {
          boardStore.add(board);
        }
      }

      if (data.settings) {
        transaction.objectStore('settings').put({ id: 'default', ...data.settings });
      }
    });
  }

  async resetDatabase(): Promise<void> {
    await this.clearAll();
  }

  private async clearAll(): Promise<void> {
    const db = this.db;
    if (!db) throw new Error('Database not initialized');

    // Use a single transaction for atomicity
    const storeNames = ['tasks', 'boards', 'settings'];
    const transaction = db.transaction(storeNames, 'readwrite');

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      for (const storeName of storeNames) {
        transaction.objectStore(storeName).clear();
      }
    });
  }
}

export const taskDB = new TaskDatabase();
