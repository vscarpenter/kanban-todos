"use client";

import { memo } from "react";
import { Board } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BoardIndicatorProps {
  board: Board;
  isCurrentBoard: boolean;
  size?: 'sm' | 'md';
  showName?: boolean;
  className?: string;
}

export function BoardIndicator({ 
  board, 
  isCurrentBoard, 
  size = 'sm', 
  showName = true,
  className
}: BoardIndicatorProps) {
  const dotSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const maxNameLength = size === 'sm' ? 15 : 25;
  
  const truncatedName = showName && board.name.length > maxNameLength 
    ? `${board.name.slice(0, maxNameLength)}...` 
    : board.name;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-normal gap-1.5 px-2 py-1 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isCurrentBoard && "bg-accent/50 border-accent-foreground/20",
        !isCurrentBoard && "text-muted-foreground border-muted-foreground/20",
        size === 'md' && "px-2.5 py-1.5 text-sm",
        className
      )}
      role="img"
      aria-label={`Board: ${board.name}${isCurrentBoard ? ' (current board)' : ''}`}
      title={`${board.name}${isCurrentBoard ? ' (current board)' : ''}`}
      tabIndex={0}
    >
      <div
        className={cn(
          "rounded-full shrink-0",
          dotSize
        )}
        style={{ backgroundColor: board.color }}
        aria-hidden="true"
      />
      {showName && (
        <span className="truncate" aria-hidden="true">
          {truncatedName}
        </span>
      )}
    </Badge>
  );
}

export default memo(BoardIndicator, (prevProps, nextProps) => {
  return (
    prevProps.board.id === nextProps.board.id &&
    prevProps.board.name === nextProps.board.name &&
    prevProps.board.color === nextProps.board.color &&
    prevProps.isCurrentBoard === nextProps.isCurrentBoard &&
    prevProps.size === nextProps.size &&
    prevProps.showName === nextProps.showName
  );
});