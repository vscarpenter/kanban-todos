"use client";

import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Tag, Calendar } from "@/lib/icons";
import { formatDistanceToNow } from "date-fns";
import {
  getPriorityColor,
  getPriorityIcon,
  getDueDateStatus,
  formatDueDate,
  getDueDateIcon,
  getDueDateClasses
} from "@/lib/utils/taskCardHelpers";

interface TaskCardMetadataProps {
  task: Task;
}

/**
 * Displays task metadata including priority, tags, progress, and dates
 */
export function TaskCardMetadata({ task }: TaskCardMetadataProps) {
  const dueDateStatus = getDueDateStatus(task);

  return (
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
      {dueDateStatus && (
        <div
          className={`flex items-center gap-1 text-xs ${getDueDateClasses(dueDateStatus.isOverdue, dueDateStatus.isDueSoon)}`}
          role={dueDateStatus.isOverdue ? 'alert' : undefined}
          aria-label={`Due date: ${formatDueDate(dueDateStatus.dueDate)}${dueDateStatus.isOverdue ? ' (Overdue)' : dueDateStatus.isDueSoon ? ' (Due soon)' : ''}`}
        >
          {getDueDateIcon(dueDateStatus.isOverdue)}
          <span>{formatDueDate(dueDateStatus.dueDate)}</span>
          {dueDateStatus.isOverdue && <span className="font-medium">(Overdue)</span>}
        </div>
      )}

      {/* Created/Completed Date */}
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
  );
}
