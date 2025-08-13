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
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  progress?: number; // Progress percentage (0-100), only for 'in-progress' tasks
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
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
