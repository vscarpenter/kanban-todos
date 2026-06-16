"use client";

import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
} from "@dnd-kit/core";
import { Task } from "@/lib/types";
import TaskCard from "./kanban/TaskCard";

// Cache touch detection once at module level with SSR guard
const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

interface DragDropProviderProps {
  children: React.ReactNode;
  // The drag interaction itself is owned by useDragLifecycle (see KanbanBoard).
  // This component is now presentation-only: it wires the sensors/collision
  // detection and renders the overlay for whatever task is being dragged.
  activeTask: Task | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

export function DragDropProvider({
  children,
  activeTask,
  onDragStart,
  onDragEnd,
  onDragOver
}: DragDropProviderProps) {
  // Simple touch sensor configuration using cached detection
  const touchSensorConfig = useMemo(() => isTouchDevice
    ? { activationConstraint: { delay: 150, tolerance: 8 } }
    : { activationConstraint: { delay: 100, tolerance: 5 } },
  []);

  // Configure drag sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, touchSensorConfig)
  );

  // Custom collision detection for better mobile accuracy
  const customCollisionDetection = (args: Parameters<typeof rectIntersection>[0]) => {
    // On mobile, use center-based detection for more accurate targeting
    return isTouchDevice ? closestCenter(args) : rectIntersection(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
      <DragOverlay>
        {activeTask ? (
          // Editorial drag preview: rotate(-1.4deg) + slight Y lift +
          // shadow-lift token, per the redesign spec.
          <div
            className="drag-overlay"
            style={{
              transform: "rotate(-1.4deg) translateY(-2px)",
              boxShadow: "var(--shadow-lift)",
              borderRadius: "10px",
            }}
          >
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}