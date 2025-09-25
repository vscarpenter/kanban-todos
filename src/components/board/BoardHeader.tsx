"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "@/lib/icons";
import { Board } from "@/lib/types";

interface BoardHeaderProps {
  board: Board | null;
  isCrossBoardSearch: boolean;
  searchQuery: string;
  boardGroupsCount: number;
  onCreateTask: () => void;
}

export function BoardHeader({
  board,
  isCrossBoardSearch,
  searchQuery,
  boardGroupsCount,
  onCreateTask
}: BoardHeaderProps) {
  return (
    <div className="p-6 border-b border-border bg-background">
      <div className="flex items-center justify-between">
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
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: board.color }}
                />
                {board.name}
              </h1>
              {board.description && (
                <p className="text-muted-foreground mt-2">{board.description}</p>
              )}
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