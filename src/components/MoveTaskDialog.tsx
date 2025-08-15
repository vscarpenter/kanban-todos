'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Move, Check } from '@/lib/icons';
import type { Task, Board } from '@/lib/types';
import { useTaskStore } from '@/lib/stores/taskStore';
import { useBoardStore } from '@/lib/stores/boardStore';

interface MoveTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoveTaskDialog({ task, open, onOpenChange }: MoveTaskDialogProps) {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { moveTaskToBoard, tasks } = useTaskStore();
  const { boards } = useBoardStore();

  // Calculate task counts per board
  const getTaskCount = (boardId: string) => {
    return tasks.filter(t => t.boardId === boardId && !t.archivedAt).length;
  };

  if (!task) return null;

  // Filter out the current board and archived boards
  const availableBoards = boards.filter(
    board => board.id !== task.boardId && !board.archivedAt
  );

  const handleMove = async () => {
    if (!selectedBoardId) return;

    const targetBoard = boards.find(b => b.id === selectedBoardId);
    const currentBoard = boards.find(b => b.id === task.boardId);
    
    // Check if we need confirmation for this move
    const needsConfirmation = 
      targetBoard?.isDefault || // Moving to default board
      currentBoard?.isDefault || // Moving from default board
      getTaskCount(selectedBoardId) > 20; // Moving to a very busy board

    if (needsConfirmation && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setIsMoving(true);
      await moveTaskToBoard(task.id, selectedBoardId);
      
      toast.success(`Task moved to "${targetBoard?.name || 'Unknown Board'}"`);
      
      onOpenChange(false);
      setSelectedBoardId(null);
      setShowConfirmation(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move task');
    } finally {
      setIsMoving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedBoardId(null);
    setShowConfirmation(false);
  };

  const getConfirmationMessage = () => {
    const targetBoard = boards.find(b => b.id === selectedBoardId);
    const currentBoard = boards.find(b => b.id === task.boardId);
    
    if (targetBoard?.isDefault) {
      return `Are you sure you want to move this task to the default board "${targetBoard.name}"?`;
    }
    if (currentBoard?.isDefault) {
      return `Are you sure you want to move this task away from the default board "${currentBoard.name}"?`;
    }
    if (getTaskCount(selectedBoardId!) > 20) {
      return `The "${targetBoard?.name}" board has many tasks (${getTaskCount(selectedBoardId!)}). Are you sure you want to add this task there?`;
    }
    return 'Are you sure you want to move this task?';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            {showConfirmation ? 'Confirm Move' : 'Move Task to Board'}
          </DialogTitle>
          <DialogDescription>
            {showConfirmation 
              ? getConfirmationMessage()
              : `Move "${task.title}" to a different board`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {showConfirmation ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This action will move the task to a different board. You can always move it back later if needed.
              </p>
            </div>
          ) : availableBoards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No other boards available</p>
              <p className="text-sm mt-1">Create a new board to move tasks between boards</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Select destination board:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableBoards.map((board) => (
                  <BoardSelectItem
                    key={board.id}
                    board={board}
                    taskCount={getTaskCount(board.id)}
                    isSelected={selectedBoardId === board.id}
                    onSelect={() => setSelectedBoardId(board.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {showConfirmation ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)} 
                disabled={isMoving}
              >
                Back
              </Button>
              <Button 
                onClick={handleMove} 
                disabled={isMoving}
                className="gap-2"
                variant="default"
              >
                {isMoving ? (
                  <>Moving...</>
                ) : (
                  <>
                    <Move className="h-4 w-4" />
                    Confirm Move
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isMoving}>
                Cancel
              </Button>
              <Button 
                onClick={handleMove} 
                disabled={!selectedBoardId || isMoving || availableBoards.length === 0}
                className="gap-2"
              >
                {isMoving ? (
                  <>Moving...</>
                ) : (
                  <>
                    <Move className="h-4 w-4" />
                    Move Task
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BoardSelectItemProps {
  board: Board;
  taskCount: number;
  isSelected: boolean;
  onSelect: () => void;
}

function BoardSelectItem({ board, taskCount, isSelected, onSelect }: BoardSelectItemProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-border'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: board.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground truncate">
              {board.name}
            </div>
            {board.description && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {board.description}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </Badge>
            {board.isDefault && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Default
              </Badge>
            )}
            {isSelected && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}