"use client";

import { useState, useCallback, useEffect } from "react";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { Board, Task } from "@/lib/types";
import { TaskDialog } from "./TaskDialog";
import { EmptyState } from "./board/EmptyState";
import { BoardHeader } from "./board/BoardHeader";
import { BoardStats } from "./board/BoardStats";
import { KanbanBoard } from "./board/KanbanBoard";
import { CrossBoardGroups } from "./board/CrossBoardGroups";

export function BoardView() {
  const { currentBoardId, getCurrentBoard, boards, selectBoard } = useBoardStore();
  const { filteredTasks, filters, searchState, isLoading, error, setHighlightedTask, clearSearch } = useTaskStore();
  const [showCreateTask, setShowCreateTask] = useState(false);
  
  
  const currentBoard = getCurrentBoard();

  // Handle board navigation from search results
  const handleNavigateToBoard = useCallback(async (boardId: string, taskId: string) => {
    try {
      // Set the highlighted task before navigating
      setHighlightedTask(taskId);
      
      // Navigate to the target board
      await selectBoard(boardId);
      
      // Clear the search to show the full board context
      clearSearch();
      
      // Clear the highlight after a short delay to allow user to see the task
      setTimeout(() => {
        setHighlightedTask(undefined);
      }, 3000);
    } catch (error) {
      console.error('Failed to navigate to board:', error);
    }
  }, [selectBoard, setHighlightedTask, clearSearch]);

  // Clear highlighted task when component mounts or board changes
  useEffect(() => {
    if (searchState.highlightedTaskId) {
      const timer = setTimeout(() => {
        setHighlightedTask(undefined);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentBoardId, searchState.highlightedTaskId, setHighlightedTask]);
  
  if (!currentBoard) {
    return <EmptyState type="no-board" />;
  }

  if (isLoading) {
    return <EmptyState type="loading" />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Determine which tasks to show based on search mode
  const isSearchActive = filters.search.length > 0;
  const isCrossBoardSearch = filters.crossBoardSearch && isSearchActive;
  
  let displayTasks;
  const boardGroups: Record<string, { board: Board; tasks: Task[] }> = {};
  
  if (isCrossBoardSearch) {
    // Show all filtered tasks from all boards during cross-board search
    displayTasks = filteredTasks.filter(task => !task.archivedAt);
    
    // Group tasks by board for cross-board display
    displayTasks.forEach(task => {
      const taskBoard = boards.find(b => b.id === task.boardId);
      if (taskBoard) {
        if (!boardGroups[task.boardId]) {
          boardGroups[task.boardId] = { board: taskBoard, tasks: [] };
        }
        boardGroups[task.boardId].tasks.push(task);
      }
    });
  } else {
    // Show only tasks from current board
    displayTasks = filteredTasks.filter(task => 
      task.boardId === currentBoardId && !task.archivedAt
    );
  }

  

  return (
    <div className="h-full flex flex-col">
      <BoardHeader
        board={currentBoard}
        isCrossBoardSearch={isCrossBoardSearch}
        searchQuery={filters.search}
        boardGroupsCount={Object.keys(boardGroups).length}
        onCreateTask={() => setShowCreateTask(true)}
      />

      <div className="p-6 border-b border-border bg-background">
        <BoardStats
          tasks={displayTasks}
          isCrossBoardSearch={isCrossBoardSearch}
          boardGroups={boardGroups}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Empty States */}
        {isCrossBoardSearch && displayTasks.length === 0 && (
          <EmptyState
            type="no-search-results"
            searchQuery={filters.search}
            onClearSearch={clearSearch}
          />
        )}

        {!isCrossBoardSearch && displayTasks.length === 0 && isSearchActive && (
          <EmptyState
            type="no-board-results"
            searchQuery={filters.search}
            boardName={currentBoard.name}
            onClearSearch={clearSearch}
          />
        )}

        {/* Kanban Board */}
        {displayTasks.length > 0 && (
          <KanbanBoard
            tasks={displayTasks}
            onNavigateToBoard={handleNavigateToBoard}
          />
        )}

        {/* Cross-Board Groups */}
        {isCrossBoardSearch && displayTasks.length > 0 && (
          <CrossBoardGroups
            boardGroups={boardGroups}
            onNavigateToBoard={handleNavigateToBoard}
          />
        )}
      </div>

      {/* Create Task Dialog */}
      <TaskDialog
        mode="create"
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        boardId={currentBoardId!}
      />
    </div>
  );
}