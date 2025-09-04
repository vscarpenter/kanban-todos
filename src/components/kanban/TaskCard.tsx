"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, Board } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BoardIndicator } from "../BoardIndicator";
import { 
  MoreHorizontal, 
  Calendar, 
  Clock,
  Tag, 
  Flag,
  Edit,
  Archive,
  Trash2,
  Share,
  Move,
  AlertTriangle
} from "@/lib/icons";
import { getIOSTouchClasses } from "@/lib/utils/iosDetection";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/lib/stores/taskStore";
import { formatDistanceToNow } from "date-fns";
import { EditTaskDialog } from "../EditTaskDialog";
import { ShareTaskDialog } from "../ShareTaskDialog";
import { MoveTaskDialog } from "../MoveTaskDialog";
import { DeleteTaskDialog } from "../DeleteTaskDialog";

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
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteTask, archiveTask } = useTaskStore();
  
  // Get iOS-specific CSS classes for touch optimization
  const iosTouchClasses = useMemo(() => getIOSTouchClasses(), []);
  
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

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    await deleteTask(task.id);
  }, [deleteTask, task.id]);

  const handleArchive = useCallback(async () => {
    await archiveTask(task.id);
  }, [archiveTask, task.id]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Only navigate if we have a board and navigation handler, and it's not the current board
    if (showBoardIndicator && board && !isCurrentBoard && onNavigateToBoard) {
      // Prevent navigation if clicking on interactive elements
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

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <Flag className="h-3 w-3 fill-red-600 text-red-600" />;
      case 'medium':
        return <Flag className="h-3 w-3 fill-yellow-600 text-yellow-600" />;
      case 'low':
        return <Flag className="h-3 w-3 fill-green-600 text-green-600" />;
      default:
        return <Flag className="h-3 w-3" />;
    }
  };

  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < now && task.status !== 'done';
    const isDueSoon = dueDate > now && (dueDate.getTime() - now.getTime()) <= (24 * 60 * 60 * 1000); // Within 24 hours
    
    return { isOverdue, isDueSoon, dueDate };
  };

  const formatDueDate = (dueDate: Date) => {
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    
    // If due within 24 hours, show relative time
    if (Math.abs(timeDiff) <= (24 * 60 * 60 * 1000)) {
      return formatDistanceToNow(dueDate, { addSuffix: true });
    }
    
    // Otherwise show date
    return dueDate.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

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
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing draggable-element touch-optimized ${iosTouchClasses.join(' ')} ${
          showBoardIndicator && !isCurrentBoard ? 'cursor-pointer' : ''
        }`}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        tabIndex={showBoardIndicator && !isCurrentBoard ? 0 : -1}
        role={showBoardIndicator && !isCurrentBoard ? 'button' : undefined}
        aria-label={showBoardIndicator && !isCurrentBoard && board ? `Navigate to task "${task.title}" on board "${board.name}"` : undefined}
        data-task-id={task.id}
      >
        <Card 
          className={`hover:shadow-md transition-all duration-200 ${
            showBoardIndicator && !isCurrentBoard ? 'hover:bg-accent/50 hover:border-accent-foreground/30' : ''
          } focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`}
          role="article"
          aria-labelledby={`task-title-${task.id}`}
          aria-describedby={`task-meta-${task.id}`}
        >
          <CardContent className="p-4">
            {/* Board Indicator - Top Right */}
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Task options for ${task.title}`}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                    <Share className="h-4 w-4 mr-2" />
                    Share Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                    <Move className="h-4 w-4 mr-2" />
                    Move to Board
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Task Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Task Metadata */}
            <div id={`task-meta-${task.id}`} className="space-y-2">
              {/* Priority */}
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{getPriorityIcon(task.priority)}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getPriorityColor(task.priority)}`}
                  aria-label={`Priority: ${task.priority}`}
                >
                  {task.priority}
                </Badge>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap" role="list" aria-label="Task tags">
                  <Tag className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  {task.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs" role="listitem">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground" role="listitem">
                      +{task.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Progress Bar - Only show for in-progress tasks */}
              {task.status === 'in-progress' && task.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{task.progress}%</span>
                  </div>
                  <div 
                    className="w-full bg-secondary rounded-full h-2"
                    role="progressbar"
                    aria-valuenow={task.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Task progress: ${task.progress}% complete`}
                  >
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Due Date */}
              {(() => {
                const dueDateStatus = getDueDateStatus();
                if (!dueDateStatus) return null;
                
                const { isOverdue, isDueSoon, dueDate } = dueDateStatus;
                
                return (
                  <div 
                    className={`flex items-center gap-1 text-xs ${
                      isOverdue 
                        ? 'text-red-600 dark:text-red-400' 
                        : isDueSoon 
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-muted-foreground'
                    }`}
                    role={isOverdue ? 'alert' : undefined}
                    aria-label={`Due date: ${formatDueDate(dueDate)}${isOverdue ? ' (Overdue)' : isDueSoon ? ' (Due soon)' : ''}`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Clock className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span>{formatDueDate(dueDate)}</span>
                    {isOverdue && <span className="font-medium">(Overdue)</span>}
                  </div>
                );
              })()}

              {/* Created Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>
                  {task.completedAt 
                    ? `Completed ${formatDistanceToNow(new Date(task.completedAt))} ago`
                    : `Created ${formatDistanceToNow(new Date(task.createdAt))} ago`
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={task}
      />

      {/* Share Task Dialog */}
      <ShareTaskDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        task={task}
      />

      {/* Move Task Dialog */}
      <MoveTaskDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        task={task}
      />

      {/* Delete Task Dialog */}
      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        task={task}
        onConfirm={confirmDelete}
      />
    </>
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
