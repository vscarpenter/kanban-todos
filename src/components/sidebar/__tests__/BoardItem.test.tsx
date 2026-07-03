import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardItem } from '@/components/sidebar/BoardItem';
import type { Board } from '@/lib/types';

// BoardItem composes the real BoardMenu (the "..." trigger), which reaches
// into useBoardStore/useTaskStore and renders BoardSettingsDialog /
// BoardDeleteDialog. Those stores are the true external boundary here — the
// dialogs themselves stay closed (open=false) during these tests, so only
// the store hooks need mocking to keep BoardMenu from crashing.
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
  description: 'Day job tasks',
  color: '#2563eb',
  isDefault: false,
  order: 0,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

function renderBoardItem(overrides: Partial<Parameters<typeof BoardItem>[0]> = {}) {
  const props = {
    board: makeBoard(),
    isActive: false,
    taskCount: 3,
    onSelect: vi.fn(),
    onReorder: vi.fn(),
    canMoveUp: true,
    canMoveDown: true,
    ...overrides,
  };
  render(<BoardItem {...props} />);
  return props;
}

// The card row itself is `role="button"`, so its accessible name is computed
// from ALL descendant text (title, description, reorder button labels, the
// "Board options" sr-only span). That makes name-based role queries
// ambiguous for the row — find it by its title text and walk up instead.
function getBoardRow(boardName: string): HTMLElement {
  const row = screen.getByText(boardName).closest('[role="button"]');
  if (!row) throw new Error(`Could not find board row for "${boardName}"`);
  return row as HTMLElement;
}

describe('BoardItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useBoardStore.mockReturnValue({
      duplicateBoard: vi.fn().mockResolvedValue(undefined),
      updateBoard: vi.fn().mockResolvedValue(undefined),
      deleteBoard: vi.fn().mockResolvedValue(undefined),
    });
    mocks.useTaskStore.mockReturnValue({ tasks: [] });
  });

  it('renders the board name, description, and task count', () => {
    renderBoardItem({ board: makeBoard({ name: 'Launch', description: 'Go-to-market' }), taskCount: 7 });

    expect(screen.getByText('Launch')).toBeInTheDocument();
    expect(screen.getByText('Go-to-market')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('omits the description line when the board has none', () => {
    renderBoardItem({ board: makeBoard({ description: undefined }) });

    expect(screen.queryByText('Day job tasks')).not.toBeInTheDocument();
  });

  it('calls onSelect when the row is clicked', () => {
    const props = renderBoardItem({ board: makeBoard({ name: 'Personal' }) });

    fireEvent.click(screen.getByText('Personal'));

    expect(props.onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when Enter is pressed on the focused row', () => {
    const props = renderBoardItem();

    fireEvent.keyDown(getBoardRow('Work'), { key: 'Enter' });

    expect(props.onSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when Space is pressed on the focused row', () => {
    const props = renderBoardItem();

    fireEvent.keyDown(getBoardRow('Work'), { key: ' ' });

    expect(props.onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not call onSelect for irrelevant key presses', () => {
    const props = renderBoardItem();

    fireEvent.keyDown(getBoardRow('Work'), { key: 'Tab' });

    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('applies the active styling class only when isActive is true', () => {
    const { rerender } = render(
      <BoardItem
        board={makeBoard()}
        isActive={false}
        taskCount={0}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
        canMoveUp
        canMoveDown
      />
    );

    expect(getBoardRow('Work')).not.toHaveClass('sidebar-item--active');

    rerender(
      <BoardItem
        board={makeBoard()}
        isActive={true}
        taskCount={0}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
        canMoveUp
        canMoveDown
      />
    );

    expect(getBoardRow('Work')).toHaveClass('sidebar-item--active');
  });

  it('calls onReorder with "up" and stops propagation so onSelect is not also triggered', () => {
    const props = renderBoardItem({ board: makeBoard({ name: 'Work' }) });

    fireEvent.click(screen.getByRole('button', { name: 'Move Work up' }));

    expect(props.onReorder).toHaveBeenCalledWith('up');
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('calls onReorder with "down" and stops propagation so onSelect is not also triggered', () => {
    const props = renderBoardItem({ board: makeBoard({ name: 'Work' }) });

    fireEvent.click(screen.getByRole('button', { name: 'Move Work down' }));

    expect(props.onReorder).toHaveBeenCalledWith('down');
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it('disables the up control when canMoveUp is false, and the down control when canMoveDown is false', () => {
    renderBoardItem({ board: makeBoard({ name: 'Work' }), canMoveUp: false, canMoveDown: false });

    expect(screen.getByRole('button', { name: 'Move Work up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Work down' })).toBeDisabled();
  });

  it('renders the board options menu trigger and clicking it does not select the board', () => {
    const props = renderBoardItem();

    // Exact (non-regex) name match: the outer card row is also role="button"
    // and its computed name is a concatenation of all descendant text, which
    // includes "Board options" as a substring — an exact match only matches
    // the actual trigger, not the row.
    const menuTrigger = screen.getByRole('button', { name: 'Board options' });
    fireEvent.click(menuTrigger);

    expect(menuTrigger).toBeInTheDocument();
    expect(props.onSelect).not.toHaveBeenCalled();
  });
});
