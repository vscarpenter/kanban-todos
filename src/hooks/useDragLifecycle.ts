"use client";

import { useState, useCallback } from "react";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { Task, TASK_STATUSES } from "@/lib/types";
import { celebrateTaskCompletion } from "@/lib/utils/celebrateCompletion";

export interface DragLifecycle {
  /** The task being dragged — drives the drag overlay. */
  activeTask: Task | null;
  /** True for the duration of any drag — drives the mobile scaled-down layout. */
  isDragging: boolean;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
}

/**
 * Owns the whole drag interaction behind one seam: the overlay (activeTask),
 * the mobile layout flag (isDragging), persistence (moveTask), and the
 * completion celebration. Previously this was split across DragDropProvider's
 * activeTask state and KanbanBoard's isDragging state, with @dnd-kit's own
 * active/over as a third — callers had to coordinate all three.
 */
export function useDragLifecycle(
  tasks: Task[],
  moveTask: (taskId: string, newStatus: Task["status"]) => Promise<boolean>
): DragLifecycle {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setIsDragging(true);

      const task = tasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
        // Simple haptic feedback on touch devices.
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      }
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      // Clear the overlay and restore the layout immediately — the persistence
      // below runs after, so the UI stays responsive.
      setActiveTask(null);
      setIsDragging(false);

      if (over && active.data.current?.type === "task") {
        const taskId = active.id as string;
        const newStatus = over.id as Task["status"];

        if (newStatus && TASK_STATUSES.includes(newStatus)) {
          // Capture pre-move state before the store changes it.
          const task = tasks.find((t) => t.id === taskId);
          const previousStatus = task?.status;
          const completedTitle = task?.title ?? "";

          // Celebrate only a real, *persisted* transition into 'done' (#85).
          const moved = await moveTask(taskId, newStatus);
          if (moved && newStatus === "done" && previousStatus && previousStatus !== "done") {
            celebrateTaskCompletion(completedTitle);
          }
        }
      }
    },
    [tasks, moveTask]
  );

  return { activeTask, isDragging, handleDragStart, handleDragEnd };
}
