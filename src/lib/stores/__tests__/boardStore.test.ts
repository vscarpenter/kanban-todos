import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBoardStore } from '../boardStore';

// Mock the database
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    addBoard: vi.fn().mockResolvedValue(undefined),
    getBoards: vi.fn().mockResolvedValue([]),
    updateBoard: vi.fn().mockResolvedValue(undefined),
    deleteBoard: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({
      boards: [],
      currentBoardId: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with empty state', () => {
      const { boards, currentBoardId, isLoading, error } = useBoardStore.getState();

      expect(boards).toEqual([]);
      expect(currentBoardId).toBeNull();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });
  });

  describe('setBoards', () => {
    it('sets boards directly', () => {
      const { setBoards } = useBoardStore.getState();
      const boards = [
        {
          id: 'board-1',
          name: 'Test',
          color: '#3b82f6',
          isDefault: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setBoards(boards);

      expect(useBoardStore.getState().boards).toEqual(boards);
    });
  });

  describe('setCurrentBoard', () => {
    it('sets current board ID', async () => {
      const { setCurrentBoard } = useBoardStore.getState();

      await setCurrentBoard('board-123');

      expect(useBoardStore.getState().currentBoardId).toBe('board-123');
    });

    it('persists board selection to settings', async () => {
      const { taskDB } = await import('@/lib/utils/database');
      const { setCurrentBoard } = useBoardStore.getState();

      await setCurrentBoard('board-456');

      expect(taskDB.updateSettings).toHaveBeenCalled();
    });
  });

  describe('setLoading', () => {
    it('updates loading state', () => {
      const { setLoading } = useBoardStore.getState();

      setLoading(true);
      expect(useBoardStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useBoardStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('updates error state', () => {
      const { setError } = useBoardStore.getState();

      setError('Something went wrong');
      expect(useBoardStore.getState().error).toBe('Something went wrong');

      setError(null);
      expect(useBoardStore.getState().error).toBeNull();
    });
  });

  describe('addBoard', () => {
    it('adds a new board', async () => {
      const { addBoard } = useBoardStore.getState();

      await addBoard({
        name: 'Test Board',
        color: '#3b82f6',
        description: 'A test board',
        isDefault: false,
        order: 0,
      });

      const { boards } = useBoardStore.getState();
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe('Test Board');
      expect(boards[0].color).toBe('#3b82f6');
    });

    it('persists board to database', async () => {
      const { taskDB } = await import('@/lib/utils/database');
      const { addBoard } = useBoardStore.getState();

      await addBoard({
        name: 'Persisted Board',
        color: '#ef4444',
        isDefault: false,
        order: 0,
      });

      expect(taskDB.addBoard).toHaveBeenCalledTimes(1);
    });

    it('generates id, createdAt, and updatedAt', async () => {
      const { addBoard } = useBoardStore.getState();
      const beforeAdd = new Date();

      await addBoard({
        name: 'New Board',
        color: '#22c55e',
        isDefault: false,
        order: 0,
      });

      const { boards } = useBoardStore.getState();
      expect(boards[0].id).toBeDefined();
      expect(boards[0].createdAt).toBeInstanceOf(Date);
      expect(boards[0].updatedAt).toBeInstanceOf(Date);
      expect(boards[0].createdAt.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
    });

    it('sets as current board if first board added', async () => {
      const { addBoard } = useBoardStore.getState();

      await addBoard({
        name: 'First Board',
        color: '#3b82f6',
        isDefault: false,
        order: 0,
      });

      const { currentBoardId, boards } = useBoardStore.getState();
      expect(currentBoardId).toBe(boards[0].id);
    });

    it('does not change current board if boards already exist', async () => {
      // Pre-populate with an existing board
      useBoardStore.setState({
        boards: [
          {
            id: 'existing-board',
            name: 'Existing',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        currentBoardId: 'existing-board',
      });

      const { addBoard } = useBoardStore.getState();
      await addBoard({
        name: 'Second Board',
        color: '#ef4444',
        isDefault: false,
        order: 1,
      });

      expect(useBoardStore.getState().currentBoardId).toBe('existing-board');
    });

    it('sets error for empty board name', async () => {
      const { addBoard } = useBoardStore.getState();

      await addBoard({
        name: '',
        color: '#3b82f6',
        isDefault: false,
        order: 0,
      });

      const { error, boards } = useBoardStore.getState();
      expect(error).toBe('Board name is required');
      expect(boards).toHaveLength(0);
    });

    it('sets error for duplicate board name', async () => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-1',
            name: 'My Board',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const { addBoard } = useBoardStore.getState();
      await addBoard({
        name: 'My Board',
        color: '#ef4444',
        isDefault: false,
        order: 1,
      });

      expect(useBoardStore.getState().error).toBe('A board with this name already exists');
    });

    it('sorts boards by order after adding', async () => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-1',
            name: 'First',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        currentBoardId: 'board-1',
      });

      const { addBoard } = useBoardStore.getState();
      await addBoard({
        name: 'Second',
        color: '#ef4444',
        isDefault: false,
        order: 5,
      });

      const { boards } = useBoardStore.getState();
      expect(boards).toHaveLength(2);
      // Second board should come after first by order
      expect(boards[0].order).toBeLessThanOrEqual(boards[1].order);
    });
  });

  describe('updateBoard', () => {
    beforeEach(() => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-1',
            name: 'Original Name',
            description: 'Original description',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        currentBoardId: 'board-1',
      });
    });

    it('updates board name', async () => {
      const { updateBoard } = useBoardStore.getState();

      await updateBoard('board-1', { name: 'Updated Name' });

      const { boards } = useBoardStore.getState();
      expect(boards[0].name).toBe('Updated Name');
    });

    it('updates board color', async () => {
      const { updateBoard } = useBoardStore.getState();

      await updateBoard('board-1', { color: '#ef4444' });

      const { boards } = useBoardStore.getState();
      expect(boards[0].color).toBe('#ef4444');
    });

    it('updates the updatedAt timestamp', async () => {
      const { updateBoard } = useBoardStore.getState();
      const oldDate = new Date('2024-01-01');

      await updateBoard('board-1', { name: 'New Name' });

      const { boards } = useBoardStore.getState();
      expect(boards[0].updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('persists update to database', async () => {
      const { taskDB } = await import('@/lib/utils/database');
      const { updateBoard } = useBoardStore.getState();

      await updateBoard('board-1', { name: 'New Name' });

      expect(taskDB.updateBoard).toHaveBeenCalledTimes(1);
    });

    it('sanitizes text fields on update', async () => {
      const { updateBoard } = useBoardStore.getState();

      await updateBoard('board-1', { name: '<script>alert(1)</script>Board' });

      const { boards } = useBoardStore.getState();
      expect(boards[0].name).not.toContain('<script>');
    });
  });

  describe('deleteBoard', () => {
    beforeEach(() => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-1',
            name: 'Default Board',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'board-2',
            name: 'Work Board',
            color: '#ef4444',
            isDefault: false,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        currentBoardId: 'board-1',
      });
    });

    it('removes a non-default board', async () => {
      const { deleteBoard } = useBoardStore.getState();

      await deleteBoard('board-2');

      const { boards } = useBoardStore.getState();
      expect(boards).toHaveLength(1);
      expect(boards[0].id).toBe('board-1');
    });

    it('persists deletion to database', async () => {
      const { taskDB } = await import('@/lib/utils/database');
      const { deleteBoard } = useBoardStore.getState();

      await deleteBoard('board-2');

      expect(taskDB.deleteBoard).toHaveBeenCalledWith('board-2');
    });

    it('prevents deleting the default board', async () => {
      const { deleteBoard } = useBoardStore.getState();

      await deleteBoard('board-1');

      const { boards, error } = useBoardStore.getState();
      expect(boards).toHaveLength(2);
      expect(error).toBe('Cannot delete the default board');
    });

    it('switches current board when deleting the active board', async () => {
      useBoardStore.setState({ currentBoardId: 'board-2' });

      const { deleteBoard } = useBoardStore.getState();
      await deleteBoard('board-2');

      const { currentBoardId } = useBoardStore.getState();
      expect(currentBoardId).toBe('board-1');
    });

    it('keeps current board when deleting a different board', async () => {
      const { deleteBoard } = useBoardStore.getState();

      await deleteBoard('board-2');

      expect(useBoardStore.getState().currentBoardId).toBe('board-1');
    });
  });

  describe('reorderBoard', () => {
    beforeEach(() => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-a',
            name: 'Board A',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'board-b',
            name: 'Board B',
            color: '#ef4444',
            isDefault: false,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'board-c',
            name: 'Board C',
            color: '#22c55e',
            isDefault: false,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        currentBoardId: 'board-a',
      });
    });

    it('moves board down', async () => {
      const { reorderBoard } = useBoardStore.getState();

      await reorderBoard('board-a', 'down');

      const { boards } = useBoardStore.getState();
      const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
      expect(sortedBoards[0].id).toBe('board-b');
      expect(sortedBoards[1].id).toBe('board-a');
    });

    it('moves board up', async () => {
      const { reorderBoard } = useBoardStore.getState();

      await reorderBoard('board-c', 'up');

      const { boards } = useBoardStore.getState();
      const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
      expect(sortedBoards[1].id).toBe('board-c');
      expect(sortedBoards[2].id).toBe('board-b');
    });

    it('does not move first board up', async () => {
      const { reorderBoard } = useBoardStore.getState();

      await reorderBoard('board-a', 'up');

      const { boards } = useBoardStore.getState();
      const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
      expect(sortedBoards[0].id).toBe('board-a');
    });

    it('does not move last board down', async () => {
      const { reorderBoard } = useBoardStore.getState();

      await reorderBoard('board-c', 'down');

      const { boards } = useBoardStore.getState();
      const sortedBoards = [...boards].sort((a, b) => a.order - b.order);
      expect(sortedBoards[2].id).toBe('board-c');
    });

    it('persists reorder to database', async () => {
      const { taskDB } = await import('@/lib/utils/database');
      const { reorderBoard } = useBoardStore.getState();

      await reorderBoard('board-b', 'up');

      expect(taskDB.updateBoard).toHaveBeenCalled();
    });
  });

  describe('getCurrentBoard', () => {
    it('returns current board when set', () => {
      const board = {
        id: 'board-1',
        name: 'Test',
        color: '#3b82f6',
        isDefault: true,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      useBoardStore.setState({
        boards: [board],
        currentBoardId: 'board-1',
      });

      const { getCurrentBoard } = useBoardStore.getState();
      expect(getCurrentBoard()).toEqual(board);
    });

    it('returns null when no current board', () => {
      useBoardStore.setState({ boards: [], currentBoardId: null });

      const { getCurrentBoard } = useBoardStore.getState();
      expect(getCurrentBoard()).toBeNull();
    });

    it('returns null when currentBoardId does not match any board', () => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-1',
            name: 'Test',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        currentBoardId: 'non-existent',
      });

      const { getCurrentBoard } = useBoardStore.getState();
      expect(getCurrentBoard()).toBeNull();
    });
  });

  describe('selectBoard', () => {
    it('delegates to setCurrentBoard', async () => {
      const { selectBoard } = useBoardStore.getState();

      await selectBoard('board-123');

      expect(useBoardStore.getState().currentBoardId).toBe('board-123');
    });
  });

  describe('duplicateBoard', () => {
    it('creates a copy of an existing board', async () => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-1',
            name: 'Original',
            description: 'Original desc',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        currentBoardId: 'board-1',
      });

      const { duplicateBoard } = useBoardStore.getState();
      await duplicateBoard('board-1');

      const { boards } = useBoardStore.getState();
      expect(boards).toHaveLength(2);
      // The copy should have "(Copy)" in the name
      const copy = boards.find((b) => b.name.includes('(Copy)'));
      expect(copy).toBeDefined();
      expect(copy!.isDefault).toBe(false);
    });

    it('does nothing when board ID does not exist', async () => {
      const { duplicateBoard } = useBoardStore.getState();

      await duplicateBoard('non-existent');

      expect(useBoardStore.getState().boards).toHaveLength(0);
    });
  });

  describe('importBoards', () => {
    it('imports new boards', async () => {
      const { importBoards } = useBoardStore.getState();

      const importedBoards = [
        {
          id: 'imported-1',
          name: 'Imported Board',
          color: '#3b82f6',
          isDefault: false,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await importBoards(importedBoards);

      const { boards } = useBoardStore.getState();
      expect(boards).toHaveLength(1);
      expect(boards[0].id).toBe('imported-1');
    });

    it('updates existing boards on import', async () => {
      useBoardStore.setState({
        boards: [
          {
            id: 'board-1',
            name: 'Old Name',
            color: '#3b82f6',
            isDefault: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const { importBoards } = useBoardStore.getState();
      await importBoards([
        {
          id: 'board-1',
          name: 'Updated Name',
          color: '#ef4444',
          isDefault: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { boards } = useBoardStore.getState();
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe('Updated Name');
    });
  });

  describe('bulkAddBoards', () => {
    it('adds multiple boards at once', async () => {
      const { bulkAddBoards } = useBoardStore.getState();

      const newBoards = Array.from({ length: 5 }, (_, i) => ({
        id: `bulk-${i}`,
        name: `Bulk Board ${i}`,
        color: '#3b82f6',
        isDefault: false,
        order: i,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await bulkAddBoards(newBoards);

      const { boards } = useBoardStore.getState();
      expect(boards).toHaveLength(5);
    });

    it('persists all boards to database', async () => {
      const { taskDB } = await import('@/lib/utils/database');
      const { bulkAddBoards } = useBoardStore.getState();

      const newBoards = Array.from({ length: 3 }, (_, i) => ({
        id: `bulk-${i}`,
        name: `Bulk ${i}`,
        color: '#3b82f6',
        isDefault: false,
        order: i,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await bulkAddBoards(newBoards);

      expect(taskDB.addBoard).toHaveBeenCalledTimes(3);
    });
  });
});
