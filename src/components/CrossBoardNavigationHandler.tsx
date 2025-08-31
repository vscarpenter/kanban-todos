"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";

interface CrossBoardNavigationHandlerProps {
  children: React.ReactNode;
}

export function CrossBoardNavigationHandler({ children }: CrossBoardNavigationHandlerProps) {
  const { navigateToTaskBoard } = useTaskStore();
  const { setCurrentBoard, boards } = useBoardStore();

  // Handle cross-board navigation with error handling and focus management
  const handleCrossBoardNavigation = useCallback(async (taskId: string) => {
    try {
      const result = await navigateToTaskBoard(taskId);
      
      if (!result.success) {
        toast.error("Navigation Failed", {
          description: result.error,
          action: {
            label: "Dismiss",
            onClick: () => {},
          },
        });
        return false;
      }
      
      if (result.boardId) {
        // Check if board exists in current boards
        const targetBoard = boards.find(b => b.id === result.boardId);
        if (!targetBoard) {
          toast.error("Board Not Found", {
            description: "The board containing this task is no longer available.",
            action: {
              label: "Refresh",
              onClick: () => window.location.reload(),
            },
          });
          return false;
        }
        
        // Navigate to the board
        await setCurrentBoard(result.boardId);
        
        // Focus management: Focus the task after navigation
        setTimeout(() => {
          const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
          if (taskElement && taskElement instanceof HTMLElement) {
            taskElement.focus();
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add temporary highlight effect
            taskElement.style.outline = '2px solid hsl(var(--ring))';
            taskElement.style.outlineOffset = '2px';
            setTimeout(() => {
              taskElement.style.outline = '';
              taskElement.style.outlineOffset = '';
            }, 2000);
          } else {
            // Fallback: focus the main content area
            const mainContent = document.querySelector('main');
            if (mainContent && mainContent instanceof HTMLElement) {
              mainContent.focus();
            }
          }
        }, 100);
        
        toast.success("Navigation Successful", {
          description: `Switched to "${targetBoard.name}" board`,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Cross-board navigation error:', error);
      toast.error("Navigation Error", {
        description: "An unexpected error occurred while navigating to the task.",
        action: {
          label: "Try Again",
          onClick: () => handleCrossBoardNavigation(taskId),
        },
      });
      return false;
    }
  }, [navigateToTaskBoard, boards, setCurrentBoard]);

  // Listen for navigation events from task cards
  useEffect(() => {
    const handleTaskNavigation = (event: CustomEvent<{ taskId: string }>) => {
      handleCrossBoardNavigation(event.detail.taskId);
    };

    window.addEventListener('navigate-to-task-board', handleTaskNavigation as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-task-board', handleTaskNavigation as EventListener);
    };
  }, [boards, handleCrossBoardNavigation]);

  // Listen for board deletion events to clean up tasks
  useEffect(() => {
    const handleBoardDeletion = (event: CustomEvent<{ boardId: string }>) => {
      const { handleBoardDeletion } = useTaskStore.getState();
      handleBoardDeletion(event.detail.boardId);
      
      toast.info("Board Deleted", {
        description: "Tasks from the deleted board have been removed from search results.",
      });
    };

    window.addEventListener('board-deleted', handleBoardDeletion as EventListener);
    
    return () => {
      window.removeEventListener('board-deleted', handleBoardDeletion as EventListener);
    };
  }, []);

  return <>{children}</>;
}

// Utility function to trigger cross-board navigation
export const triggerCrossBoardNavigation = (taskId: string) => {
  const event = new CustomEvent('navigate-to-task-board', {
    detail: { taskId }
  });
  window.dispatchEvent(event);
};

// Utility function to notify about board deletion
export const notifyBoardDeletion = (boardId: string) => {
  const event = new CustomEvent('board-deleted', {
    detail: { boardId }
  });
  window.dispatchEvent(event);
};