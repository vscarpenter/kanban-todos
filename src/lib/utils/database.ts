import { Task, Board, Settings, TaskAttachment, StorageQuota } from '@/lib/types';

const DB_NAME = 'cascade-tasks';
const DB_VERSION = 2;

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
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Existing stores (v1)
        if (oldVersion < 1) {
          // Create object stores
          if (!db.objectStoreNames.contains('tasks')) {
            const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
            taskStore.createIndex('boardId', 'boardId', { unique: false });
            taskStore.createIndex('status', 'status', { unique: false });
            taskStore.createIndex('archivedAt', 'archivedAt', { unique: false });
            taskStore.createIndex('dueDate', 'dueDate', { unique: false });
          }

          if (!db.objectStoreNames.contains('boards')) {
            const boardStore = db.createObjectStore('boards', { keyPath: 'id' });
            boardStore.createIndex('isDefault', 'isDefault', { unique: false });
            boardStore.createIndex('order', 'order', { unique: false });
          }

          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains('archive')) {
            const archiveStore = db.createObjectStore('archive', { keyPath: 'id' });
            archiveStore.createIndex('archivedAt', 'archivedAt', { unique: false });
          }
        }

        // New stores (v2) - Attachments
        if (oldVersion < 2) {
          // Attachment metadata store
          if (!db.objectStoreNames.contains('attachments')) {
            const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
            attachmentStore.createIndex('taskId', 'taskId', { unique: false });
            attachmentStore.createIndex('fileType', 'fileType', { unique: false });
            attachmentStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          }

          // File data store (separate for performance)
          if (!db.objectStoreNames.contains('attachment_files')) {
            db.createObjectStore('attachment_files', { keyPath: 'id' });
          }

          // Storage quota tracking
          if (!db.objectStoreNames.contains('storage_info')) {
            db.createObjectStore('storage_info', { keyPath: 'id' });
          }
        }
      };
    });
  }

  async getTasks(boardId?: string): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let tasks = request.result;
        if (boardId) {
          tasks = tasks.filter((task: Task) => task.boardId === boardId);
        }
        resolve(tasks);
      };
    });
  }

  async addTask(task: Task): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.add(task);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateTask(task: Task): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.put(task);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tasks'], 'readwrite');
      const store = transaction.objectStore('tasks');
      const request = store.delete(taskId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getBoards(): Promise<Board[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readonly');
      const store = transaction.objectStore('boards');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async addBoard(board: Board): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.add(board);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateBoard(board: Board): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.put(board);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteBoard(boardId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['boards'], 'readwrite');
      const store = transaction.objectStore('boards');
      const request = store.delete(boardId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSettings(): Promise<Settings | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('default');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateSettings(settings: Settings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ id: 'default', ...settings });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async exportData(): Promise<{ version: string; exportedAt: string; tasks: Task[]; boards: Board[]; settings: Settings | null; }> {
    const tasks = await this.getTasks();
    const boards = await this.getBoards();
    const settings = await this.getSettings();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks,
      boards,
      settings,
    };
  }

  async importData(data: { tasks?: Task[]; boards?: Board[]; settings?: Settings; }): Promise<void> {
    // Clear existing data
    await this.clearAll();

    // Import new data
    if (data.tasks) {
      for (const task of data.tasks) {
        await this.addTask(task);
      }
    }

    if (data.boards) {
      for (const board of data.boards) {
        await this.addBoard(board);
      }
    }

    if (data.settings) {
      await this.updateSettings(data.settings);
    }
  }

  // Attachment methods
  async addAttachment(attachment: TaskAttachment, fileData: ArrayBuffer): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['attachments', 'attachment_files'], 'readwrite');
    
    try {
      // Store metadata
      const attachmentStore = transaction.objectStore('attachments');
      await this.promisifyRequest(attachmentStore.add(attachment));

      // Store file data
      const fileStore = transaction.objectStore('attachment_files');
      await this.promisifyRequest(fileStore.add({
        id: attachment.id,
        data: fileData
      }));

      await this.promisifyTransaction(transaction);
    } catch (error) {
      transaction.abort();
      throw error;
    }
  }

  async getAttachment(attachmentId: string): Promise<TaskAttachment | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['attachments'], 'readonly');
    const store = transaction.objectStore('attachments');
    
    return this.promisifyRequest(store.get(attachmentId));
  }

  async getAttachmentFile(attachmentId: string): Promise<ArrayBuffer | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['attachment_files'], 'readonly');
    const store = transaction.objectStore('attachment_files');
    
    const result = await this.promisifyRequest(store.get(attachmentId));
    return result?.data || null;
  }

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['attachments'], 'readonly');
    const store = transaction.objectStore('attachments');
    const index = store.index('taskId');
    
    return this.promisifyRequest(index.getAll(taskId));
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['attachments', 'attachment_files'], 'readwrite');
    
    try {
      const attachmentStore = transaction.objectStore('attachments');
      const fileStore = transaction.objectStore('attachment_files');
      
      await this.promisifyRequest(attachmentStore.delete(attachmentId));
      await this.promisifyRequest(fileStore.delete(attachmentId));
      
      await this.promisifyTransaction(transaction);
    } catch (error) {
      transaction.abort();
      throw error;
    }
  }

  async getAllAttachments(): Promise<TaskAttachment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['attachments'], 'readonly');
    const store = transaction.objectStore('attachments');
    
    return this.promisifyRequest(store.getAll());
  }

  async getStorageInfo(): Promise<StorageQuota> {
    const estimate = await navigator.storage?.estimate() || { usage: 0, quota: 0 };
    const attachmentSize = await this.calculateAttachmentStorage();
    
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
      percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
      attachmentSize
    };
  }

  private async calculateAttachmentStorage(): Promise<number> {
    try {
      const attachments = await this.getAllAttachments();
      return attachments.reduce((total, att) => total + att.fileSize, 0);
    } catch {
      return 0;
    }
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private promisifyTransaction(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async resetDatabase(): Promise<void> {
    await this.clearAll();
  }

  private async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = ['tasks', 'boards', 'settings', 'archive', 'attachments', 'attachment_files', 'storage_info'];
    
    for (const storeName of stores) {
      if (this.db.objectStoreNames.contains(storeName)) {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      }
    }
  }
}

export const taskDB = new TaskDatabase();
