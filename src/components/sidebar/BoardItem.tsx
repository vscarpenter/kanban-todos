"use client";

import { ChevronUp, ChevronDown } from "@/lib/icons";
import { Board } from "@/lib/types";
import { BoardMenu } from "../BoardMenu";
import { getBoardIcon, getDotCssVar } from "@/lib/utils/boardIcons";

// Touch devices have no hover state, so the reorder controls must always
// be rendered for them. Read once at module scope (SSR-safe via typeof check).
const hasTouch =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

interface BoardItemProps {
  board: Board;
  isActive: boolean;
  taskCount: number;
  onSelect: () => void;
  onReorder: (direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function BoardItem({
  board,
  isActive,
  taskCount,
  onSelect,
  onReorder,
  canMoveUp,
  canMoveDown,
}: BoardItemProps) {
  const Icon = getBoardIcon(board.iconKey);
  const dotColor = getDotCssVar(board.dotColor);

  const handleReorder = (direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    onReorder(direction);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={[
        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-all",
        isActive ? "sidebar-item--active" : "hover:bg-[var(--paper-2)]",
      ].join(" ")}
    >
      {/* Icon tile */}
      <div
        className="flex h-[26px] w-[26px] items-center justify-center rounded-md flex-shrink-0"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--hairline)",
          color: dotColor,
        }}
      >
        <Icon size={14} strokeWidth={1.8} />
      </div>

      {/* Two-line text */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "-0.005em",
            color: "var(--ink-1)",
          }}
        >
          {board.name}
        </div>
        {board.description && (
          <div
            className="truncate mt-px"
            style={{ fontSize: "11px", color: "var(--ink-4)" }}
          >
            {board.description}
          </div>
        )}
      </div>

      {/* Reorder controls — always visible on touch devices, hover-only on
          pointer devices to keep the rail visually clean. */}
      <div
        className={[
          "flex-col gap-0.5",
          hasTouch ? "flex" : "hidden group-hover:flex",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={(e) => handleReorder("up", e)}
          disabled={!canMoveUp}
          aria-label={`Move ${board.name} up`}
          className="h-4 w-4 inline-flex items-center justify-center rounded text-[var(--ink-4)] hover:text-[var(--ink-2)] disabled:opacity-30"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => handleReorder("down", e)}
          disabled={!canMoveDown}
          aria-label={`Move ${board.name} down`}
          className="h-4 w-4 inline-flex items-center justify-center rounded text-[var(--ink-4)] hover:text-[var(--ink-2)] disabled:opacity-30"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Count badge */}
      <span
        className="font-mono inline-flex items-center justify-center px-1.5 rounded-full"
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--ink-3)",
          background: "var(--paper-1)",
          border: "1px solid var(--hairline)",
          minWidth: "20px",
          height: "16px",
          fontFeatureSettings: '"tnum"',
        }}
      >
        {taskCount}
      </span>

      <BoardMenu board={board} />
    </div>
  );
}
