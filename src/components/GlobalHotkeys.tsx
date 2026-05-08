"use client";

import { useEffect } from "react";
import { keyboardManager } from "@/lib/utils/keyboard";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";

export function GlobalHotkeys() {
  const { currentBoardId, boards, selectBoard } = useBoardStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    if (!settings.enableKeyboardShortcuts) return;

    // Global task creation (Ctrl/Cmd + K) - trigger BoardView dialog
    keyboardManager.registerShortcut({
      key: 'k',
      ctrl: true,
      action: () => {
        if (currentBoardId) {
          document.dispatchEvent(new CustomEvent('show-create-task-dialog'));
        }
      },
      description: 'Quick add task',
      category: 'Global'
    });

    // Alternative for Mac (Cmd + K)
    keyboardManager.registerShortcut({
      key: 'k',
      meta: true,
      action: () => {
        if (currentBoardId) {
          document.dispatchEvent(new CustomEvent('show-create-task-dialog'));
        }
      },
      description: 'Quick add task (Mac)',
      category: 'Global'
    });

    // Simple 'n' key for new task - trigger BoardView dialog
    keyboardManager.registerShortcut({
      key: 'n',
      action: () => {
        if (currentBoardId) {
          document.dispatchEvent(new CustomEvent('show-create-task-dialog'));
        }
      },
      description: 'Create new task',
      category: 'Tasks'
    });

    // Board navigation (1-9 for first 9 boards)
    for (let i = 1; i <= 9; i++) {
      const boardIndex = i - 1;
      if (boardIndex < boards.length) {
        keyboardManager.registerShortcut({
          key: i.toString(),
          ctrl: true,
          action: () => {
            const board = boards[boardIndex];
            if (board) {
              selectBoard(board.id);
            }
          },
          description: `Switch to board ${i}`,
          category: 'Navigation'
        });

        // Alternative for Mac
        keyboardManager.registerShortcut({
          key: i.toString(),
          meta: true,
          action: () => {
            const board = boards[boardIndex];
            if (board) {
              selectBoard(board.id);
            }
          },
          description: `Switch to board ${i} (Mac)`,
          category: 'Navigation'
        });
      }
    }

    // Help dialog (F1 or ?)
    keyboardManager.registerShortcut({
      key: 'F1',
      action: () => {
        // This will be handled by the main app to show help dialog
        document.dispatchEvent(new CustomEvent('show-help-dialog'));
      },
      description: 'Show help',
      category: 'Help'
    });

    // Show keyboard shortcuts with 'h' key
    keyboardManager.registerShortcut({
      key: 'h',
      action: () => {
        document.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
      },
      description: 'Show keyboard shortcuts',
      category: 'Help'
    });

    // Settings (Ctrl/Cmd + ,)
    keyboardManager.registerShortcut({
      key: ',',
      ctrl: true,
      action: () => {
        document.dispatchEvent(new CustomEvent('show-settings-dialog'));
      },
      description: 'Open settings',
      category: 'Global'
    });

    keyboardManager.registerShortcut({
      key: ',',
      meta: true,
      action: () => {
        document.dispatchEvent(new CustomEvent('show-settings-dialog'));
      },
      description: 'Open settings (Mac)',
      category: 'Global'
    });

    keyboardManager.startListening();

    return () => {
      keyboardManager.stopListening();
    };
  }, [settings.enableKeyboardShortcuts, currentBoardId, boards, selectBoard]);

  // This component now just registers shortcuts, doesn't render anything
  return null;
}