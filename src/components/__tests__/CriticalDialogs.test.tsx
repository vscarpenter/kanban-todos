import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppResetDialog } from '@/components/AppResetDialog';
import { BoardDeleteDialog } from '@/components/BoardDeleteDialog';
import { ExportDialog } from '@/components/ExportDialog';
import { ImportDialog } from '@/components/ImportDialog';
import { MoveTaskDialog } from '@/components/MoveTaskDialog';
import type { Board, Settings, Task } from '@/lib/types';

const mocks = vi.hoisted(() => ({
  useTaskStore: vi.fn(),
  useBoardStore: vi.fn(),
  useSettingsStore: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  previewImportData: vi.fn(),
  prepareImport: vi.fn(),
  readJsonFile: vi.fn(),
  detectImportConflicts: vi.fn(),
  processAdvancedImport: vi.fn(),
  validateAndSanitizeExport: vi.fn(),
  exportData: vi.fn(),
  downloadAsJson: vi.fn(),
  generateExportFilename: vi.fn(),
}));

vi.mock('@/lib/stores/taskStore', () => ({
  useTaskStore: mocks.useTaskStore,
}));

vi.mock('@/lib/stores/boardStore', () => ({
  useBoardStore: mocks.useBoardStore,
}));

vi.mock('@/lib/stores/settingsStore', () => ({
  useSettingsStore: mocks.useSettingsStore,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('@/lib/utils/fileHandling', () => ({
  previewImportData: mocks.previewImportData,
  prepareImport: mocks.prepareImport,
  readJsonFile: mocks.readJsonFile,
}));

vi.mock('@/lib/utils/exportImport', () => ({
  detectImportConflicts: mocks.detectImportConflicts,
  processAdvancedImport: mocks.processAdvancedImport,
  validateAndSanitizeExport: mocks.validateAndSanitizeExport,
  exportData: mocks.exportData,
  downloadAsJson: mocks.downloadAsJson,
  generateExportFilename: mocks.generateExportFilename,
}));

const now = new Date('2026-01-15T12:00:00.000Z');

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Move quarterly plan',
  status: 'todo',
  boardId: 'board-1',
  priority: 'medium',
  tags: [],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const makeBoard = (overrides: Partial<Board> = {}): Board => ({
  id: 'board-1',
  name: 'Work',
  color: '#2563eb',
  isDefault: false,
  order: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const settings: Settings = {
  theme: 'system',
  autoArchiveDays: 30,
  enableNotifications: true,
  enableKeyboardShortcuts: true,
  searchPreferences: {
    defaultScope: 'current-board',
    rememberScope: true,
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    fontSize: 'medium',
  },
};

describe('critical dialog flows', () => {
  let taskStore: {
    tasks: Task[];
    deleteBoard?: never;
    deleteTask: ReturnType<typeof vi.fn>;
    unarchiveTask: ReturnType<typeof vi.fn>;
    moveTaskToBoard: ReturnType<typeof vi.fn>;
    importTasks: ReturnType<typeof vi.fn>;
  };
  let boardStore: {
    boards: Board[];
    deleteBoard: ReturnType<typeof vi.fn>;
    importBoards: ReturnType<typeof vi.fn>;
  };
  let settingsStore: {
    settings: Settings;
    importSettings: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    taskStore = {
      tasks: [
        makeTask(),
        makeTask({ id: 'task-2', title: 'Archived task', archivedAt: now }),
      ],
      deleteTask: vi.fn().mockResolvedValue(undefined),
      unarchiveTask: vi.fn().mockResolvedValue(undefined),
      moveTaskToBoard: vi.fn().mockResolvedValue(undefined),
      importTasks: vi.fn().mockResolvedValue(undefined),
    };
    boardStore = {
      boards: [
        makeBoard(),
        makeBoard({ id: 'board-2', name: 'Personal', isDefault: true, order: 1 }),
        makeBoard({ id: 'archived-board', name: 'Archived', archivedAt: now, order: 2 }),
      ],
      deleteBoard: vi.fn().mockResolvedValue(undefined),
      importBoards: vi.fn().mockResolvedValue(undefined),
    };
    settingsStore = {
      settings,
      importSettings: vi.fn().mockResolvedValue(undefined),
    };

    mocks.useTaskStore.mockReturnValue(taskStore);
    mocks.useBoardStore.mockReturnValue(boardStore);
    mocks.useSettingsStore.mockReturnValue(settingsStore);
    mocks.generateExportFilename.mockReturnValue('cascade-full-export-2026-01-15.json');
    mocks.validateAndSanitizeExport.mockReturnValue({
      exportData: { version: '1.0.0', exportedAt: now.toISOString(), tasks: [], boards: [] },
      validationResult: { isValid: true, errors: [], warnings: [] },
      sanitizationLog: [],
    });
    mocks.exportData.mockReturnValue({
      version: '1.0.0',
      exportedAt: now.toISOString(),
      tasks: [],
      boards: [],
    });
  });

  it('requires the second confirmation before resetting the whole app', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <AppResetDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /continue to reset/i }));

    expect(screen.getByRole('heading', { name: /final confirmation/i })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /reset everything/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks default board deletion and does not render a destructive action', () => {
    render(
      <BoardDeleteDialog
        open
        onOpenChange={vi.fn()}
        board={makeBoard({ id: 'board-2', name: 'Personal', isDefault: true })}
      />
    );

    expect(screen.getByText(/cannot delete default board/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/type .* to confirm deletion/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete board$/i })).not.toBeInTheDocument();
  });

  it('requires the exact board name before deleting a non-default board', async () => {
    const onOpenChange = vi.fn();

    render(
      <BoardDeleteDialog
        open
        onOpenChange={onOpenChange}
        board={makeBoard({ id: 'board-3', name: 'Client Work' })}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /^delete board$/i });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/type .* to confirm deletion/i), {
      target: { value: 'client work' },
    });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/type .* to confirm deletion/i), {
      target: { value: 'Client Work' },
    });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(boardStore.deleteBoard).toHaveBeenCalledWith('board-3');
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('confirms a successful board deletion with a toast', async () => {
    render(
      <BoardDeleteDialog
        open
        onOpenChange={vi.fn()}
        board={makeBoard({ id: 'board-3', name: 'Client Work' })}
      />
    );

    fireEvent.change(screen.getByLabelText(/type .* to confirm deletion/i), {
      target: { value: 'Client Work' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^delete board$/i }));

    await waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith('Board deleted');
    });
  });

  it('shows an error toast and keeps the dialog open when deletion fails, instead of reporting false success', async () => {
    const onOpenChange = vi.fn();
    boardStore.deleteBoard.mockRejectedValueOnce(new Error('IndexedDB write failed'));

    render(
      <BoardDeleteDialog
        open
        onOpenChange={onOpenChange}
        board={makeBoard({ id: 'board-3', name: 'Client Work' })}
      />
    );

    fireEvent.change(screen.getByLabelText(/type .* to confirm deletion/i), {
      target: { value: 'Client Work' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^delete board$/i }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('Failed to delete board: IndexedDB write failed');
    });
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('uses an explicit confirmation step before moving a task to the default board', async () => {
    const onOpenChange = vi.fn();

    render(
      <MoveTaskDialog
        open
        onOpenChange={onOpenChange}
        task={makeTask({ id: 'task-9', title: 'Pay invoice', boardId: 'board-1' })}
      />
    );

    fireEvent.click(screen.getByText('Personal'));
    fireEvent.click(screen.getByRole('button', { name: /^move task$/i }));

    expect(screen.getByRole('heading', { name: /confirm move/i })).toBeInTheDocument();
    expect(taskStore.moveTaskToBoard).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /confirm move/i }));

    await waitFor(() => {
      expect(taskStore.moveTaskToBoard).toHaveBeenCalledWith('task-9', 'board-2');
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Task moved to "Personal"');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not export when validation fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.validateAndSanitizeExport.mockReturnValueOnce({
      exportData: { version: '1.0.0', exportedAt: now.toISOString(), tasks: [], boards: [] },
      validationResult: {
        isValid: false,
        errors: [{ message: 'Task title is required' }],
        warnings: [],
      },
      sanitizationLog: [],
    });

    render(<ExportDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^export data$/i }));

    await waitFor(() => {
      expect(screen.getByText('Task title is required')).toBeInTheDocument();
    });
    expect(screen.getByText('Export validation failed')).toBeInTheDocument();
    expect(mocks.downloadAsJson).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('exports the selected data with the generated filename when validation passes', async () => {
    render(<ExportDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^export data$/i }));

    await waitFor(() => {
      expect(mocks.downloadAsJson).toHaveBeenCalledWith(
        {
          version: '1.0.0',
          exportedAt: now.toISOString(),
          tasks: [],
          boards: [],
        },
        'cascade-full-export-2026-01-15.json'
      );
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Export Successful',
      expect.objectContaining({
        description: expect.stringContaining('cascade-full-export-2026-01-15.json'),
      })
    );
  });

  it('stops at conflict resolution instead of importing when import data conflicts are detected', async () => {
    const importData = {
      version: '1.0.0',
      exportedAt: now.toISOString(),
      tasks: [],
      boards: [],
    };
    const file = new File(['{}'], 'backup.json', { type: 'application/json' });

    mocks.prepareImport.mockResolvedValueOnce({
      success: true,
      preview: {
        taskCount: 1,
        boardCount: 1,
        hasSettings: true,
        exportedAt: '2026-01-15',
        version: '1.0.0',
        fileSize: '1 KB',
      },
      data: importData,
      validation: { warnings: [] },
      conflicts: {
        duplicateTaskIds: ['task-1'],
        duplicateBoardIds: [],
        defaultBoardConflicts: [],
      },
      hasConflicts: true,
    });

    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const fileInput = document.querySelector('#import-file-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText('backup.json')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /review import/i }));
    fireEvent.click(screen.getByRole('button', { name: /start import/i }));

    expect(await screen.findAllByRole('heading', { name: /resolve conflicts/i })).toHaveLength(2);
    expect(screen.getByText(/1 task\(s\) with matching ids/i)).toBeInTheDocument();
    expect(mocks.processAdvancedImport).not.toHaveBeenCalled();
    expect(taskStore.importTasks).not.toHaveBeenCalled();
  });
});
