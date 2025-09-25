"use client";

import { Button } from "@/components/ui/button";
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
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const getTaskCount = (boardId: string) => {
    return tasks.filter(task => task.boardId === boardId && !task.archivedAt).length;
  };

  const handleBoardSelect = (boardId: string) => {
    selectBoard(boardId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Boards</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateBoard}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className={hasTouch ? 'space-y-0.5' : 'space-y-1'}>
        {boards.map((board, index) => (
          <BoardItem
            key={board.id}
            board={board}
            isActive={board.id === currentBoardId}
            taskCount={getTaskCount(board.id)}
            onSelect={() => handleBoardSelect(board.id)}
            onReorder={(direction) => reorderBoard(board.id, direction)}
            canMoveUp={index > 0}
            canMoveDown={index < boards.length - 1}
          />
        ))}
      </div>
    </div>
  );
}