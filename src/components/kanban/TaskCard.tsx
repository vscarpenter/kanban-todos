"use client";

import { useState, memo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Calendar, 
  Tag, 
  Flag,
  Edit,
  Archive,
  Trash2,
  Share,
  Move
} from "lucide-react";
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

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const { deleteTask, archiveTask } = useTaskStore();
  
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

  const handleDelete = useCallback(async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  }, [deleteTask, task.id]);

  const handleArchive = useCallback(async () => {
    await archiveTask(task.id);
  }, [archiveTask, task.id]);

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
        className="cursor-grab active:cursor-grabbing"
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {/* Task Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-medium text-foreground text-sm leading-tight flex-1">
                {task.title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
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
            <div className="space-y-2">
              {/* Priority */}
              <div className="flex items-center gap-2">
                {getPriorityIcon(task.priority)}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </Badge>
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {task.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
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
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out" 
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
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
    JSON.stringify(prevTask.tags) === JSON.stringify(nextTask.tags)
  );
});
