import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Board } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportBoards, ExportData } from '@/lib/utils/exportImport';

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

const defaultBoard: Omit<Board, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Work Tasks',
  description: 'Default board for work-related tasks',
  color: '#3b82f6',
  isDefault: true,
  archivedAt: undefined,
};

const initialState: BoardState = {
  boards: [],
  currentBoardId: null,
  isLoading: false,
  error: null,
};

export const useBoardStore = create<BoardState & BoardActions>((set, get) => ({
  ...initialState,

        setBoards: (boards) => set({ boards }),
        setCurrentBoard: async (boardId) => {
          set({ currentBoardId: boardId });
          
          // Persist current board selection in settings
          try {
            const existingSettings = await taskDB.getSettings();
            const updatedSettings = {
              theme: 'system' as const,
              autoArchiveDays: 30,
              enableNotifications: false,
              enableKeyboardShortcuts: true,
              enableDebugMode: false,
              accessibility: {
                highContrast: false,
                reduceMotion: false,
                fontSize: 'medium' as const,
              },
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
            
            const newBoard: Board = {
              ...boardData,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await taskDB.addBoard(newBoard);
            
            set((state) => ({
              boards: [...state.boards, newBoard],
              isLoading: false,
            }));

            // If this is the first board, set it as current
            if (get().boards.length === 0) {
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
              archivedAt: undefined,
            };

            await get().addBoard(duplicatedBoard);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to duplicate board'
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
            
            // Only initialize if we're in a browser environment
            if (typeof window === 'undefined') {
              set({ isLoading: false });
              return;
            }
            
            await taskDB.init();
            const boards = await taskDB.getBoards();
            
            if (boards.length === 0) {
              // Create default board if none exist
              const defaultBoardData: Board = {
                ...defaultBoard,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              
              await taskDB.addBoard(defaultBoardData);
              boards.push(defaultBoardData);
            }
            
            const processedBoards = boards.map(board => ({
              ...board,
              createdAt: new Date(board.createdAt),
              updatedAt: new Date(board.updatedAt),
              archivedAt: board.archivedAt ? new Date(board.archivedAt) : undefined,
            }));
            
            // Restore current board from settings
            const settings = await taskDB.getSettings();
            const savedCurrentBoardId = settings?.currentBoardId;
            const currentBoardId = savedCurrentBoardId && processedBoards.some(b => b.id === savedCurrentBoardId)
              ? savedCurrentBoardId
              : processedBoards[0]?.id || null;
            
            set({ 
              boards: processedBoards,
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
