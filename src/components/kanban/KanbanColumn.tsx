"use client";

import { memo } from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import isEqual from "fast-deep-equal";
import { Task } from "@/lib/types";
import TaskCard from "./TaskCard";
import { Plus } from "@/lib/icons";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";

const STATUS_DOT_COLOR: Record<Task["status"], string> = {
  todo: "var(--info-500)",
  "in-progress": "var(--warn-500)",
  done: "var(--ok-500)",
};

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: Task["status"];
  onNavigateToBoard?: (boardId: string, taskId: string) => void;
}

export function KanbanColumn({ title, tasks, status, onNavigateToBoard }: KanbanColumnProps) {
  const { boards, currentBoardId } = useBoardStore();
  const {
    filters: { search: searchQuery, crossBoardSearch },
    searchState: { highlightedTaskId },
  } = useTaskStore();

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  // The active drag context tells us which task (if any) is being dragged.
  // We use it to decide whether to render the in-column drop placeholder:
  // only show when the drop would actually move the task to a new status,
  // not when a card is being dragged within its own column.
  const { active } = useDndContext();
  const activeTask = active?.data?.current?.task as Task | undefined;
  const showDropPlaceholder =
    isOver && activeTask !== undefined && activeTask.status !== status;

  const isSearchActive = searchQuery.length > 0;
  const isCrossBoardSearch = crossBoardSearch && isSearchActive;

  return (
    <div
      ref={setNodeRef}
      className="kanban-column min-h-0 min-w-full md:min-w-0 snap-center md:snap-align-none transition-colors duration-200"
      style={{
        height: "calc(100vh - 280px)",
        ...(isOver
          ? {
              borderColor: "var(--accent-400)",
              borderStyle: "dashed",
              borderWidth: "1.5px",
              background:
                "color-mix(in oklab, var(--accent-50) 60%, var(--paper-2))",
            }
          : undefined),
      }}
    >
      <div className="kanban-column__header">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span
            className="status-dot"
            style={{ background: STATUS_DOT_COLOR[status] }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--ink-1)",
            }}
          >
            {title}
          </span>
          <span className="kanban-column__count">{tasks.length}</span>
        </div>
        <button
          type="button"
          aria-label={`Add task to ${title}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--paper-1)]"
          style={{ color: "var(--ink-4)" }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto touch-pan-y overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex flex-col gap-2.5 min-h-[200px] pb-2">
          {tasks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12"
              style={{ color: "var(--ink-4)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center mb-3"
                style={{
                  borderColor: "var(--hairline-strong)",
                  animation: "empty-state-breathe 3s ease-in-out infinite",
                }}
              >
                <Plus className="h-5 w-5" style={{ color: "var(--ink-5)" }} />
              </div>
              <p style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--ink-3)" }}>
                No tasks yet
              </p>
              <p className="mt-0.5" style={{ fontSize: "11px", color: "var(--ink-4)" }}>
                Drag one here to start
              </p>
            </div>
          ) : (
            <>
              {tasks.map((task, index) => {
                const taskBoard = boards.find((b) => b.id === task.boardId);
                const isCurrentBoard = task.boardId === currentBoardId;
                const isHighlighted = highlightedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={[
                      "card-animate-in",
                      isHighlighted
                        ? "ring-2 ring-primary ring-offset-2 rounded-[10px] transition-all duration-300"
                        : "",
                    ].join(" ")}
                    style={{ animationDelay: `${index * 40}ms` }}
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
              })}
              {showDropPlaceholder && <DropPlaceholder />}
            </>
          )}
          {/* Empty-column case: still show placeholder when dropping into it */}
          {tasks.length === 0 && showDropPlaceholder && <DropPlaceholder />}
        </div>
      </div>
    </div>
  );
}

/**
 * Editorial drop placeholder card. Renders inside the target column at the
 * drop position. Spec: dashed accent-300 border, tinted accent-50 bg,
 * 10px radius, 16px padding, min-height 60px, centered "Drop to move task
 * here" text in 12/500/accent-600.
 */
function DropPlaceholder() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        border: "1.5px dashed var(--accent-300)",
        background: "color-mix(in oklab, var(--accent-50) 70%, transparent)",
        borderRadius: "10px",
        padding: "16px",
        minHeight: "60px",
        color: "var(--accent-600)",
        fontSize: "12px",
        fontWeight: 500,
      }}
      aria-hidden="true"
    >
      Drop to move task here
    </div>
  );
}

export default memo(KanbanColumn, isEqual);
