"use client";

import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { KanbanColumn } from "./kanban/KanbanColumn";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Task } from "@/lib/types";

export function BoardView() {
  const { currentBoardId, getCurrentBoard } = useBoardStore();
  const { tasks, filteredTasks, isLoading, error, moveTask } = useTaskStore();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const currentBoard = getCurrentBoard();
  
  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t: Task) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'task') {
      const taskId = active.id as string;
      const newStatus = over.id as Task['status'];
      
      // Check if the drop target is a valid column status
      if (newStatus && ['todo', 'in-progress', 'done'].includes(newStatus)) {
        moveTask(taskId, newStatus);
      }
    }
    
    setActiveTask(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'task') {
      const newStatus = over.id as Task['status'];
      
      // Check if the drop target is a valid column status
      if (newStatus && ['todo', 'in-progress', 'done'].includes(newStatus)) {
        // Optional: Preview the move without committing
        // This could show a visual indicator that the task can be dropped here
      }
    }
  };
  
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

  const boardTasks = filteredTasks.filter(task => 
    task.boardId === currentBoardId && !task.archivedAt
  );

  const todoTasks = boardTasks.filter(task => task.status === 'todo');
  const inProgressTasks = boardTasks.filter(task => task.status === 'in-progress');
  const doneTasks = boardTasks.filter(task => task.status === 'done');

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
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
          </div>
          <Button onClick={() => setShowCreateTask(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        {/* Board Stats */}
        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
          <span>Total Tasks: {boardTasks.length}</span>
          <span>To Do: {todoTasks.length}</span>
          <span>In Progress: {inProgressTasks.length}</span>
          <span>Done: {doneTasks.length}</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <KanbanColumn
              title="To Do"
              tasks={todoTasks}
              status="todo"
              color="bg-blue-50 dark:bg-blue-950/20"
              borderColor="border-blue-200 dark:border-blue-800"
            />
            
            <KanbanColumn
              title="In Progress"
              tasks={inProgressTasks}
              status="in-progress"
              color="bg-yellow-50 dark:bg-yellow-950/20"
              borderColor="border-yellow-200 dark:border-yellow-800"
            />
            
            <KanbanColumn
              title="Done"
              tasks={doneTasks}
              status="done"
              color="bg-green-50 dark:bg-green-950/20"
              borderColor="border-green-200 dark:border-green-800"
            />
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
                <h3 className="font-medium text-foreground text-sm">{activeTask.title}</h3>
                {activeTask.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {activeTask.description}
                  </p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
