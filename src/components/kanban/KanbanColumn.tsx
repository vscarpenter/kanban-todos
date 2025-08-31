"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/lib/types";
import TaskCard from "./TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: Task['status'];
  color: string;
  borderColor: string;
  onNavigateToBoard?: (boardId: string, taskId: string) => void;
}

export function KanbanColumn({ title, tasks, status, color, borderColor, onNavigateToBoard }: KanbanColumnProps) {
  const { boards, currentBoardId } = useBoardStore();
  const { filters, searchState } = useTaskStore();

  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: status,
    data: {
      type: 'column',
      status,
    },
  });

  // Check if we're in cross-board search mode
  const isSearchActive = filters.search.length > 0;
  const isCrossBoardSearch = filters.crossBoardSearch && isSearchActive;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-0 ${color} ${borderColor} border-2 rounded-lg transition-colors ${
        isOver ? 'opacity-75 ring-2 ring-primary' : ''
      }`}
      style={{ height: 'calc(100vh - 280px)' }}
    >
      <Card className="flex flex-col h-full border-0 bg-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              {title}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 flex-1 overflow-y-auto">
          <div className="space-y-3 min-h-[200px] pb-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No tasks</p>
                <p className="text-xs">Drag tasks here or create new ones</p>
              </div>
            ) : (
              tasks.map((task) => {
                const taskBoard = boards.find(b => b.id === task.boardId);
                const isCurrentBoard = task.boardId === currentBoardId;
                const isHighlighted = searchState.highlightedTaskId === task.id;
                
                return (
                  <div 
                    key={task.id}
                    className={isHighlighted ? 'ring-2 ring-primary ring-offset-2 rounded-lg transition-all duration-300' : ''}
                  >
                    <TaskCard 
                      task={task}
                      showBoardIndicator={isCrossBoardSearch}
                      board={taskBoard}
                      isCurrentBoard={isCurrentBoard}
                      onNavigateToBoard={onNavigateToBoard}
                    />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(KanbanColumn, (prevProps, nextProps) => {
  // Always re-render if task array length changes
  if (prevProps.tasks.length !== nextProps.tasks.length) {
    return false;
  }
  
  // If tasks array is empty, only check other props
  if (prevProps.tasks.length === 0) {
    return (
      prevProps.title === nextProps.title &&
      prevProps.status === nextProps.status &&
      prevProps.color === nextProps.color &&
      prevProps.borderColor === nextProps.borderColor
    );
  }
  
  // Check if any task has been updated by comparing timestamps
  for (let i = 0; i < prevProps.tasks.length; i++) {
    const prevTask = prevProps.tasks[i];
    const nextTask = nextProps.tasks[i];
    
    if (
      prevTask.id !== nextTask.id ||
      prevTask.updatedAt.getTime() !== nextTask.updatedAt.getTime()
    ) {
      return false;
    }
  }
  
  // Compare other props
  return (
    prevProps.title === nextProps.title &&
    prevProps.status === nextProps.status &&
    prevProps.color === nextProps.color &&
    prevProps.borderColor === nextProps.borderColor
  );
});
