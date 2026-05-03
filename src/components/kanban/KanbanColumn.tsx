"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
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
            tasks.map((task, index) => {
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
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(KanbanColumn, isEqual);
