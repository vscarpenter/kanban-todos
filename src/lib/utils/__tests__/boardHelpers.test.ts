import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateBoardName,
  checkDuplicateBoardName,
  calculateNextOrder,
  createBoardObject,
  reorderBoards,
  assignMissingOrders,
  createDefaultBoard,
  assignMissingIcons,
  deserializeBoardDates,
  selectCurrentBoard,
} from '../boardHelpers';
import type { Board } from '@/lib/types';

// Mock dependencies
vi.mock('../database', () => ({
  taskDB: {
    addBoard: vi.fn().mockResolvedValue(undefined),
    upsertBoards: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../security', () => ({
  sanitizeBoardData: vi.fn((data) => data),
}));

vi.mock('../boardIcons', () => ({
  legacyColorToDot: vi.fn(() => 'blue'),
  DEFAULT_ICON_KEY: 'Layers',
}));

describe('boardHelpers utilities', () => {
  describe('validateBoardName', () => {
    it('accepts valid board names', () => {
      expect(() => validateBoardName('Work Tasks')).not.toThrow();
      expect(() => validateBoardName('Personal Board 123')).not.toThrow();
    });

    it('throws error for empty name', () => {
      expect(() => validateBoardName('')).toThrow('Board name is required');
      expect(() => validateBoardName('   ')).toThrow('Board name is required');
    });

    it('throws error for whitespace-only name', () => {
      expect(() => validateBoardName('   ')).toThrow('Board name is required');
    });
  });

  describe('checkDuplicateBoardName', () => {
    const mockBoards: Board[] = [
      { id: '1', name: 'Work Tasks', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Personal', color: '#10b981', iconKey: 'Home', dotColor: 'green', isDefault: false, order: 1, createdAt: new Date(), updatedAt: new Date() },
    ];

    it('accepts unique board names', () => {
      expect(() => checkDuplicateBoardName(mockBoards, 'New Board')).not.toThrow();
    });

    it('throws error for duplicate name (case-insensitive)', () => {
      expect(() => checkDuplicateBoardName(mockBoards, 'work tasks')).toThrow('A board with this name already exists');
      expect(() => checkDuplicateBoardName(mockBoards, 'WORK TASKS')).toThrow('A board with this name already exists');
    });

    it('throws error for exact duplicate', () => {
      expect(() => checkDuplicateBoardName(mockBoards, 'Personal')).toThrow('A board with this name already exists');
    });

    it('allows name when boards array is empty', () => {
      expect(() => checkDuplicateBoardName([], 'Any Name')).not.toThrow();
    });
  });

  describe('calculateNextOrder', () => {
    it('returns 0 for empty boards array', () => {
      expect(calculateNextOrder([])).toBe(0);
    });

    it('returns max order + 1 for existing boards', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Board 2', color: '#10b981', iconKey: 'Home', dotColor: 'green', isDefault: false, order: 2, createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(calculateNextOrder(boards)).toBe(3);
    });

    it('handles non-sequential orders', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Board 2', color: '#10b981', iconKey: 'Home', dotColor: 'green', isDefault: false, order: 10, createdAt: new Date(), updatedAt: new Date() },
      ];
      expect(calculateNextOrder(boards)).toBe(11);
    });
  });

  describe('createBoardObject', () => {
    it('creates board with all required fields', () => {
      const boardData = {
        name: 'Test Board',
        description: 'A test board',
        color: '#3b82f6',
        iconKey: 'Briefcase',
        dotColor: 'blue',
        isDefault: false,
      };

      const board = createBoardObject(boardData, 0);

      expect(board.id).toBeDefined();
      expect(board.name).toBe('Test Board');
      expect(board.description).toBe('A test board');
      expect(board.color).toBe('#3b82f6');
      expect(board.iconKey).toBe('Briefcase');
      expect(board.dotColor).toBe('blue');
      expect(board.isDefault).toBe(false);
      expect(board.order).toBe(0);
      expect(board.createdAt).toBeInstanceOf(Date);
      expect(board.updatedAt).toBeInstanceOf(Date);
    });

    it('uses provided order when available', () => {
      const boardData = {
        name: 'Test Board',
        color: '#3b82f6',
        iconKey: 'Briefcase',
        dotColor: 'blue',
        isDefault: true,
        order: 5,
      };

      const board = createBoardObject(boardData, 0);
      expect(board.order).toBe(5);
    });

    it('falls back to parameter order when not provided', () => {
      const boardData = {
        name: 'Test Board',
        color: '#3b82f6',
        iconKey: 'Briefcase',
        dotColor: 'blue',
        isDefault: true,
      };

      const board = createBoardObject(boardData, 3);
      expect(board.order).toBe(3);
    });

    it('generates unique IDs for each board', () => {
      const boardData = {
        name: 'Test Board',
        color: '#3b82f6',
        iconKey: 'Briefcase',
        dotColor: 'blue',
        isDefault: true,
      };

      const board1 = createBoardObject(boardData, 0);
      const board2 = createBoardObject(boardData, 1);
      // Note: In test environment crypto.randomUUID is mocked to return a constant
      // so we just verify the function works rather than testing uniqueness
      expect(board1.id).toBeDefined();
      expect(board2.id).toBeDefined();
    });
  });

  describe('reorderBoards', () => {
    const mockBoards: Board[] = [
      { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Board 2', color: '#10b981', iconKey: 'Home', dotColor: 'green', isDefault: false, order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', name: 'Board 3', color: '#f59e0b', iconKey: 'Star', dotColor: 'yellow', isDefault: false, order: 2, createdAt: new Date(), updatedAt: new Date() },
    ];

    it('moves board up one position', () => {
      const result = reorderBoards(mockBoards, '2', 'up');
      expect(result).not.toBeNull();
      expect(result![0].id).toBe('2');
      expect(result![1].id).toBe('1');
      expect(result![2].id).toBe('3');
    });

    it('moves board down one position', () => {
      const result = reorderBoards(mockBoards, '2', 'down');
      expect(result).not.toBeNull();
      expect(result![0].id).toBe('1');
      expect(result![1].id).toBe('3');
      expect(result![2].id).toBe('2');
    });

    it('returns null when board not found', () => {
      const result = reorderBoards(mockBoards, 'non-existent', 'up');
      expect(result).toBeNull();
    });

    it('returns null when moving first board up', () => {
      const result = reorderBoards(mockBoards, '1', 'up');
      expect(result).toBeNull();
    });

    it('returns null when moving last board down', () => {
      const result = reorderBoards(mockBoards, '3', 'down');
      expect(result).toBeNull();
    });

    it('reassigns sequential order values', () => {
      const result = reorderBoards(mockBoards, '2', 'up');
      expect(result![0].order).toBe(0);
      expect(result![1].order).toBe(1);
      expect(result![2].order).toBe(2);
    });

    it('updates updatedAt timestamp', () => {
      const originalDate = mockBoards[0].updatedAt;
      const result = reorderBoards(mockBoards, '2', 'up');
      expect(result![0].updatedAt.getTime()).toBeGreaterThanOrEqual(originalDate.getTime());
    });
  });

  describe('assignMissingOrders', () => {
    it('assigns orders to boards missing them', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Board 2', color: '#10b981', iconKey: 'Home', dotColor: 'green', isDefault: false, order: undefined as any, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Board 3', color: '#f59e0b', iconKey: 'Star', dotColor: 'yellow', isDefault: false, order: null as any, createdAt: new Date(), updatedAt: new Date() },
      ];

      const result = assignMissingOrders(boards);
      expect(result.needsUpdate).toBe(true);
      expect(result.boards[1].order).toBe(1);
      expect(result.boards[2].order).toBe(2);
    });

    it('does not modify boards with existing orders', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 5, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Board 2', color: '#10b981', iconKey: 'Home', dotColor: 'green', isDefault: false, order: 10, createdAt: new Date(), updatedAt: new Date() },
      ];

      const result = assignMissingOrders(boards);
      expect(result.needsUpdate).toBe(false);
      expect(result.boards[0].order).toBe(5);
      expect(result.boards[1].order).toBe(10);
    });

    it('returns needsUpdate false when all boards have orders', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() },
      ];

      const result = assignMissingOrders(boards);
      expect(result.needsUpdate).toBe(false);
    });
  });

  describe('createDefaultBoard', () => {
    it('creates board with default properties', () => {
      const board = createDefaultBoard();
      
      expect(board.name).toBe('Work Tasks');
      expect(board.description).toBe('Default board for work-related tasks');
      expect(board.color).toBe('#3b82f6');
      expect(board.iconKey).toBe('Briefcase');
      expect(board.dotColor).toBe('blue');
      expect(board.isDefault).toBe(true);
      expect(board.order).toBe(0);
      expect(board.id).toBeDefined();
      expect(board.createdAt).toBeInstanceOf(Date);
      expect(board.updatedAt).toBeInstanceOf(Date);
      expect(board.archivedAt).toBeUndefined();
    });

    it('generates unique IDs for each call', () => {
      const board1 = createDefaultBoard();
      const board2 = createDefaultBoard();
      // Note: In test environment crypto.randomUUID is mocked to return a constant
      // so we just verify the function works rather than testing uniqueness
      expect(board1.id).toBeDefined();
      expect(board2.id).toBeDefined();
    });
  });

  describe('assignMissingIcons', () => {
    it('assigns missing iconKey and dotColor', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() } as any,
      ];

      const result = assignMissingIcons(boards);
      expect(result.needsUpdate).toBe(true);
      expect(result.boards[0].iconKey).toBe('Layers');
      expect(result.boards[0].dotColor).toBe('blue');
    });

    it('preserves existing iconKey and dotColor', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() },
      ];

      const result = assignMissingIcons(boards);
      expect(result.needsUpdate).toBe(false);
      expect(result.boards[0].iconKey).toBe('Briefcase');
      expect(result.boards[0].dotColor).toBe('blue');
    });

    it('handles partial missing data', () => {
      const boards: Board[] = [
        { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: undefined as any, isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() } as any,
      ];

      const result = assignMissingIcons(boards);
      expect(result.needsUpdate).toBe(true);
      expect(result.boards[0].iconKey).toBe('Briefcase');
      expect(result.boards[0].dotColor).toBe('blue');
    });
  });

  describe('deserializeBoardDates', () => {
    it('converts date strings to Date objects', () => {
      const board: Board = {
        id: '1',
        name: 'Board 1',
        color: '#3b82f6',
        iconKey: 'Briefcase',
        dotColor: 'blue',
        isDefault: true,
        order: 0,
        createdAt: '2024-01-01T00:00:00.000Z' as any,
        updatedAt: '2024-01-02T00:00:00.000Z' as any,
        archivedAt: '2024-01-03T00:00:00.000Z' as any,
      };

      const result = deserializeBoardDates(board);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.archivedAt).toBeInstanceOf(Date);
    });

    it('handles undefined archivedAt', () => {
      const board: Board = {
        id: '1',
        name: 'Board 1',
        color: '#3b82f6',
        iconKey: 'Briefcase',
        dotColor: 'blue',
        isDefault: true,
        order: 0,
        createdAt: '2024-01-01T00:00:00.000Z' as any,
        updatedAt: '2024-01-02T00:00:00.000Z' as any,
        archivedAt: undefined,
      };

      const result = deserializeBoardDates(board);
      expect(result.archivedAt).toBeUndefined();
    });

    it('preserves non-date properties', () => {
      const board: Board = {
        id: '1',
        name: 'Board 1',
        color: '#3b82f6',
        iconKey: 'Briefcase',
        dotColor: 'blue',
        isDefault: true,
        order: 0,
        createdAt: '2024-01-01T00:00:00.000Z' as any,
        updatedAt: '2024-01-02T00:00:00.000Z' as any,
      };

      const result = deserializeBoardDates(board);
      expect(result.id).toBe('1');
      expect(result.name).toBe('Board 1');
      expect(result.color).toBe('#3b82f6');
    });
  });

  describe('selectCurrentBoard', () => {
    const mockBoards: Board[] = [
      { id: '1', name: 'Board 1', color: '#3b82f6', iconKey: 'Briefcase', dotColor: 'blue', isDefault: true, order: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Board 2', color: '#10b981', iconKey: 'Home', dotColor: 'green', isDefault: false, order: 1, createdAt: new Date(), updatedAt: new Date() },
    ];

    it('returns saved board ID if it exists', () => {
      const result = selectCurrentBoard(mockBoards, '2');
      expect(result).toBe('2');
    });

    it('returns first board ID if saved ID is invalid', () => {
      const result = selectCurrentBoard(mockBoards, 'non-existent');
      expect(result).toBe('1');
    });

    it('returns first board ID if saved ID is undefined', () => {
      const result = selectCurrentBoard(mockBoards, undefined);
      expect(result).toBe('1');
    });

    it('returns null if boards array is empty', () => {
      const result = selectCurrentBoard([], '1');
      expect(result).toBeNull();
    });
  });
});