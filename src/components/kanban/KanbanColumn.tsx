"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import isEqual from "fast-deep-equal";
import { Task } from "@/lib/types";
import TaskCard from "./TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";

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

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-0 min-w-full md:min-w-0 snap-center md:snap-align-none ${color} ${borderColor} border-2 rounded-lg transition-all duration-200 ${
        isOver ? 'opacity-75 ring-4 ring-primary scale-105' : ''
      }`}
      style={{ height: 'calc(100vh - 280px)' }}
    >
      <Card className="flex flex-col h-full border-0 bg-transparent">
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

        <CardContent className="pt-0 flex-1 overflow-y-auto touch-pan-y overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-3 min-h-[200px] pb-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No tasks</p>
                <p className="text-xs">Drag tasks here or create new ones</p>
              </div>
            ) : (
              tasks.map((task) => {
                const taskBoard = boards.find(b => b.id === task.boardId);
                const isCurrentBoard = task.boardId === currentBoardId;
                const isHighlighted = searchState.highlightedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={isHighlighted ? 'ring-2 ring-primary ring-offset-2 rounded-lg transition-all duration-300' : ''}
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
