"use client";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Task } from "@/lib/types";
import { TaskDialogForm } from "./task-dialog/TaskDialogForm";
import { useTaskDialogState } from "./task-dialog/useTaskDialogState";

interface TaskDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  task?: Task;
  initialStatus?: Task["status"];
}

export function TaskDialog(props: TaskDialogProps) {
  const dialog = useTaskDialogState(props);

  return (
    <>
      <Dialog open={props.open} onOpenChange={dialog.handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{dialog.dialogTitle}</DialogTitle>
          </DialogHeader>

          <TaskDialogForm
            formData={dialog.formData}
            showDetails={dialog.showDetails}
            setShowDetails={dialog.setShowDetails}
            minDate={dialog.minDate}
            titleInputRef={dialog.titleInputRef}
            isLoading={dialog.isLoading}
            submitButtonText={dialog.submitButtonText}
            showProgressSlider={dialog.showProgressSlider}
            onSubmit={dialog.handleSubmit}
            onTitleKeyDown={dialog.handleTitleKeyDown}
            onFormDataChange={dialog.updateFormData}
            onDateChange={dialog.handleDateChange}
            onCancel={() => dialog.handleOpenChange(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={dialog.showUnsavedChangesDialog}
        onOpenChange={dialog.setShowUnsavedChangesDialog}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        type="warning"
        onConfirm={dialog.handleDiscardChanges}
      />
    </>
  );
}
