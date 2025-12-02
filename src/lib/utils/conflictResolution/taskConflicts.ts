/**
 * Task conflict resolution logic
 */

import { Task } from '@/lib/types';
import { ImportConflicts } from '../exportImport';
import type { ConflictResolutionOptions, ResolutionAction } from './types';
import { mergeTasks } from './merging';

/**
 * Resolves task conflicts based on the specified strategy
 */
export function resolveTaskConflicts(
  importedTasks: Task[],
  existingTasks: Task[],
  conflicts: ImportConflicts,
  options: ConflictResolutionOptions,
  boardIdMap: Map<string, string>,
  resolutionLog: ResolutionAction[]
): Task[] {
  const resolved: Task[] = [...existingTasks];
  const existingTaskMap = new Map(existingTasks.map(task => [task.id, task]));

  for (const importedTask of importedTasks) {
    // Update board reference if board ID was changed
    let processedTask = importedTask;
    if (boardIdMap.has(importedTask.boardId)) {
      processedTask = {
        ...importedTask,
        boardId: boardIdMap.get(importedTask.boardId)!
      };
    }

    const hasIdConflict = conflicts.duplicateTaskIds.includes(importedTask.id);
    const isOrphaned = conflicts.orphanedTasks.includes(importedTask.id);

    if (isOrphaned && options.taskStrategy !== 'generate_new_ids') {
      // Skip orphaned tasks unless we're generating new IDs
      resolutionLog.push({
        type: 'skip',
        itemType: 'task',
        itemId: importedTask.id,
        reason: 'Task references non-existent board'
      });
      continue;
    }

    if (!hasIdConflict) {
      // No conflict, add directly
      resolved.push(processedTask);
      continue;
    }

    const existingTask = existingTaskMap.get(importedTask.id);

    switch (options.taskStrategy) {
      case 'skip':
        resolutionLog.push({
          type: 'skip',
          itemType: 'task',
          itemId: importedTask.id,
          reason: 'ID conflict'
        });
        break;

      case 'overwrite':
        if (existingTask) {
          const index = resolved.findIndex(t => t.id === importedTask.id);
          resolved[index] = processedTask;
          resolutionLog.push({
            type: 'overwrite',
            itemType: 'task',
            itemId: importedTask.id,
            reason: 'Overwrote existing task'
          });
        }
        break;

      case 'merge':
        if (existingTask) {
          const mergeResult = mergeTasks(existingTask, processedTask, options.mergeStrategy);
          const index = resolved.findIndex(t => t.id === importedTask.id);
          resolved[index] = mergeResult.merged;
          resolutionLog.push({
            type: 'merge',
            itemType: 'task',
            itemId: importedTask.id,
            mergedFields: mergeResult.mergedFields,
            reason: 'Merged with existing task'
          });
        }
        break;

      case 'generate_new_ids':
        const newId = crypto.randomUUID();
        const newTask = { ...processedTask, id: newId };
        resolved.push(newTask);
        resolutionLog.push({
          type: 'generate_id',
          itemType: 'task',
          itemId: importedTask.id,
          originalId: importedTask.id,
          newId: newId,
          reason: 'Generated new ID to avoid conflict'
        });
        break;
    }
  }

  return resolved;
}
