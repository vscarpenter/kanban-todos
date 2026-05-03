"use client";

import { useMemo } from "react";
import { Task, Board } from "@/lib/types";
import { getDotCssVar } from "@/lib/utils/boardIcons";

interface BoardGroup {
  board: Board;
  tasks: Task[];
}

interface BoardStatsProps {
  tasks: Task[];
  isCrossBoardSearch: boolean;
  boardGroups?: Record<string, BoardGroup>;
}

interface StatCellProps {
  label: string;
  value: number;
  color: string;
}

function StatCell({ label, value, color }: StatCellProps) {
  return (
    <div className="stats-pill__cell flex flex-col items-center justify-center px-5 py-1.5">
      <span
        className="font-mono"
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color,
          fontFeatureSettings: '"tnum"',
          lineHeight: "20px",
        }}
      >
        {value}
      </span>
      <span
        className="mt-0.5"
        style={{ fontSize: "11.5px", color: "var(--ink-3)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function BoardStats({ tasks, isCrossBoardSearch, boardGroups = {} }: BoardStatsProps) {
  const counts = useMemo(() => {
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { total: tasks.length, todo, inProgress, done };
  }, [tasks]);

  const boardStatsList = useMemo(
    () =>
      isCrossBoardSearch
        ? Object.entries(boardGroups).map(([boardId, group]) => ({
            boardId,
            board: group.board,
            totalTasks: group.tasks.length,
          }))
        : [],
    [isCrossBoardSearch, boardGroups]
  );

  return (
    <div className="px-8">
      <div
        className="stats-pill"
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--hairline-strong)",
          boxShadow: "var(--shadow-xs)",
          padding: "4px",
          borderRadius: "10px",
        }}
      >
        <StatCell label="Total" value={counts.total} color="var(--ink-2)" />
        <StatCell label="To Do" value={counts.todo} color="var(--info-500)" />
        <StatCell label="In Progress" value={counts.inProgress} color="var(--warn-500)" />
        <StatCell label="Done" value={counts.done} color="var(--ok-500)" />
      </div>

      {isCrossBoardSearch && boardStatsList.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {boardStatsList.map(({ boardId, board, totalTasks }) => (
            <div
              key={boardId}
              className="flex items-center gap-2 rounded-md px-2.5 py-1"
              style={{
                background: "var(--paper-1)",
                border: "1px solid var(--hairline)",
                fontSize: "11.5px",
                color: "var(--ink-3)",
              }}
            >
              <span
                className="block h-2 w-2 rounded-full"
                style={{ background: getDotCssVar(board.dotColor) }}
                aria-hidden="true"
              />
              <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{board.name}</span>
              <span className="font-mono" style={{ fontFeatureSettings: '"tnum"' }}>
                {totalTasks}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
