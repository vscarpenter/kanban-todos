import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardMenu } from '@/components/BoardMenu';
import type { Board } from '@/lib/types';

const mocks = vi.hoisted(() => ({
  useBoardStore: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/stores/boardStore', () => ({
  useBoardStore: mocks.useBoardStore,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: mocks.toastError,
  },
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

describe('BoardMenu', () => {
  let duplicateBoard: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    duplicateBoard = vi.fn().mockResolvedValue(undefined);
    mocks.useBoardStore.mockReturnValue({ duplicateBoard });
  });

  it('shows an error toast when duplicating a board fails, instead of failing silently', async () => {
    duplicateBoard.mockRejectedValueOnce(new Error('IndexedDB write failed'));

    render(<BoardMenu board={makeBoard()} />);

    const trigger = screen.getByRole('button', { name: /board options/i });
    fireEvent.pointerDown(trigger, { button: 0, pointerId: 1 });
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText('Duplicate Board'));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith('Failed to duplicate board: IndexedDB write failed');
    });
  });
});
