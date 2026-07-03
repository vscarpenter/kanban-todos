/**
 * Board store import/export action creators.
 * Extracted from boardStore.ts to keep file sizes manageable.
 */

import { Board } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import { exportBoards as exportBoardsUtil, ExportData } from '@/lib/utils/exportImport';

type GetState = () => { boards: Board[] };
type SetState = (state: Partial<{ boards: Board[]; isLoading: boolean; error: string | null }> | ((s: { boards: Board[]; isLoading: boolean; error: string | null }) => Partial<{ boards: Board[]; isLoading: boolean; error: string | null }>)) => void;

export function createExportBoards(get: GetState) {
  return (options = { includeArchived: true }): ExportData => {
    const { boards } = get();
    return exportBoardsUtil(boards, options);
  };
}

export function createImportBoards(set: SetState) {
  return async (boards: Board[]) => {
    try {
      set({ isLoading: true, error: null });

      await taskDB.upsertBoards(boards);

      set((state) => {
        const boardMap = new Map(state.boards.map(b => [b.id, b]));
        boards.forEach(board => { boardMap.set(board.id, board); });
        return { boards: Array.from(boardMap.values()), isLoading: false };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import boards',
        isLoading: false
      });
      throw error;
    }
  };
}

export function createBulkAddBoards(set: SetState) {
  return async (boards: Board[]) => {
    try {
      set({ isLoading: true, error: null });

      const batchSize = 20;
      for (let i = 0; i < boards.length; i += batchSize) {
        // react-doctor-disable-next-line react-doctor/async-await-in-loop
        await Promise.all(boards.slice(i, i + batchSize).map(board => taskDB.addBoard(board)));
      }

      set((state) => ({
        boards: [...state.boards, ...boards],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to bulk add boards',
        isLoading: false
      });
      throw error;
    }
  };
}
