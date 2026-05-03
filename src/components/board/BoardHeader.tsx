"use client";

import { useMemo } from "react";
import { Plus } from "@/lib/icons";
import { Board, Task } from "@/lib/types";
import { getBoardIcon, getDotCssVar } from "@/lib/utils/boardIcons";

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
  onCreateTask,
}: BoardHeaderProps) {
  const openTaskCount = useMemo(
    () => tasks.filter((t) => t.status !== "done").length,
    [tasks]
  );

  const Icon = board ? getBoardIcon(board.iconKey) : null;
  const dotColor = board ? getDotCssVar(board.dotColor) : "var(--accent-500)";

  return (
    <div className="px-8 pt-7 pb-5 board-animate-in" style={{ background: "var(--paper-0)" }}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          {Icon && !isCrossBoardSearch && (
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-[10px]"
              style={{
                width: "44px",
                height: "44px",
                background: "var(--paper-card)",
                border: "1px solid var(--hairline-strong)",
                boxShadow: "var(--shadow-xs)",
                color: dotColor,
              }}
            >
              <Icon size={22} strokeWidth={1.8} />
            </div>
          )}

          <div className="min-w-0">
            {isCrossBoardSearch ? (
              <>
                <h1
                  className="font-serif"
                  style={{
                    fontSize: "36px",
                    lineHeight: "40px",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--ink-1)",
                  }}
                >
                  Cross-board search
                  <span style={{ color: "var(--accent-500)" }}>.</span>
                </h1>
                <p
                  className="mt-2"
                  style={{ fontSize: "13px", color: "var(--ink-3)" }}
                >
                  Showing results from{" "}
                  <span className="font-mono" style={{ fontFeatureSettings: '"tnum"' }}>
                    {boardGroupsCount}
                  </span>{" "}
                  board{boardGroupsCount !== 1 ? "s" : ""}
                  {searchQuery && (
                    <>
                      {" · "}for &ldquo;<span style={{ color: "var(--ink-1)" }}>{searchQuery}</span>&rdquo;
                    </>
                  )}
                </p>
              </>
            ) : board ? (
              <>
                <h1
                  className="font-serif truncate"
                  style={{
                    fontSize: "36px",
                    lineHeight: "40px",
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--ink-1)",
                  }}
                >
                  {board.name}
                  <span style={{ color: "var(--accent-500)" }}>.</span>
                </h1>
                <p
                  className="mt-2 truncate"
                  style={{ fontSize: "13px", color: "var(--ink-3)" }}
                >
                  {board.description ? (
                    <>
                      {board.description}
                      <span className="mx-1.5" style={{ color: "var(--ink-4)" }}>·</span>
                    </>
                  ) : null}
                  <span className="font-mono" style={{ fontFeatureSettings: '"tnum"' }}>
                    {openTaskCount}
                  </span>{" "}
                  open task{openTaskCount !== 1 ? "s" : ""}
                </p>
              </>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateTask}
          disabled={isCrossBoardSearch}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          style={{
            background: "var(--accent-500)",
            color: "var(--accent-ink)",
            border: "1px solid var(--accent-600)",
            boxShadow: "var(--shadow-sm)",
            fontSize: "12.5px",
            fontWeight: 600,
          }}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
          New Task
        </button>
      </div>
    </div>
  );
}
