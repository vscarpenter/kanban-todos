"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "@/lib/icons";
import { Board, Task } from "@/lib/types";

interface BoardHeaderProps {
  board: Board | null;
  isCrossBoardSearch: boolean;
  searchQuery: string;
  boardGroupsCount: number;
  tasks?: Task[];
  onCreateTask: () => void;
}

export function BoardHeader({
  board,
  isCrossBoardSearch,
  searchQuery,
  boardGroupsCount,
  tasks = [],
  onCreateTask
}: BoardHeaderProps) {
  const taskSummary = useMemo(() => {
    if (!tasks.length) return null;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    return { todo, inProgress, done };
  }, [tasks]);

  return (
    <div
      className="p-6 border-b border-border relative overflow-hidden board-animate-in"
      style={board ? {
        background: `linear-gradient(135deg, ${board.color}10 0%, transparent 60%)`,
      } : undefined}
    >
      <div className="flex items-center justify-between relative z-10">
        <div>
          {isCrossBoardSearch ? (
            <>
              <h1 className="text-3xl font-bold text-foreground">
                Cross-Board Search Results
              </h1>
              <p className="text-muted-foreground mt-2">
                Showing results from {boardGroupsCount} board{boardGroupsCount !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </>
          ) : board ? (
            <>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full ring-4 ring-offset-2 ring-offset-background"
                  style={{ backgroundColor: board.color, boxShadow: `0 0 12px ${board.color}40` }}
                />
                {board.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {board.description && (
                  <p className="text-muted-foreground">{board.description}</p>
                )}
                {taskSummary && (
                  <p className="text-xs text-muted-foreground font-mono tracking-wide">
                    {board.description && <span className="mx-1 opacity-30">|</span>}
                    {taskSummary.todo} to do · {taskSummary.inProgress} in progress · {taskSummary.done} done
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
        <Button onClick={onCreateTask} disabled={isCrossBoardSearch}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}