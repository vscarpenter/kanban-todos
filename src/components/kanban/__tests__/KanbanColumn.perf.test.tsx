import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import KanbanColumn from '../KanbanColumn';
import type { Board, Task } from '@/lib/types';

// This file exists to test one specific property KanbanColumn.test.tsx doesn't
// cover: whether the per-task board lookup is skipped entirely when its
// result would never be used (showBoardIndicator/isCrossBoardSearch is
// false), rather than being computed and then just not read by TaskCard.

const mockUseDroppable = vi.fn();
const mockUseDndContext = vi.fn();
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@dnd-kit/core');
  return {
    ...actual,
    useDroppable: (...args: unknown[]) => mockUseDroppable(...args),
    useDndContext: (...args: unknown[]) => mockUseDndContext(...args),
  };
});

vi.mock('../TaskCard', () => ({
  __esModule: true,
  default: () => null,
}));

const now = new Date('2026-01-15T12:00:00.000Z');

const board: Board = {
  id: 'board-1', name: 'Work', color: '#2563eb', isDefault: true,
  order: 0, createdAt: now, updatedAt: now,
};

const task: Task = {
  id: 'task-1', title: 'Task 1', status: 'todo', boardId: 'board-1',
  priority: 'medium', tags: [], createdAt: now, updatedAt: now,
};

// Tracks whether anything on the boards array was ever read.
function createTrackedBoards(items: Board[]): { boards: Board[]; wasAccessed: () => boolean } {
  let accessed = false;
  const proxy = new Proxy(items, {
    get(target, prop, receiver) {
      accessed = true;
      return Reflect.get(target, prop, receiver);
    },
  });
  return { boards: proxy, wasAccessed: () => accessed };
}

beforeEach(() => {
  mockUseDroppable.mockReturnValue({ setNodeRef: vi.fn(), isOver: false });
  mockUseDndContext.mockReturnValue({ active: null });
});

describe('KanbanColumn board-lookup cost', () => {
  it('never reads the boards array when the board indicator would not be shown', () => {
    const { boards, wasAccessed } = createTrackedBoards([board]);

    render(
      <KanbanColumn
        title="To Do"
        tasks={[task]}
        status="todo"
        boards={boards}
        currentBoardId="board-1"
        isCrossBoardSearch={false}
      />
    );

    expect(wasAccessed()).toBe(false);
  });

  it('does read the boards array when cross-board search needs the indicator', () => {
    const { boards, wasAccessed } = createTrackedBoards([board]);

    render(
      <KanbanColumn
        title="To Do"
        tasks={[task]}
        status="todo"
        boards={boards}
        currentBoardId="board-2"
        isCrossBoardSearch={true}
      />
    );

    expect(wasAccessed()).toBe(true);
  });
});
