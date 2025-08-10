import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Board } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';

interface BoardState {
  boards: Board[];
  currentBoardId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface BoardActions {
  // State management
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (boardId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Board operations
  addBoard: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  duplicateBoard: (boardId: string) => Promise<void>;
  
  // Board selection
  selectBoard: (boardId: string) => void;
  getCurrentBoard: () => Board | null;
  
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

export const useBoardStore = create<BoardState & BoardActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setBoards: (boards) => set({ boards }),
        setCurrentBoard: (boardId) => set({ currentBoardId: boardId }),
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

        selectBoard: (boardId) => {
          set({ currentBoardId: boardId });
        },

        getCurrentBoard: () => {
          const { boards, currentBoardId } = get();
          return boards.find(b => b.id === currentBoardId) || null;
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
            
            set({ 
              boards: processedBoards,
              currentBoardId: processedBoards[0]?.id || null,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize boards',
              isLoading: false 
            });
          }
        },
      }),
      {
        name: 'cascade-boards',
        partialize: (state) => ({ 
          boards: state.boards,
          currentBoardId: state.currentBoardId 
        }),
      }
    )
  )
);
