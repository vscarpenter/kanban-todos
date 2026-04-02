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
    accentClass: 'column-accent-blue',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  'in-progress': {
    icon: Loader2,
    accentClass: 'column-accent-yellow',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  'done': {
    icon: CheckCircle2,
    accentClass: 'column-accent-green',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
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
  const { filters: { search: searchQuery, crossBoardSearch }, searchState: { highlightedTaskId } } = useTaskStore();

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
  const isSearchActive = searchQuery.length > 0;
  const isCrossBoardSearch = crossBoardSearch && isSearchActive;

  const config = columnConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-0 min-w-full md:min-w-0 snap-center md:snap-align-none ${color} ${borderColor} border-2 rounded-xl column-accent-strip ${config.accentClass} transition-all duration-200 ${
        isOver ? 'drop-zone-active ring-4 ring-primary scale-[1.02]' : ''
      }`}
      style={{ height: 'calc(100vh - 280px)' }}
    >
      <Card className="flex flex-col h-full border-0 bg-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <StatusIcon className="h-4 w-4 opacity-60" aria-hidden="true" />
              {title}
            </CardTitle>
            <Badge className={`text-xs font-semibold border-0 ${config.badgeClass}`}>
              {tasks.length}
            </Badge>
          </div>
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
                const isHighlighted = highlightedTaskId === task.id;

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
