/**
 * Board conflict resolution logic
 */

import { Board } from '@/lib/types';
import { ImportConflicts } from '../exportImport';
import type { ConflictResolutionOptions, ResolutionAction } from './types';
import { mergeBoards, generateUniqueBoardName } from './merging';

/**
 * Resolves board conflicts based on the specified strategy
 */
export function resolveBoardConflicts(
  importedBoards: Board[],
  existingBoards: Board[],
  conflicts: ImportConflicts,
  options: ConflictResolutionOptions,
  resolutionLog: ResolutionAction[]
): Board[] {
  const resolved: Board[] = [...existingBoards];
  const existingBoardMap = new Map(existingBoards.map(board => [board.id, board]));

  for (const importedBoard of importedBoards) {
    const hasIdConflict = conflicts.duplicateBoardIds.includes(importedBoard.id);
    const hasNameConflict = conflicts.boardNameConflicts.includes(importedBoard.name);
    const defaultConflict = conflicts.defaultBoardConflicts.find(
      conflict => conflict.importedBoard.id === importedBoard.id
    );

    if (!hasIdConflict && !hasNameConflict && !defaultConflict) {
      // No conflict, add directly
      resolved.push(importedBoard);
      continue;
    }

    // Handle default board conflicts specially
    if (defaultConflict) {
      const existingDefaultBoard = defaultConflict.existingBoard;

      // For default boards, always merge to preserve the existing default board
      const mergeResult = mergeBoards(existingDefaultBoard, importedBoard, options.mergeStrategy);

      // Ensure the merged board keeps its default status and original ID
      const mergedBoard = {
        ...mergeResult.merged,
        id: existingDefaultBoard.id, // Keep original ID
        isDefault: true, // Preserve default status
        updatedAt: new Date(), // Update timestamp
      };

      const index = resolved.findIndex(b => b.id === existingDefaultBoard.id);
      resolved[index] = mergedBoard;

      resolutionLog.push({
        type: 'merge',
        itemType: 'board',
        itemId: existingDefaultBoard.id,
        originalName: importedBoard.name,
        mergedFields: mergeResult.mergedFields,
        reason: 'Merged imported board with existing default board'
      });
      continue;
    }

    const existingBoard = existingBoardMap.get(importedBoard.id);

    switch (options.boardStrategy) {
      case 'skip':
        resolutionLog.push({
          type: 'skip',
          itemType: 'board',
          itemId: importedBoard.id,
          originalName: importedBoard.name,
          reason: hasIdConflict ? 'ID conflict' : 'Name conflict'
        });
        break;

      case 'overwrite':
        if (existingBoard) {
          const index = resolved.findIndex(b => b.id === importedBoard.id);
          resolved[index] = importedBoard;
          resolutionLog.push({
            type: 'overwrite',
            itemType: 'board',
            itemId: importedBoard.id,
            originalName: importedBoard.name,
            reason: 'Overwrote existing board'
          });
        }
        break;

      case 'merge':
        if (existingBoard) {
          const mergeResult = mergeBoards(existingBoard, importedBoard, options.mergeStrategy);
          const index = resolved.findIndex(b => b.id === importedBoard.id);
          resolved[index] = mergeResult.merged;
          resolutionLog.push({
            type: 'merge',
            itemType: 'board',
            itemId: importedBoard.id,
            originalName: importedBoard.name,
            mergedFields: mergeResult.mergedFields,
            reason: 'Merged with existing board'
          });
        }
        break;

      case 'rename':
        const renamedBoard = {
          ...importedBoard,
          name: generateUniqueBoardName(importedBoard.name, resolved)
        };
        resolved.push(renamedBoard);
        resolutionLog.push({
          type: 'rename',
          itemType: 'board',
          itemId: importedBoard.id,
          originalName: importedBoard.name,
          newName: renamedBoard.name,
          reason: 'Renamed to avoid conflict'
        });
        break;

      case 'generate_new_ids':
        const newId = crypto.randomUUID();
        const newBoard = { ...importedBoard, id: newId };
        resolved.push(newBoard);
        resolutionLog.push({
          type: 'generate_id',
          itemType: 'board',
          itemId: importedBoard.id,
          originalId: importedBoard.id,
          newId: newId,
          reason: 'Generated new ID to avoid conflict'
        });
        break;
    }
  }

  return resolved;
}

/**
 * Creates a mapping of old board IDs to new board IDs
 * Used to update task references when board IDs change
 */
export function createBoardIdMapping(
  importedBoards: { id: string; name: string }[],
  resolvedBoards: Board[],
  resolutionLog: ResolutionAction[]
): Map<string, string> {
  const mapping = new Map<string, string>();

  for (const action of resolutionLog) {
    if (action.itemType === 'board' && action.type === 'generate_id') {
      mapping.set(action.originalId!, action.newId!);
    }
    // Handle default board merges - tasks from imported board should use the existing default board ID
    if (action.itemType === 'board' && action.type === 'merge' &&
        action.reason === 'Merged imported board with existing default board') {
      // Find the imported board ID that was merged
      const importedBoard = importedBoards.find(b => b.name === action.originalName);
      if (importedBoard) {
        mapping.set(importedBoard.id, action.itemId); // Map imported board ID to existing default board ID
      }
    }
  }

  return mapping;
}
