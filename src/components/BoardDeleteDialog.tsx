"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { Board } from "@/lib/types";

interface BoardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board | null;
}

export function BoardDeleteDialog({ open, onOpenChange, board }: BoardDeleteDialogProps) {
  const { deleteBoard } = useBoardStore();
  const { tasks } = useTaskStore();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  if (!board) return null;

  const boardTasks = tasks.filter(task => task.boardId === board.id && !task.archivedAt);
  const isConfirmed = confirmationText === board.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    
    setIsLoading(true);
    
    try {
      await deleteBoard(board.id);
      onOpenChange(false);
      setConfirmationText("");
    } catch (error) {
      console.error('Failed to delete board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setConfirmationText("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Board
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the board and all its data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Board Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: board.color }}
              />
              <span className="font-medium">{board.name}</span>
            </div>
            {board.description && (
              <p className="text-sm text-muted-foreground mb-2">{board.description}</p>
            )}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{boardTasks.length}</span> active tasks will be deleted
            </div>
          </div>

          {/* Default Board Warning */}
          {board.isDefault && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Cannot Delete Default Board</span>
              </div>
              <p className="text-sm text-destructive/80">
                This is your default board and cannot be deleted. You can rename it or change its settings instead.
              </p>
            </div>
          )}

          {/* Task Warning */}
          {boardTasks.length > 0 && !board.isDefault && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Warning: Active Tasks</span>
              </div>
              <p className="text-sm text-destructive/80">
                This board contains {boardTasks.length} active task{boardTasks.length !== 1 ? 's' : ''}. 
                Deleting this board will permanently remove all associated tasks.
              </p>
            </div>
          )}

          {/* Confirmation Input */}
          {!board.isDefault && (
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <span className="font-mono font-medium">{board.name}</span> to confirm deletion:
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={`Type "${board.name}" here`}
                className={isConfirmed ? "border-destructive" : ""}
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {!board.isDefault && (
              <Button 
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || !isConfirmed}
              >
                {isLoading ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Board
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
