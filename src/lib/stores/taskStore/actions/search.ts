/**
 * Search operations - navigation, highlighting, and preferences
 */

import { SearchScope } from '@/lib/types';
import { taskDB } from '@/lib/utils/database';
import type { TaskStoreState, StoreSetter } from './types';

/**
 * Creates the setHighlightedTask action
 * Sets the highlighted task for search navigation
 */
export function createSetHighlightedTask(set: StoreSetter) {
  return (taskId: string | undefined) => {
    set((state: TaskStoreState) => ({
      searchState: { ...state.searchState, highlightedTaskId: taskId }
    }));
  };
}

/**
 * Creates the navigateToTaskBoard action
 * Navigates to a task's board with validation
 * Returns navigation result with board ID or error message
 */
export function createNavigateToTaskBoard(get: () => TaskStoreState, set: StoreSetter) {
  return async (taskId: string): Promise<{ success: boolean; boardId?: string; error?: string }> => {
    try {
      const { tasks } = get();
      const task = tasks.find(t => t.id === taskId);

      if (!task) {
        return {
          success: false,
          error: 'Task not found. It may have been deleted.'
        };
      }

      // Validate that the board still exists
      const boardExists = await get().validateBoardAccess(task.boardId);
      if (!boardExists) {
        return {
          success: false,
          error: 'The board containing this task no longer exists or has been archived.'
        };
      }

      // Set the highlighted task for navigation
      set((state: TaskStoreState) => ({
        searchState: { ...state.searchState, highlightedTaskId: taskId }
      }));

      return {
        success: true,
        boardId: task.boardId
      };

    } catch (error: unknown) {
      console.error('Navigation to task board failed:', error);
      return {
        success: false,
        error: 'Failed to navigate to task. Please try again.'
      };
    }
  };
}

/**
 * Creates the loadSearchPreferences action
 * Loads search preferences from database
 * Restores user's preferred search scope
 */
export function createLoadSearchPreferences(get: () => TaskStoreState, set: any) {
  return async () => {
    try {
      const settings = await taskDB.getSettings();
      if (settings?.searchPreferences) {
        const { defaultScope } = settings.searchPreferences;
        const crossBoardSearch = defaultScope === 'all-boards';

        set((state: any) => ({
          filters: { ...state.filters, crossBoardSearch },
          searchState: { ...state.searchState, scope: defaultScope }
        }));
      }
    } catch (error: unknown) {
      console.warn('Failed to load search preferences:', error);
    }
  };
}

/**
 * Creates the saveSearchScope action
 * Saves search scope preference to database
 * Persists user's choice between sessions if remember is enabled
 */
export function createSaveSearchScope() {
  return async (scope: SearchScope) => {
    try {
      const settings = await taskDB.getSettings();
      if (settings?.searchPreferences?.rememberScope) {
        const updatedSettings = {
          ...settings,
          searchPreferences: {
            ...settings.searchPreferences,
            defaultScope: scope,
          },
        };
        await taskDB.updateSettings(updatedSettings);
      }
    } catch (error: unknown) {
      console.warn('Failed to save search scope preference:', error);
    }
  };
}
