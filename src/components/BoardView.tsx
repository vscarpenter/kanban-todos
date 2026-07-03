"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { Board, Task } from "@/lib/types";
import { TaskDialog } from "./TaskDialog";
import { EmptyState } from "./board/EmptyState";
import { BoardHeader } from "./board/BoardHeader";
import { BoardStats } from "./board/BoardStats";
import { KanbanBoard } from "./board/KanbanBoard";
import { CrossBoardGroups } from "./board/CrossBoardGroups";
import { BoardNavigationProvider } from "./board/BoardNavigationContext";
import { logger } from "@/lib/utils/logger";

export function BoardView() {
  const { currentBoardId, getCurrentBoard, boards, selectBoard } = useBoardStore();
  const { filteredTasks, filters, searchState, isLoading, error, setHighlightedTask, clearSearch } = useTaskStore();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [initialStatus, setInitialStatus] = useState<Task['status']>('todo');


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
      logger.error('Failed to navigate to board', error);
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

  // A store error (e.g. a failed mutation) shouldn't hide the user's
  // existing board behind a full-page error screen — surface it as a toast
  // instead, so the board stays usable while the user retries.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Handle add task from column button
  const handleAddTask = useCallback((status: Task['status']) => {
    setInitialStatus(status);
    setShowCreateTask(true);
  }, []);

  // Determine which tasks to show based on search mode
  const isSearchActive = filters.search.length > 0;
  const isCrossBoardSearch = filters.crossBoardSearch && isSearchActive;

  // Memoized so BoardView's own re-renders (e.g. an unrelated parent state
  // change) don't hand children a fresh array/object reference every time —
  // that would defeat KanbanBoard's own useMemo one level down, which is
  // keyed on referential identity of `tasks`. Must run before any early
  // return below (Rules of Hooks).
  const { displayTasks, boardGroups } = useMemo(() => {
    if (isCrossBoardSearch) {
      // Show all filtered tasks from all boards during cross-board search
      const tasks = filteredTasks.filter(task => !task.archivedAt);

      // Group tasks by board for cross-board display
      const boardById = new Map(boards.map(b => [b.id, b]));
      const groups: Record<string, { board: Board; tasks: Task[] }> = {};
      for (const task of tasks) {
        const taskBoard = boardById.get(task.boardId);
        if (taskBoard) {
          if (!groups[task.boardId]) {
            groups[task.boardId] = { board: taskBoard, tasks: [] };
          }
          groups[task.boardId].tasks.push(task);
        }
      }
      return { displayTasks: tasks, boardGroups: groups };
    }

    // Show only tasks from current board
    return {
      displayTasks: filteredTasks.filter(task => task.boardId === currentBoardId && !task.archivedAt),
      boardGroups: {} as Record<string, { board: Board; tasks: Task[] }>,
    };
  }, [filteredTasks, boards, isCrossBoardSearch, currentBoardId]);

  if (!currentBoard) {
    return <EmptyState type="no-board" />;
  }

  if (isLoading) {
    return <EmptyState type="loading" />;
  }

  return (
    <BoardNavigationProvider value={handleNavigateToBoard}>
    <div className="h-full flex flex-col">
      <BoardHeader
        board={currentBoard}
        isCrossBoardSearch={isCrossBoardSearch}
        searchQuery={filters.search}
        boardGroupsCount={Object.keys(boardGroups).length}
        tasks={displayTasks}
        onCreateTask={() => handleAddTask('todo')}
      />

      <div className="pb-5" style={{ background: "var(--paper-0)" }}>
        <BoardStats
          tasks={displayTasks}
          isCrossBoardSearch={isCrossBoardSearch}
          boardGroups={boardGroups}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 pb-8">
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
            onAddTask={handleAddTask}
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

      {/* Create Task Dialog — only render when a board is selected */}
      {currentBoardId && (
        <TaskDialog
          mode="create"
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          boardId={currentBoardId}
          initialStatus={initialStatus}
        />
      )}
    </div>
    </BoardNavigationProvider>
  );
}
