"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
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
  
  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t: Task) => t.id === active.id);
    if (task) {
      setActiveTask(task);
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
          <div className="opacity-80 rotate-3 scale-105">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}