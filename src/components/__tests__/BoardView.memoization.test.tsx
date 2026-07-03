import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoardView } from '../BoardView';
import { useBoardStore } from '@/lib/stores/boardStore';
import { useTaskStore } from '@/lib/stores/taskStore';
import type { Board, Task, TaskFilters, SearchState } from '@/lib/types';

// This file exists to test one specific property that BoardView.integration.test.tsx
// doesn't: whether `displayTasks`/`boardGroups` keep a stable reference across
// re-renders when the underlying store data hasn't changed. That requires
// mocking board/KanbanBoard to capture the props it's called with, which the
// integration test deliberately doesn't do (it renders the real one).
const mocks = vi.hoisted(() => ({ kanbanBoardProps: vi.fn() }));

vi.mock('@/lib/stores/boardStore');
vi.mock('@/lib/stores/taskStore');

vi.mock('next/dynamic', () => ({
  default: () => {
    return ({ children }: { children: React.ReactNode }) => children;
  },
}));

vi.mock('../DragDropProvider', () => ({
  DragDropProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../board/KanbanBoard', () => ({
  KanbanBoard: (props: { tasks: Task[] }) => {
    mocks.kanbanBoardProps(props.tasks);
    return <div data-testid="kanban-board" />;
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const now = new Date('2026-01-15T12:00:00.000Z');

const board: Board = {
  id: 'board-1',
  name: 'Work',
  color: '#2563eb',
  isDefault: true,
  order: 0,
  createdAt: now,
  updatedAt: now,
};

const tasks: Task[] = [
  { id: 'task-1', title: 'Task 1', status: 'todo', boardId: 'board-1', priority: 'medium', tags: [], createdAt: now, updatedAt: now },
  { id: 'task-2', title: 'Task 2', status: 'todo', boardId: 'board-1', priority: 'medium', tags: [], createdAt: now, updatedAt: now },
];

const filters: TaskFilters = { search: '', tags: [], crossBoardSearch: false };
const searchState: SearchState = { scope: 'current-board', highlightedTaskId: undefined };

describe('BoardView memoization', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useBoardStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      currentBoardId: 'board-1',
      getCurrentBoard: () => board,
      boards: [board],
      selectBoard: vi.fn(),
    });

    (useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      filteredTasks: tasks,
      filters,
      searchState,
      isLoading: false,
      error: null,
      setHighlightedTask: vi.fn(),
      clearSearch: vi.fn(),
    });
  });

  it('passes the same displayTasks array reference to KanbanBoard across re-renders when nothing relevant changed', () => {
    const { rerender } = render(<BoardView />);

    expect(mocks.kanbanBoardProps).toHaveBeenCalledTimes(1);
    const firstTasksArg = mocks.kanbanBoardProps.mock.calls[0][0];

    // Same store state, same content — a re-render with unrelated cause
    // (e.g. a parent state change) shouldn't force BoardView to recompute
    // and hand KanbanBoard a brand-new array reference.
    rerender(<BoardView />);

    expect(mocks.kanbanBoardProps).toHaveBeenCalledTimes(2);
    const secondTasksArg = mocks.kanbanBoardProps.mock.calls[1][0];

    expect(secondTasksArg).toBe(firstTasksArg);
  });

  it('computes a new displayTasks reference when the underlying tasks actually change', () => {
    const { rerender } = render(<BoardView />);
    const firstTasksArg = mocks.kanbanBoardProps.mock.calls[0][0];

    const updatedTasks = [...tasks, {
      id: 'task-3', title: 'Task 3', status: 'todo' as const, boardId: 'board-1',
      priority: 'medium' as const, tags: [], createdAt: now, updatedAt: now,
    }];
    (useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      filteredTasks: updatedTasks,
      filters,
      searchState,
      isLoading: false,
      error: null,
      setHighlightedTask: vi.fn(),
      clearSearch: vi.fn(),
    });

    rerender(<BoardView />);
    const secondTasksArg = mocks.kanbanBoardProps.mock.calls[1][0];

    expect(secondTasksArg).not.toBe(firstTasksArg);
    expect(secondTasksArg).toHaveLength(3);
  });
});
