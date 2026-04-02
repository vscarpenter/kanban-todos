"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import isEqual from "fast-deep-equal";
import { Task } from "@/lib/types";
import TaskCard from "./TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, Loader2, CheckCircle2, Plus } from "@/lib/icons";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";

const columnConfig = {
  'todo': {
    icon: Circle,
    statusClass: 'status-dot--todo',
  },
  'in-progress': {
    icon: Loader2,
    statusClass: 'status-dot--in-progress',
  },
  'done': {
    icon: CheckCircle2,
    statusClass: 'status-dot--done',
  },
} as const;

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: Task['status'];
  color: string;
  borderColor: string;
  onNavigateToBoard?: (boardId: string, taskId: string) => void;
}

export function KanbanColumn({ title, tasks, status, color, borderColor, onNavigateToBoard }: KanbanColumnProps) {
  const { boards, currentBoardId } = useBoardStore();
  const { filters, searchState } = useTaskStore();

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

  // Check if we're in cross-board search mode
  const isSearchActive = filters.search.length > 0;
  const isCrossBoardSearch = filters.crossBoardSearch && isSearchActive;

  const config = columnConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${
        isOver ? 'drop-zone-active ring-2 ring-primary' : ''
      }`}
      style={{ height: 'calc(100vh - 280px)' }}
    >
      <Card className="flex flex-col h-full border-0 bg-transparent">
        <CardHeader className="kanban-column__header">
          <CardTitle className="kanban-column__title">
            <div className={`status-dot ${config.statusClass}`} aria-hidden="true" />
            {title}
          </CardTitle>
          <Badge className="kanban-column__count">
            {tasks.length}
          </Badge>
        </CardHeader>

        <CardContent className="pt-0 flex-1 overflow-y-auto touch-pan-y overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-3 min-h-[200px] pb-4">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4" style={{ animation: 'empty-state-breathe 3s ease-in-out infinite' }}>
                  <Plus className="h-6 w-6 opacity-40" />
                </div>
                <p className="text-sm font-medium">No tasks</p>
                <p className="text-xs mt-1 opacity-70">Drag tasks here or create new ones</p>
              </div>
            ) : (
              tasks.map((task, index) => {
                const taskBoard = boards.find(b => b.id === task.boardId);
                const isCurrentBoard = task.boardId === currentBoardId;
                const isHighlighted = searchState.highlightedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`card-animate-in ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 rounded-lg transition-all duration-300' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
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
        </CardContent>
      </Card>
    </div>
  );
}

// Use fast-deep-equal for efficient memo comparison
// Replaces 36-line manual comparison with battle-tested implementation
export default memo(KanbanColumn, isEqual);
