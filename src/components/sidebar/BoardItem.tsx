"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown } from "@/lib/icons";
import { Board } from "@/lib/types";
import { BoardMenu } from "../BoardMenu";

interface BoardItemProps {
  board: Board;
  isActive: boolean;
  taskCount: number;
  onSelect: () => void;
  onReorder: (direction: 'up' | 'down') => void;
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
  canMoveDown
}: BoardItemProps) {
  const hasTouch = 'ontouchstart' in window;

  const handleReorder = (direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    onReorder(direction);
  };

  return (
    <Card
      className={`
        group cursor-pointer transition-all duration-200 hover:shadow-md
        ${isActive ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'}
      `}
      onClick={onSelect}
    >
      <CardContent className={`${hasTouch ? 'p-2 py-1.5' : 'p-2'}`}>
        <div className={`flex items-center ${hasTouch ? 'gap-1.5' : 'gap-2'}`}>
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: board.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate tracking-tight">
              {board.name}
            </div>
            {board.description && (
              <div className={`text-xs text-muted-foreground truncate ${hasTouch ? 'leading-tight mt-0.5' : 'leading-relaxed'}`}>
                {board.description}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Reorder buttons */}
            <div className={`flex flex-col ${hasTouch ? 'gap-0.5 opacity-100' : 'gap-1 opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <Button
                variant="ghost"
                size="sm"
                className={`
                  ${hasTouch ? 'h-8 w-8 min-h-8 min-w-8' : 'h-6 w-6'}
                  p-0
                  ${!canMoveUp ? 'opacity-40' : 'active:scale-95 transition-transform hover:bg-accent'}
                `}
                onClick={(e) => handleReorder('up', e)}
                disabled={!canMoveUp}
                aria-label={`Move ${board.name} up`}
                title={`Move ${board.name} up`}
              >
                <ChevronUp className={hasTouch ? 'h-5 w-5' : 'h-4 w-4'} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`
                  ${hasTouch ? 'h-8 w-8 min-h-8 min-w-8' : 'h-6 w-6'}
                  p-0
                  ${!canMoveDown ? 'opacity-40' : 'active:scale-95 transition-transform hover:bg-accent'}
                `}
                onClick={(e) => handleReorder('down', e)}
                disabled={!canMoveDown}
                aria-label={`Move ${board.name} down`}
                title={`Move ${board.name} down`}
              >
                <ChevronDown className={hasTouch ? 'h-5 w-5' : 'h-4 w-4'} />
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs">
              {taskCount}
            </Badge>
            <BoardMenu board={board} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}