import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchiveDialog } from '@/components/ArchiveDialog';
import { CreateBoardDialog } from '@/components/CreateBoardDialog';
import { GlobalHotkeys } from '@/components/GlobalHotkeys';
import InstallPWA from '@/components/InstallPWA';
import PwaUpdater from '@/components/PwaUpdater';
import type { Board, Task } from '@/lib/types';
import type { KeyboardShortcut } from '@/lib/utils/keyboard';

const mocks = vi.hoisted(() => ({
  useTaskStore: vi.fn(),
  useBoardStore: vi.fn(),
  useSettingsStore: vi.fn(),
  registerShortcut: vi.fn(),
  startListening: vi.fn(),
  stopListening: vi.fn(),
  toastError: vi.fn(),
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

vi.mock('@/lib/utils/keyboard', () => ({
  keyboardManager: {
    registerShortcut: mocks.registerShortcut,
    startListening: mocks.startListening,
    stopListening: mocks.stopListening,
  },
}));

vi.mock('next/dynamic', () => ({
  default: () => function DynamicTaskDialog(props: { open: boolean; boardId: string }) {
    return props.open ? <div data-testid="quick-add-dialog" data-board-id={props.boardId} /> : null;
  },
}));

vi.mock('@/components/board/BoardAppearancePicker', () => ({
  BoardAppearancePicker: ({
    onIconChange,
    onDotChange,
  }: {
    onIconChange: (icon: 'kanban') => void;
    onDotChange: (color: 'emerald') => void;
  }) => (
    <div>
      <button type="button" onClick={() => onIconChange('kanban')}>Choose Kanban Icon</button>
      <button type="button" onClick={() => onDotChange('emerald')}>Choose Emerald Dot</button>
    </div>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
  },
}));

const date = new Date('2026-01-15T12:00:00.000Z');

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Archived planning task',
  description: 'Quarterly planning details',
  status: 'done',
  boardId: 'board-1',
  priority: 'high',
  tags: ['planning'],
  createdAt: date,
  updatedAt: date,
  archivedAt: date,
  ...overrides,
});

const makeBoard = (overrides: Partial<Board> = {}): Board => ({
  id: 'board-1',
  name: 'Work',
  color: '#2563eb',
  isDefault: false,
  order: 0,
  createdAt: date,
  updatedAt: date,
  ...overrides,
});

function getRegisteredShortcut(description: string): KeyboardShortcut {
  const shortcut = mocks.registerShortcut.mock.calls
    .map(([registered]) => registered as KeyboardShortcut)
    .find((registered) => registered.description === description);

  if (!shortcut) throw new Error(`Missing shortcut: ${description}`);
  return shortcut;
}

function setNavigatorValue<K extends keyof Navigator>(key: K, value: Navigator[K]) {
  Object.defineProperty(window.navigator, key, {
    value,
    configurable: true,
  });
}

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    configurable: true,
  });
}

describe('UI dialog and browser surfaces', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mocks.useTaskStore.mockReturnValue({
      tasks: [
        makeTask(),
        makeTask({
          id: 'task-2',
          title: 'Hidden active task',
          status: 'todo',
          archivedAt: undefined,
          tags: [],
        }),
      ],
      unarchiveTask: vi.fn().mockResolvedValue(undefined),
      deleteTask: vi.fn().mockResolvedValue(undefined),
    });
    mocks.useBoardStore.mockReturnValue({
      boards: [makeBoard(), makeBoard({ id: 'board-2', name: 'Personal', order: 1 })],
      currentBoardId: 'board-1',
      selectBoard: vi.fn(),
      addBoard: vi.fn().mockResolvedValue(undefined),
    });
    mocks.useSettingsStore.mockReturnValue({
      settings: {
        enableKeyboardShortcuts: true,
      },
    });

    setMatchMedia(false);
    setNavigatorValue('userAgent', 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36');
    setNavigatorValue('vendor', 'Google Inc.');
  });

  it('filters archived tasks and restores the selected task', async () => {
    const taskStore = {
      tasks: [
        makeTask(),
        makeTask({
          id: 'task-3',
          title: 'Budget cleanup',
          description: 'Finance details',
          tags: ['finance'],
        }),
      ],
      unarchiveTask: vi.fn().mockResolvedValue(undefined),
      deleteTask: vi.fn().mockResolvedValue(undefined),
    };
    mocks.useTaskStore.mockReturnValue(taskStore);

    render(<ArchiveDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByText('Archived planning task')).toBeInTheDocument();
    expect(screen.getByText('Budget cleanup')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search archived tasks/i), {
      target: { value: 'finance' },
    });

    expect(screen.queryByText('Archived planning task')).not.toBeInTheDocument();
    expect(screen.getByText('Budget cleanup')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Restore task'));

    await waitFor(() => {
      expect(taskStore.unarchiveTask).toHaveBeenCalledWith('task-3');
    });
  });

  it('permanently deletes an archived task only after dialog confirmation', async () => {
    const taskStore = mocks.useTaskStore();

    render(<ArchiveDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Delete permanently'));

    expect(screen.getByRole('heading', { name: /permanently delete task/i })).toBeInTheDocument();
    expect(taskStore.deleteTask).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^permanently delete$/i }));

    await waitFor(() => {
      expect(taskStore.deleteTask).toHaveBeenCalledWith('task-1');
    });
  });

  it('creates a board with trimmed values and selected appearance', async () => {
    const boardStore = mocks.useBoardStore();
    const onOpenChange = vi.fn();

    render(<CreateBoardDialog open onOpenChange={onOpenChange} />);

    const submit = screen.getByRole('button', { name: /create board/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/board name/i), {
      target: { value: '  Launch Board  ' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: '  Go-to-market work  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /choose kanban icon/i }));
    fireEvent.click(screen.getByRole('button', { name: /choose emerald dot/i }));
    fireEvent.click(submit);

    await waitFor(() => {
      expect(boardStore.addBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Launch Board',
          description: 'Go-to-market work',
          iconKey: 'kanban',
          dotColor: 'emerald',
          isDefault: false,
          order: 0,
        })
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('registers enabled global hotkeys and runs their actions', () => {
    const boardStore = mocks.useBoardStore();
    const showSettings = vi.fn();
    document.addEventListener('show-settings-dialog', showSettings);

    const { unmount } = render(<GlobalHotkeys />);

    expect(mocks.startListening).toHaveBeenCalledTimes(1);
    expect(getRegisteredShortcut('Quick add task')).toEqual(expect.objectContaining({ key: 'k', ctrl: true }));
    expect(getRegisteredShortcut('Switch to board 2')).toEqual(expect.objectContaining({ key: '2', ctrl: true }));

    act(() => {
      getRegisteredShortcut('Quick add task').action();
    });
    expect(screen.getByTestId('quick-add-dialog')).toHaveAttribute('data-board-id', 'board-1');

    getRegisteredShortcut('Switch to board 2').action();
    expect(boardStore.selectBoard).toHaveBeenCalledWith('board-2');

    getRegisteredShortcut('Open settings').action();
    expect(showSettings).toHaveBeenCalledTimes(1);

    unmount();
    expect(mocks.stopListening).toHaveBeenCalledTimes(1);
    document.removeEventListener('show-settings-dialog', showSettings);
  });

  it('does not register hotkeys when keyboard shortcuts are disabled', () => {
    mocks.useSettingsStore.mockReturnValue({
      settings: {
        enableKeyboardShortcuts: false,
      },
    });

    render(<GlobalHotkeys />);

    expect(mocks.registerShortcut).not.toHaveBeenCalled();
    expect(mocks.startListening).not.toHaveBeenCalled();
  });

  it('shows the install prompt from beforeinstallprompt and records dismissal', async () => {
    render(<InstallPWA />);

    const promptEvent = Object.assign(new Event('beforeinstallprompt'), {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    fireEvent(window, promptEvent);

    expect(await screen.findByRole('dialog', { name: /install cascade/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /install now/i }));

    await waitFor(() => {
      expect(promptEvent.prompt).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole('dialog', { name: /install cascade/i })).not.toBeInTheDocument();
  });

  it('suppresses the install prompt after a recent dismissal', () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());

    render(<InstallPWA />);

    const promptEvent = Object.assign(new Event('beforeinstallprompt'), {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    fireEvent(window, promptEvent);

    expect(screen.queryByRole('dialog', { name: /install cascade/i })).not.toBeInTheDocument();
  });

  it('shows a reload prompt when a service worker update is waiting', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const waitingWorker = {
      postMessage: vi.fn(),
    };
    const registration = {
      waiting: waitingWorker,
      installing: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const serviceWorker = {
      controller: {},
      register: vi.fn().mockResolvedValue(registration),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: serviceWorker,
      configurable: true,
    });

    render(<PwaUpdater />);

    expect(await screen.findByRole('status')).toHaveTextContent(/update available/i);

    fireEvent.click(screen.getByRole('button', { name: /reload/i }));

    expect(serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
});
