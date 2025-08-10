"use client";

import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: Task['status'];
  color: string;
  borderColor: string;
}

export function KanbanColumn({ title, tasks, status, color, borderColor }: KanbanColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: status,
    data: {
      type: 'column',
      status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-full ${color} ${borderColor} border-2 rounded-lg transition-colors ${
        isOver ? 'opacity-75 ring-2 ring-primary' : ''
      }`}
    >
      <Card className="h-full border-0 bg-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              {title}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {tasks.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3 min-h-[200px]">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No tasks</p>
                <p className="text-xs">Drag tasks here or create new ones</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
