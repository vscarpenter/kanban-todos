import { create } from 'zustand';
import { Board } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportBoards, ExportData } from '@/lib/utils/exportImport';
import {
  validateBoardName,
  checkDuplicateBoardName,
  calculateNextOrder,
  createBoardObject,
  persistBoard,
  reorderBoards,
  persistBoardOrders,
  assignMissingOrders,
  createDefaultBoard,
  deserializeBoardDates,
  selectCurrentBoard,
} from '@/lib/utils/boardHelpers';

/**
 * Loads boards from database, creating default board if none exist
 */
async function loadAndEnsureDefaultBoard(): Promise<Board[]> {
  let boardsData = await taskDB.getBoards();

  if (boardsData.length === 0) {
    const defaultBoardData = createDefaultBoard();
    await taskDB.addBoard(defaultBoardData);
    boardsData = [defaultBoardData];
  }

  return boardsData;
}

/**
 * Processes boards by assigning missing orders and deserializing dates
 */
async function processAndOrderBoards(boardsData: Board[]): Promise<Board[]> {
  const { boards: boardsWithOrder, needsUpdate } = assignMissingOrders(boardsData);

  if (needsUpdate) {
    await persistBoardOrders(boardsWithOrder);
  }

  return boardsWithOrder.map(deserializeBoardDates);
}

/**
 * Restores current board selection from settings
 */
async function restoreCurrentBoard(processedBoards: Board[]): Promise<string | null> {
  const settings = await taskDB.getSettings();
  return selectCurrentBoard(processedBoards, settings?.currentBoardId);
}

interface BoardState {
  boards: Board[];
  currentBoardId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface BoardActions {
  // State management
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (boardId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Board operations
  addBoard: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  duplicateBoard: (boardId: string) => Promise<void>;
  reorderBoard: (boardId: string, direction: 'up' | 'down') => Promise<void>;
  
  // Board selection
  selectBoard: (boardId: string) => Promise<void>;
  getCurrentBoard: () => Board | null;
  
  // Import/Export operations
  exportBoards: (options?: { includeArchived: boolean }) => ExportData;
  importBoards: (boards: Board[]) => Promise<void>;
  bulkAddBoards: (boards: Board[]) => Promise<void>;
  
  // Store initialization
  initializeBoards: () => Promise<void>;
}

// Default settings template for board persistence
const DEFAULT_BOARD_SETTINGS = {
  theme: 'system' as const,
  autoArchiveDays: 30,
  enableNotifications: false,
  enableKeyboardShortcuts: true,
  enableDebugMode: false,
  enableDeveloperMode: false,
  searchPreferences: {
    defaultScope: 'current-board' as const,
    rememberScope: true,
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    fontSize: 'medium' as const,
  },
};

// Use satisfies operator (TS 5.0+) for type-safe initial state
const initialState = {
  boards: [],
  currentBoardId: null,
  isLoading: false,
  error: null,
} satisfies BoardState;

export const useBoardStore = create<BoardState & BoardActions>((set, get) => ({
  ...initialState,

        setBoards: (boards) => set({ boards }),
        setCurrentBoard: async (boardId) => {
          set({ currentBoardId: boardId });

          try {
            const existingSettings = await taskDB.getSettings();
            const updatedSettings = {
              ...DEFAULT_BOARD_SETTINGS,
              ...existingSettings,
              currentBoardId: boardId,
            };
            await taskDB.updateSettings(updatedSettings);
          } catch (error) {
            console.warn('Failed to persist current board selection:', error);
          }
        },
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        addBoard: async (boardData) => {
          try {
            set({ isLoading: true, error: null });

            const boards = get().boards;

            // Validate and check for duplicates
            validateBoardName(boardData.name);
            checkDuplicateBoardName(boards, boardData.name);

            // Create and persist new board
            const order = calculateNextOrder(boards);
            const newBoard = createBoardObject(boardData, order);
            await persistBoard(newBoard);

            set((state) => ({
              boards: [...state.boards, newBoard].sort((a, b) => a.order - b.order),
              isLoading: false,
            }));

            // Set as current if first board
            if (boards.length === 0) {
              set({ currentBoardId: newBoard.id });
            }
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to add board',
              isLoading: false
            });
          }
        },

        updateBoard: async (boardId, updates) => {
          try {
            set({ isLoading: true, error: null });
            
            const updatedBoard = {
              ...get().boards.find(b => b.id === boardId)!,
              ...updates,
              updatedAt: new Date(),
            };

            await taskDB.updateBoard(updatedBoard);
            
            set((state) => ({
              boards: state.boards.map(b => 
                b.id === boardId ? updatedBoard : b
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update board',
              isLoading: false 
            });
          }
        },

        deleteBoard: async (boardId) => {
          try {
            set({ isLoading: true, error: null });
            
            const board = get().boards.find(b => b.id === boardId);
            if (board?.isDefault) {
              throw new Error('Cannot delete the default board');
            }

            await taskDB.deleteBoard(boardId);
            
            set((state) => {
              const newBoards = state.boards.filter(b => b.id !== boardId);
              let newCurrentBoardId = state.currentBoardId;
              
              // If we deleted the current board, switch to another one
              if (state.currentBoardId === boardId) {
                newCurrentBoardId = newBoards[0]?.id || null;
              }
              
              return {
                boards: newBoards,
                currentBoardId: newCurrentBoardId,
                isLoading: false,
              };
            });
            
            // Update persisted current board if it changed
            const finalState = get();
            if (finalState.currentBoardId && finalState.currentBoardId !== boardId) {
              await get().setCurrentBoard(finalState.currentBoardId);
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete board',
              isLoading: false 
            });
          }
        },

        duplicateBoard: async (boardId) => {
          try {
            const board = get().boards.find(b => b.id === boardId);
            if (!board) return;

            const duplicatedBoard: Omit<Board, 'id' | 'createdAt' | 'updatedAt'> = {
              name: `${board.name} (Copy)`,
              description: board.description,
              color: board.color,
              isDefault: false,
              order: board.order + 1, // Place after original board, will be resequenced by addBoard
              archivedAt: undefined,
            };

            await get().addBoard(duplicatedBoard);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to duplicate board'
            });
          }
        },

        reorderBoard: async (boardId, direction) => {
          try {
            set({ isLoading: true, error: null });

            const updatedBoards = reorderBoards(get().boards, boardId, direction);

            if (!updatedBoards) {
              set({ isLoading: false });
              return;
            }

            await persistBoardOrders(updatedBoards);

            set((state) => ({
              boards: state.boards.map(board => {
                const updated = updatedBoards.find(b => b.id === board.id);
                return updated || board;
              }).sort((a, b) => a.order - b.order),
              isLoading: false,
            }));
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to reorder board',
              isLoading: false
            });
          }
        },

        selectBoard: async (boardId) => {
          await get().setCurrentBoard(boardId);
        },

        getCurrentBoard: () => {
          const { boards, currentBoardId } = get();
          return boards.find(b => b.id === currentBoardId) || null;
        },

        // Export/Import operations
        exportBoards: (options = { includeArchived: true }) => {
          const { boards } = get();
          return exportBoards(boards, options);
        },

        importBoards: async (boards: Board[]) => {
          try {
            set({ isLoading: true, error: null });
            
            const { boards: existingBoards } = get();
            const existingIds = new Set(existingBoards.map(b => b.id));
            
            // Add or update boards in database
            for (const board of boards) {
              if (existingIds.has(board.id)) {
                // Update existing board
                await taskDB.updateBoard(board);
              } else {
                // Add new board
                await taskDB.addBoard(board);
              }
            }
            
            // Update store state
            set((state) => {
              const boardMap = new Map(state.boards.map(b => [b.id, b]));
              
              // Add or update imported boards
              boards.forEach(board => {
                boardMap.set(board.id, board);
              });
              
              const newBoards = Array.from(boardMap.values());
              return {
                boards: newBoards,
                isLoading: false,
              };
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to import boards',
              isLoading: false 
            });
            throw error;
          }
        },

        bulkAddBoards: async (boards: Board[]) => {
          try {
            set({ isLoading: true, error: null });
            
            // Process boards in batches
            const batchSize = 20;
            const batches = [];
            for (let i = 0; i < boards.length; i += batchSize) {
              batches.push(boards.slice(i, i + batchSize));
            }
            
            for (const batch of batches) {
              await Promise.all(batch.map(board => taskDB.addBoard(board)));
            }
            
            // Update store state
            set((state) => {
              const newBoards = [...state.boards, ...boards];
              return {
                boards: newBoards,
                isLoading: false,
              };
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to bulk add boards',
              isLoading: false 
            });
            throw error;
          }
        },

        initializeBoards: async () => {
          try {
            set({ isLoading: true, error: null });

            if (typeof window === 'undefined') {
              set({ isLoading: false });
              return;
            }

            await taskDB.init();
            const boardsData = await loadAndEnsureDefaultBoard();
            const processedBoards = await processAndOrderBoards(boardsData);
            const currentBoardId = await restoreCurrentBoard(processedBoards);

            set({
              boards: processedBoards.sort((a, b) => a.order - b.order),
              currentBoardId,
              isLoading: false
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to initialize boards',
              isLoading: false
            });
          }
        },
}));
