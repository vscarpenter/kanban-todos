"use client";

import { Task } from "@/lib/types";
import {
  PRIORITY_BADGE_TOKENS,
  getDueDateStatus,
  formatDueDate,
  getDueDateIcon,
} from "@/lib/utils/taskCardHelpers";

interface TaskCardMetadataProps {
  task: Task;
}

interface PriorityBadgeProps {
  priority: Task["priority"];
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const tokens = PRIORITY_BADGE_TOKENS[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{
        padding: "3px 8px 3px 7px",
        background: tokens.bg,
        color: tokens.fg,
        border: "1px solid var(--hairline)",
        fontSize: "11px",
        fontWeight: 500,
        lineHeight: 1.4,
      }}
      aria-label={`Priority: ${priority}`}
    >
      <span
        className="block h-1.5 w-1.5 rounded-full"
        style={{ background: tokens.dot }}
        aria-hidden="true"
      />
      {priority}
    </span>
  );
}

interface TagChipProps {
  label: string;
}

function TagChip({ label }: TagChipProps) {
  return (
    <span
      className="font-mono inline-flex items-center"
      style={{
        padding: "2px 7px",
        background: "var(--paper-1)",
        color: "var(--ink-3)",
        border: "1px solid var(--hairline)",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: 500,
      }}
      role="listitem"
    >
      {label}
    </span>
  );
}

/**
 * Card metadata — priority badge + tags + optional progress + dashed-top
 * due date footer. Overdue dates render in amber (warn-500) per the
 * "softer signal" direction, with the AlertTriangle icon.
 */
export function TaskCardMetadata({ task }: TaskCardMetadataProps) {
  const dueDateStatus = getDueDateStatus(task);
  const hasBadges = task.priority !== "medium" || task.tags.length > 0;
  const showProgress = task.status === "in-progress" && task.progress !== undefined;

  return (
    <div id={`task-meta-${task.id}`}>
      {showProgress && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>Progress</span>
            <span
              className="font-mono"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--ink-2)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {task.progress}%
            </span>
          </div>
          <div
            className="mt-1.5 w-full rounded-full overflow-hidden"
            style={{ background: "var(--paper-2)", height: "4px" }}
            role="progressbar"
            aria-valuenow={task.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Task progress: ${task.progress}% complete`}
          >
            <div
              className="h-full transition-all duration-300 ease-in-out"
              style={{
                width: `${task.progress}%`,
                background: "linear-gradient(90deg, var(--accent-400), var(--accent-500))",
              }}
            />
          </div>
        </div>
      )}

      {hasBadges && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {/* Priority always shown except for the default "medium" */}
          {task.priority !== "medium" && <PriorityBadge priority={task.priority} />}
          {task.tags.length > 0 && (
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="list"
              aria-label="Task tags"
            >
              {task.tags.slice(0, 3).map((tag, index) => (
                <TagChip key={`${tag}-${index}`} label={tag} />
              ))}
              {task.tags.length > 3 && (
                <span
                  role="listitem"
                  style={{ fontSize: "11px", color: "var(--ink-4)" }}
                >
                  +{task.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {dueDateStatus && (
        <div
          className="mt-2.5 pt-2.5 flex items-center gap-1.5"
          style={{
            borderTop: "1px dashed var(--hairline)",
            color: dueDateStatus.isOverdue ? "var(--warn-500)" : "var(--ink-3)",
          }}
          role={dueDateStatus.isOverdue ? "alert" : undefined}
          aria-label={`Due date: ${formatDueDate(dueDateStatus.dueDate)}${dueDateStatus.isOverdue ? " (Overdue)" : ""}`}
        >
          {getDueDateIcon(dueDateStatus.isOverdue)}
          <span
            className="font-mono"
            style={{
              fontSize: "11.5px",
              fontWeight: dueDateStatus.isOverdue ? 500 : 400,
              fontFeatureSettings: '"tnum"',
            }}
          >
            {formatDueDate(dueDateStatus.dueDate)}
            {dueDateStatus.isOverdue && (
              <>
                <span className="mx-1.5">·</span>Overdue
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
