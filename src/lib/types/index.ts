export interface TaskAttachment {
  id: string;
  fileName: string;          // sanitized filename for storage
  originalName: string;      // user's original filename
  fileType: string;          // MIME type
  fileSize: number;          // bytes
  uploadedAt: Date;
  taskId: string;
  thumbnail?: string;        // base64 thumbnail for images (max 10KB)
  metadata?: {
    width?: number;          // for images
    height?: number;         // for images
    pageCount?: number;      // for PDFs
    description?: string;    // user-provided description
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  archivedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  progress?: number; // Progress percentage (0-100), only for 'in-progress' tasks
  attachments?: TaskAttachment[];
  attachmentCount?: number;  // denormalized for performance
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  autoArchiveDays: number;
  enableNotifications: boolean;
  enableKeyboardShortcuts: boolean;
  enableDebugMode: boolean;
  currentBoardId?: string; // Persist current board selection
  accessibility: {
    highContrast: boolean;
    reduceMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export interface TaskFilters {
  search: string;
  status?: Task['status'];
  priority?: Task['priority'];
  tags: string[];
  boardId?: string; // Filter by board
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ArchiveEntry {
  task: Task;
  archivedAt: Date;
  archivedBy: 'manual' | 'auto';
  reason?: string;
}

export interface StorageQuota {
  used: number;
  available: number;
  percentage: number;
  attachmentSize: number;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
  warnings?: string[];
}
