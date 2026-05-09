import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import KanbanColumn from '../KanbanColumn';
import { Task } from '@/lib/types';
import { useBoardStore } from '@/lib/stores/boardStore';
import { useTaskStore } from '@/lib/stores/taskStore';

// Mock dnd-kit so we can drive `isOver` and the active-drag context from tests.
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

// TaskCard pulls in stores it doesn't need for placeholder coverage. The
// kanban column tests below render with empty task arrays so this never fires.
vi.mock('../TaskCard', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('@/lib/stores/boardStore');
vi.mock('@/lib/stores/taskStore');

function setStores() {
  (useBoardStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    boards: [],
    currentBoardId: 'board-1',
  });
  (useTaskStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    filters: { search: '', crossBoardSearch: false },
    searchState: { highlightedTaskId: undefined },
  });
}

function setNoActiveDrag() {
  mockUseDroppable.mockReturnValue({ setNodeRef: vi.fn(), isOver: false });
  mockUseDndContext.mockReturnValue({ active: null });
}

function setActiveDragFromOtherColumn() {
  mockUseDroppable.mockReturnValue({ setNodeRef: vi.fn(), isOver: true });
  const activeTask: Task = {
    id: 'dragging',
    title: 'in-flight',
    status: 'todo',
    priority: 'medium',
    boardId: 'board-1',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUseDndContext.mockReturnValue({
    active: { data: { current: { task: activeTask } } },
  });
}

describe('KanbanColumn — empty state vs drop placeholder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setStores();
  });

  it('shows the empty-state copy when no drag is in progress', () => {
    setNoActiveDrag();

    render(<KanbanColumn title="Done" tasks={[]} status="done" />);

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/drop to move task here/i)).not.toBeInTheDocument();
  });

  it('shows ONLY the drop placeholder (not the empty state) when a card from another column is hovering', () => {
    setActiveDragFromOtherColumn();

    render(<KanbanColumn title="Done" tasks={[]} status="done" />);

    // Regression: previously both the empty state AND the drop placeholder
    // rendered simultaneously, creating two competing affordances for the
    // same intent.
    expect(screen.getByText(/drop to move task here/i)).toBeInTheDocument();
    expect(screen.queryByText(/no tasks yet/i)).not.toBeInTheDocument();
  });
});
