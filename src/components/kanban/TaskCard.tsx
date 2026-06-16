"use client";

import { memo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import isEqual from "fast-deep-equal";
import { Task, Board } from "@/lib/types";
import { BoardIndicator } from "../BoardIndicator";
import { TaskCardActions } from "./TaskCardActions";
import { TaskCardMetadata } from "./TaskCardMetadata";
import { useBoardNavigation } from "../board/BoardNavigationContext";

interface TaskCardProps {
  task: Task;
  showBoardIndicator?: boolean;
  board?: Board;
  isCurrentBoard?: boolean;
}

export function TaskCard({
  task,
  showBoardIndicator = false,
  board,
  isCurrentBoard = true,
}: TaskCardProps) {
  const navigateToBoard = useBoardNavigation();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = { transform: CSS.Translate.toString(transform) };

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (showBoardIndicator && board && !isCurrentBoard) {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest('[role="menuitem"]')) return;
        navigateToBoard(board.id, task.id);
      }
    },
    [showBoardIndicator, board, isCurrentBoard, navigateToBoard, task.id]
  );

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showBoardIndicator && board && !isCurrentBoard) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigateToBoard(board.id, task.id);
        }
      }
    },
    [showBoardIndicator, board, isCurrentBoard, navigateToBoard, task.id]
  );

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style}>
        <div className="h-24 drag-ghost animate-pulse" style={{ opacity: 0.4 }} />
      </div>
    );
  }

  const isNavigable = showBoardIndicator && !isCurrentBoard;
  const interactiveProps = isNavigable
    ? {
        onClick: handleCardClick,
        onKeyDown: handleCardKeyDown,
        tabIndex: 0,
        role: "button" as const,
      }
    : { tabIndex: -1, role: "article" as const };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        "task-card cursor-grab active:cursor-grabbing draggable-element touch-optimized",
        isNavigable ? "cursor-pointer" : "",
      ].join(" ")}
      {...interactiveProps}
      aria-label={
        isNavigable && board
          ? `Navigate to task "${task.title}" on board "${board.name}"`
          : undefined
      }
      aria-labelledby={!isNavigable ? `task-title-${task.id}` : undefined}
      aria-describedby={`task-meta-${task.id} task-priority-${task.id}`}
      data-task-id={task.id}
    >
      <span id={`task-priority-${task.id}`} className="sr-only">
        Priority: {task.priority}
      </span>

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

      <div className="flex items-start justify-between gap-2">
        <h3
          id={`task-title-${task.id}`}
          className="task-card__title flex-1"
        >
          {task.title}
        </h3>
        <TaskCardActions task={task} />
      </div>

      {task.description && (
        <p
          className="mt-1.5 line-clamp-2"
          style={{
            fontSize: "12.5px",
            fontWeight: 400,
            color: "var(--ink-3)",
            lineHeight: 1.5,
          }}
        >
          {task.description}
        </p>
      )}

      <TaskCardMetadata task={task} />
    </div>
  );
}

export default memo(TaskCard, isEqual);
