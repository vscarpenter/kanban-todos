"use client";

import { useState, useCallback } from "react";
import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Share, Move, Archive, Trash2 } from "@/lib/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/lib/stores/taskStore";
import { EditTaskDialog } from "../EditTaskDialog";
import { ShareTaskDialog } from "../ShareTaskDialog";
import { MoveTaskDialog } from "../MoveTaskDialog";
import { DeleteTaskDialog } from "../DeleteTaskDialog";

interface TaskCardActionsProps {
  task: Task;
}

/**
 * Dropdown menu with task actions and associated dialogs
 */
export function TaskCardActions({ task }: TaskCardActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteTask, archiveTask } = useTaskStore();

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    await deleteTask(task.id);
  }, [deleteTask, task.id]);

  const handleArchive = useCallback(async () => {
    await archiveTask(task.id);
  }, [archiveTask, task.id]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Task options for ${task.title}`}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
            <Share className="h-4 w-4 mr-2" />
            Share Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
            <Move className="h-4 w-4 mr-2" />
            Move to Board
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={task}
      />
      <ShareTaskDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        task={task}
      />
      <MoveTaskDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        task={task}
      />
      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        task={task}
        onConfirm={confirmDelete}
      />
    </>
  );
}
