"use client";

import { Plus } from "@/lib/icons";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { BoardItem } from "./BoardItem";

interface BoardsListProps {
  onCreateBoard: () => void;
}

export function BoardsList({ onCreateBoard }: BoardsListProps) {
  const { boards, currentBoardId, selectBoard, reorderBoard } = useBoardStore();
  const { tasks } = useTaskStore();

  const getTaskCount = (boardId: string) =>
    tasks.filter((task) => task.boardId === boardId && !task.archivedAt).length;

  return (
    <div>
      <div className="flex items-center justify-between px-2 pt-2 pb-2.5">
        <span className="label-eyebrow">Boards</span>
        <button
          type="button"
          onClick={onCreateBoard}
          aria-label="Add board"
          className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md transition-colors"
          style={{
            border: "1px solid var(--hairline-strong)",
            background: "var(--paper-card)",
            color: "var(--ink-3)",
          }}
        >
          <Plus className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col gap-1 px-1">
        {boards.map((board, index) => (
          <BoardItem
            key={board.id}
            board={board}
            isActive={board.id === currentBoardId}
            taskCount={getTaskCount(board.id)}
            onSelect={() => selectBoard(board.id)}
            onReorder={(direction) => reorderBoard(board.id, direction)}
            canMoveUp={index > 0}
            canMoveDown={index < boards.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
