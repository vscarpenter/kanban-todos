"use client";

import { useState } from "react";
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
} from "@dnd-kit/core";
import { Task } from "@/lib/types";
import { useTaskStore } from "@/lib/stores/taskStore";
import TaskCard from "./kanban/TaskCard";

interface DragDropProviderProps {
  children: React.ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
}

export function DragDropProvider({ 
  children, 
  onDragStart, 
  onDragEnd, 
  onDragOver 
}: DragDropProviderProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { tasks, moveTask } = useTaskStore();
  
  // Simple touch sensor configuration
  const touchSensorConfig = 'ontouchstart' in window
    ? { activationConstraint: { delay: 150, tolerance: 8 } }
    : { activationConstraint: { delay: 100, tolerance: 5 } };
  
  // Configure drag sensors for both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, touchSensorConfig)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t: Task) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      
      // Simple haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'task') {
      const taskId = active.id as string;
      const newStatus = over.id as Task['status'];
      
      if (newStatus && ['todo', 'in-progress', 'done'].includes(newStatus)) {
        moveTask(taskId, newStatus);
      }
    }
    
    setActiveTask(null);
    onDragEnd?.(event);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={onDragOver}
    >
      {children}
      <DragOverlay>
        {activeTask ? (
          <div className="drag-overlay drag-preview opacity-80 rotate-3 scale-105">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}