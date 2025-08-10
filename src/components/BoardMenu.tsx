"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Settings, Trash2, Copy } from "lucide-react";
import { Board } from "@/lib/types";
import { useBoardStore } from "@/lib/stores/boardStore";
import { BoardSettingsDialog } from "./BoardSettingsDialog";
import { BoardDeleteDialog } from "./BoardDeleteDialog";

interface BoardMenuProps {
  board: Board;
}

export function BoardMenu({ board }: BoardMenuProps) {
  const { duplicateBoard } = useBoardStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      await duplicateBoard(board.id);
    } catch (error) {
      console.error('Failed to duplicate board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()} // Prevent board selection when clicking menu
          >
            <MoreHorizontal className="h-3 w-3" />
            <span className="sr-only">Board options</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(true);
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Board
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate();
            }}
            disabled={isLoading}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate Board
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="text-destructive focus:text-destructive"
            disabled={board.isDefault}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Board
          </DropdownMenuItem>
          
          {board.isDefault && (
            <div className="px-2 py-1">
              <p className="text-xs text-muted-foreground">
                Default board cannot be deleted
              </p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <BoardSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        board={board}
      />
      
      <BoardDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        board={board}
      />
    </>
  );
}
