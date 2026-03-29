"use client";

import { useMemo } from "react";
import { Task, Board } from "@/lib/types";

interface BoardGroup {
  board: Board;
  tasks: Task[];
}

interface BoardStatsProps {
  tasks: Task[];
  isCrossBoardSearch: boolean;
  boardGroups?: Record<string, BoardGroup>;
}

export function BoardStats({ tasks, isCrossBoardSearch, boardGroups = {} }: BoardStatsProps) {
  const todoTasks = useMemo(() => tasks.filter(task => task.status === 'todo'), [tasks]);
  const inProgressTasks = useMemo(() => tasks.filter(task => task.status === 'in-progress'), [tasks]);
  const doneTasks = useMemo(() => tasks.filter(task => task.status === 'done'), [tasks]);

  const boardStats = useMemo(() => isCrossBoardSearch ? Object.entries(boardGroups).map(([boardId, group]) => ({
    boardId,
    board: group.board,
    totalTasks: group.tasks.length,
    todoTasks: group.tasks.filter(t => t.status === 'todo').length,
    inProgressTasks: group.tasks.filter(t => t.status === 'in-progress').length,
    doneTasks: group.tasks.filter(t => t.status === 'done').length,
  })) : [], [isCrossBoardSearch, boardGroups]);

  return (
    <div className="mt-4 space-y-3">
      {/* Overall Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>Total Tasks: {tasks.length}</span>
        <span>To Do: {todoTasks.length}</span>
        <span>In Progress: {inProgressTasks.length}</span>
        <span>Done: {doneTasks.length}</span>
      </div>

      {/* Board-specific Stats for cross-board search */}
      {isCrossBoardSearch && boardStats.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs">
          {boardStats.map(({ boardId, board, totalTasks, todoTasks: boardTodo, inProgressTasks: boardInProgress, doneTasks: boardDone }) => (
            <div key={boardId} className="flex items-center gap-2 px-3 py-1 bg-accent/50 rounded-md">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: board.color }}
                aria-hidden="true"
              />
              <span className="font-medium">{board.name}:</span>
              <span className="text-muted-foreground">
                {totalTasks} ({boardTodo} todo, {boardInProgress} in progress, {boardDone} done)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}