"use client";

import { memo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, Board } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { BoardIndicator } from "../BoardIndicator";
import { TaskCardActions } from "./TaskCardActions";
import { TaskCardMetadata } from "./TaskCardMetadata";

interface TaskCardProps {
  task: Task;
  showBoardIndicator?: boolean;
  board?: Board;
  isCurrentBoard?: boolean;
  onNavigateToBoard?: (boardId: string, taskId: string) => void;
}

export function TaskCard({
  task,
  showBoardIndicator = false,
  board,
  isCurrentBoard = true,
  onNavigateToBoard
}: TaskCardProps) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (showBoardIndicator && board && !isCurrentBoard && onNavigateToBoard) {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="menuitem"]')) {
        return;
      }
      onNavigateToBoard(board.id, task.id);
    }
  }, [showBoardIndicator, board, isCurrentBoard, onNavigateToBoard, task.id]);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showBoardIndicator && board && !isCurrentBoard && onNavigateToBoard) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNavigateToBoard(board.id, task.id);
      }
    }
  }, [showBoardIndicator, board, isCurrentBoard, onNavigateToBoard, task.id]);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50"
      >
        <Card className="h-24 bg-muted/50 border-dashed" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing draggable-element touch-optimized ${showBoardIndicator && !isCurrentBoard ? 'cursor-pointer' : ''
        }`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={showBoardIndicator && !isCurrentBoard ? 0 : -1}
      role={showBoardIndicator && !isCurrentBoard ? 'button' : undefined}
      aria-label={showBoardIndicator && !isCurrentBoard && board ? `Navigate to task "${task.title}" on board "${board.name}"` : undefined}
      data-task-id={task.id}
    >
      <Card
        className={`hover:shadow-md transition-all duration-200 ${showBoardIndicator && !isCurrentBoard ? 'hover:bg-accent/50 hover:border-accent-foreground/30' : ''
          } focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}
        role="article"
        aria-labelledby={`task-title-${task.id}`}
        aria-describedby={`task-meta-${task.id}`}
      >
        <CardContent className="p-4">
          {/* Board Indicator */}
          {showBoardIndicator && board && (
            <div className="flex justify-end mb-2">
              <BoardIndicator
                board={board}
                isCurrentBoard={isCurrentBoard}
                size="sm"
                showName={true}
              />
            </div>
          )}

          {/* Task Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3
              id={`task-title-${task.id}`}
              className="font-medium text-foreground text-sm leading-tight flex-1"
            >
              {task.title}
            </h3>
            <TaskCardActions task={task} />
          </div>

          {/* Task Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Task Metadata */}
          <TaskCardMetadata task={task} />
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(TaskCard, (prevProps, nextProps) => {
  const prevTask = prevProps.task;
  const nextTask = nextProps.task;

  return (
    prevTask.id === nextTask.id &&
    prevTask.title === nextTask.title &&
    prevTask.description === nextTask.description &&
    prevTask.status === nextTask.status &&
    prevTask.priority === nextTask.priority &&
    prevTask.progress === nextTask.progress &&
    prevTask.updatedAt.getTime() === nextTask.updatedAt.getTime() &&
    JSON.stringify(prevTask.tags) === JSON.stringify(nextTask.tags) &&
    prevProps.showBoardIndicator === nextProps.showBoardIndicator &&
    prevProps.isCurrentBoard === nextProps.isCurrentBoard &&
    prevProps.board?.id === nextProps.board?.id &&
    prevProps.board?.name === nextProps.board?.name &&
    prevProps.board?.color === nextProps.board?.color
  );
});
