"use client";

import dynamic from "next/dynamic";
import { Task } from "@/lib/types";
import KanbanColumn from "../kanban/KanbanColumn";

// Lazy load drag-and-drop functionality
const DragDropProvider = dynamic(() => import("../DragDropProvider").then(mod => ({ default: mod.DragDropProvider })), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading board...</div></div>,
  ssr: false
});

interface KanbanBoardProps {
  tasks: Task[];
  onNavigateToBoard: (boardId: string, taskId: string) => void;
}

export function KanbanBoard({ tasks, onNavigateToBoard }: KanbanBoardProps) {
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  return (
    <DragDropProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-full">
        <KanbanColumn
          title="To Do"
          tasks={todoTasks}
          status="todo"
          color="bg-blue-50 dark:bg-blue-950/20"
          borderColor="border-blue-200 dark:border-blue-800"
          onNavigateToBoard={onNavigateToBoard}
        />

        <KanbanColumn
          title="In Progress"
          tasks={inProgressTasks}
          status="in-progress"
          color="bg-yellow-50 dark:bg-yellow-950/20"
          borderColor="border-yellow-200 dark:border-yellow-800"
          onNavigateToBoard={onNavigateToBoard}
        />

        <KanbanColumn
          title="Done"
          tasks={doneTasks}
          status="done"
          color="bg-green-50 dark:bg-green-950/20"
          borderColor="border-green-200 dark:border-green-800"
          onNavigateToBoard={onNavigateToBoard}
        />
      </div>
    </DragDropProvider>
  );
}