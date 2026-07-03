import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardsList } from '@/components/sidebar/BoardsList';
import type { Board, Task } from '@/lib/types';

// BoardsList renders real BoardItem rows (each of which renders the real
// BoardMenu "..." trigger), so the store hooks reached by that composition
// are the external boundary that needs mocking, not the child components.
const mocks = vi.hoisted(() => ({
  useBoardStore: vi.fn(),
  useTaskStore: vi.fn(),
}));

vi.mock('@/lib/stores/boardStore', () => ({
  useBoardStore: mocks.useBoardStore,
}));

vi.mock('@/lib/stores/taskStore', () => ({
  useTaskStore: mocks.useTaskStore,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const now = new Date('2026-01-15T12:00:00.000Z');

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

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Some task',
  status: 'todo',
  boardId: 'board-1',
  priority: 'medium',
  tags: [],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('BoardsList', () => {
  let selectBoard: ReturnType<typeof vi.fn>;
  let reorderBoard: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    selectBoard = vi.fn().mockResolvedValue(undefined);
    reorderBoard = vi.fn().mockResolvedValue(undefined);

    mocks.useBoardStore.mockReturnValue({
      boards: [
        makeBoard({ id: 'board-1', name: 'Work', order: 0 }),
        makeBoard({ id: 'board-2', name: 'Personal', order: 1 }),
        makeBoard({ id: 'board-3', name: 'Side Project', order: 2 }),
      ],
      currentBoardId: 'board-2',
      selectBoard,
      reorderBoard,
      duplicateBoard: vi.fn().mockResolvedValue(undefined),
      updateBoard: vi.fn().mockResolvedValue(undefined),
      deleteBoard: vi.fn().mockResolvedValue(undefined),
    });

    mocks.useTaskStore.mockReturnValue({
      tasks: [
        makeTask({ id: 't1', boardId: 'board-1' }),
        makeTask({ id: 't2', boardId: 'board-1' }),
        makeTask({ id: 't3', boardId: 'board-1', archivedAt: now }), // archived, excluded
        makeTask({ id: 't4', boardId: 'board-2' }),
      ],
    });
  });

  it('renders the "Boards" section label and one row per board', () => {
    render(<BoardsList onCreateBoard={vi.fn()} />);

    expect(screen.getByText('Boards')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Side Project')).toBeInTheDocument();
  });

  it('computes each task count from non-archived tasks belonging to that board', () => {
    render(<BoardsList onCreateBoard={vi.fn()} />);

    // board-1 has 2 active + 1 archived task -> count should be 2, not 3.
    const workRow = screen.getByText('Work').closest('[role="button"]') as HTMLElement;
    expect(workRow).toHaveTextContent('2');

    // board-2 has exactly 1 task.
    const personalRow = screen.getByText('Personal').closest('[role="button"]') as HTMLElement;
    expect(personalRow).toHaveTextContent('1');

    // board-3 has no tasks at all.
    const sideProjectRow = screen.getByText('Side Project').closest('[role="button"]') as HTMLElement;
    expect(sideProjectRow).toHaveTextContent('0');
  });

  it('calls onCreateBoard when the add-board button is clicked', () => {
    const onCreateBoard = vi.fn();
    render(<BoardsList onCreateBoard={onCreateBoard} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add board' }));

    expect(onCreateBoard).toHaveBeenCalledTimes(1);
  });

  it('marks the board matching currentBoardId as active and leaves the others inactive', () => {
    render(<BoardsList onCreateBoard={vi.fn()} />);

    const activeRow = screen.getByText('Personal').closest('[role="button"]') as HTMLElement;
    const inactiveRow = screen.getByText('Work').closest('[role="button"]') as HTMLElement;

    expect(activeRow).toHaveClass('sidebar-item--active');
    expect(inactiveRow).not.toHaveClass('sidebar-item--active');
  });

  it('calls the store\'s selectBoard with the clicked board id', () => {
    render(<BoardsList onCreateBoard={vi.fn()} />);

    fireEvent.click(screen.getByText('Side Project'));

    expect(selectBoard).toHaveBeenCalledWith('board-3');
  });

  it('calls the store\'s reorderBoard with the board id and direction for the middle row', () => {
    render(<BoardsList onCreateBoard={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move Personal up' }));
    expect(reorderBoard).toHaveBeenCalledWith('board-2', 'up');

    fireEvent.click(screen.getByRole('button', { name: 'Move Personal down' }));
    expect(reorderBoard).toHaveBeenCalledWith('board-2', 'down');
  });

  it('disables moving the first board up and the last board down', () => {
    render(<BoardsList onCreateBoard={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Move Work up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Side Project down' })).toBeDisabled();

    // The middle board can move either direction.
    expect(screen.getByRole('button', { name: 'Move Personal up' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move Personal down' })).toBeEnabled();
  });
});
