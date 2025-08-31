"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { Board, Task } from "@/lib/types";
import KanbanColumn from "./kanban/KanbanColumn";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "@/lib/icons";

// Lazy load drag-and-drop functionality to reduce initial bundle size
const DragDropProvider = dynamic(() => import("./DragDropProvider").then(mod => ({ default: mod.DragDropProvider })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading board...</div></div>,
  ssr: false
});

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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Board Selected</h3>
          <p className="text-muted-foreground">Please select a board from the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Board</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
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

  const todoTasks = displayTasks.filter(task => task.status === 'todo');
  const inProgressTasks = displayTasks.filter(task => task.status === 'in-progress');
  const doneTasks = displayTasks.filter(task => task.status === 'done');
  
  // Calculate board-specific stats for cross-board search
  const boardStats = isCrossBoardSearch ? Object.entries(boardGroups).map(([boardId, group]) => ({
    boardId,
    board: group.board,
    totalTasks: group.tasks.length,
    todoTasks: group.tasks.filter(t => t.status === 'todo').length,
    inProgressTasks: group.tasks.filter(t => t.status === 'in-progress').length,
    doneTasks: group.tasks.filter(t => t.status === 'done').length,
  })) : [];
  

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            {isCrossBoardSearch ? (
              <>
                <h1 className="text-3xl font-bold text-foreground">
                  Cross-Board Search Results
                </h1>
                <p className="text-muted-foreground mt-2">
                  Showing results from {Object.keys(boardGroups).length} board{Object.keys(boardGroups).length !== 1 ? 's' : ''}
                  {filters.search && ` for "${filters.search}"`}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: currentBoard.color }}
                  />
                  {currentBoard.name}
                </h1>
                {currentBoard.description && (
                  <p className="text-muted-foreground mt-2">{currentBoard.description}</p>
                )}
              </>
            )}
          </div>
          <Button onClick={() => setShowCreateTask(true)} disabled={isCrossBoardSearch}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        {/* Board Stats */}
        {isCrossBoardSearch ? (
          <div className="mt-4 space-y-3">
            {/* Overall Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Total Tasks: {displayTasks.length}</span>
              <span>To Do: {todoTasks.length}</span>
              <span>In Progress: {inProgressTasks.length}</span>
              <span>Done: {doneTasks.length}</span>
            </div>
            
            {/* Board-specific Stats */}
            {boardStats.length > 0 && (
              <div className="flex flex-wrap gap-4 text-xs">
                {boardStats.map(({ boardId, board, totalTasks, todoTasks: boardTodo, inProgressTasks: boardInProgress, doneTasks: boardDone }) => (
                  <div key={boardId} className="flex items-center gap-2 px-3 py-1 bg-accent/50 rounded-md">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: board.color }}
                    />
                    <span className="font-medium">{board.name}:</span>
                    <span className="text-muted-foreground">
                      {totalTasks} ({boardTodo} todo, {boardInProgress} in progress, {boardDone} done)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <span>Total Tasks: {displayTasks.length}</span>
            <span>To Do: {todoTasks.length}</span>
            <span>In Progress: {inProgressTasks.length}</span>
            <span>Done: {doneTasks.length}</span>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-6">
        {/* Empty State for Cross-Board Search */}
        {isCrossBoardSearch && displayTasks.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search 
                  ? `No tasks found matching "${filters.search}" across all boards.`
                  : "No tasks found across all boards with the current filters."
                }
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  clearSearch();
                }}
              >
                Clear Search
              </Button>
            </div>
          </div>
        )}

        {/* Empty State for Single Board */}
        {!isCrossBoardSearch && displayTasks.length === 0 && isSearchActive && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search 
                  ? `No tasks found matching "${filters.search}" in ${currentBoard.name}.`
                  : "No tasks found in this board with the current filters."
                }
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  clearSearch();
                }}
              >
                Clear Search
              </Button>
            </div>
          </div>
        )}

        {/* Normal Kanban Board Display */}
        {displayTasks.length > 0 && (
          <DragDropProvider>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-full">
              <KanbanColumn
                title="To Do"
                tasks={todoTasks}
                status="todo"
                color="bg-blue-50 dark:bg-blue-950/20"
                borderColor="border-blue-200 dark:border-blue-800"
                onNavigateToBoard={handleNavigateToBoard}
              />
              
              <KanbanColumn
                title="In Progress"
                tasks={inProgressTasks}
                status="in-progress"
                color="bg-yellow-50 dark:bg-yellow-950/20"
                borderColor="border-yellow-200 dark:border-yellow-800"
                onNavigateToBoard={handleNavigateToBoard}
              />
              
              <KanbanColumn
                title="Done"
                tasks={doneTasks}
                status="done"
                color="bg-green-50 dark:bg-green-950/20"
                borderColor="border-green-200 dark:border-green-800"
                onNavigateToBoard={handleNavigateToBoard}
              />
            </div>
          </DragDropProvider>
        )}

        {/* Board Grouping for Cross-Board Search (Alternative Layout) */}
        {isCrossBoardSearch && displayTasks.length > 0 && Object.keys(boardGroups).length > 1 && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Tasks by Board</h3>
            <div className="space-y-6">
              {Object.entries(boardGroups).map(([boardId, { board, tasks }]) => (
                <div key={boardId} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: board.color }}
                    />
                    <h4 className="font-medium text-foreground">{board.name}</h4>
                    <span className="text-sm text-muted-foreground">({tasks.length} tasks)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNavigateToBoard(boardId, tasks[0]?.id || '')}
                      className="ml-auto"
                    >
                      View Board
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['todo', 'in-progress', 'done'].map((status) => {
                      const statusTasks = tasks.filter(t => t.status === status);
                      return (
                        <div key={status} className="space-y-2">
                          <h5 className="text-sm font-medium text-muted-foreground capitalize">
                            {status.replace('-', ' ')} ({statusTasks.length})
                          </h5>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {statusTasks.slice(0, 3).map((task) => (
                              <div 
                                key={task.id}
                                className="text-sm p-2 bg-accent/30 rounded border cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => handleNavigateToBoard(boardId, task.id)}
                              >
                                <div className="font-medium truncate">{task.title}</div>
                                {task.description && (
                                  <div className="text-muted-foreground text-xs truncate mt-1">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                            ))}
                            {statusTasks.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center py-1">
                                +{statusTasks.length - 3} more tasks
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        boardId={currentBoardId!}
      />
    </div>
  );
}