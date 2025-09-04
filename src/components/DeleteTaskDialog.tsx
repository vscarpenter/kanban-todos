"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "@/lib/icons";
import { Task } from "@/lib/types";

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onConfirm: () => void;
  isPermanent?: boolean; // For archived tasks permanent deletion
}

export function DeleteTaskDialog({ 
  open, 
  onOpenChange, 
  task, 
  onConfirm,
  isPermanent = false 
}: DeleteTaskDialogProps) {
  if (!task) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isPermanent ? 'Permanently Delete Task' : 'Delete Task'}
          </DialogTitle>
          <DialogDescription className="text-left">
            {isPermanent ? (
              <>
                Are you sure you want to permanently delete <strong>&quot;{task.title}&quot;</strong>? 
                This action cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>&quot;{task.title}&quot;</strong>?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
          >
            {isPermanent ? 'Permanently Delete' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}