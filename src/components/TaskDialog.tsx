"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useAsyncOperation } from "@/lib/hooks/useAsyncOperation";
import { Task } from "@/lib/types";
import {
  parseTags,
  formatTags,
  getToday,
  getTomorrow,
  getNextWeek,
  isToday,
  isTomorrow,
  isNextWeek,
  formatDueDateQuick,
} from "./taskDialogUtils";

interface TaskDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  task?: Task; // Required for edit mode
}

interface FormData {
  title: string;
  description: string;
  priority: Task['priority'];
  tags: string;
  progress: number;
  dueDate: Date | undefined;
}

export function TaskDialog({ mode, open, onOpenChange, boardId, task }: TaskDialogProps) {
  const { addTask, updateTask } = useTaskStore();
  const { execute, isLoading } = useAsyncOperation({
    errorMessage: `Failed to ${mode} task`,
  });
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  // Store initial form data for comparison
  const initialFormDataRef = useRef<FormData | null>(null);

  // Initialize form data based on mode
  const getInitialFormData = useCallback((): FormData => {
    if (mode === "edit" && task) {
      return {
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        tags: formatTags(task.tags),
        progress: task.progress || 0,
        dueDate: task.dueDate || undefined,
      };
    }

    // Default for create mode
    return {
      title: "",
      description: "",
      priority: "medium",
      tags: "",
      progress: 0,
      dueDate: undefined,
    };
  }, [mode, task]);

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [showDetails, setShowDetails] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus title when dialog opens
  useEffect(() => {
    if (open && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialFormDataRef.current) return false;

    const initial = initialFormDataRef.current;

    // Compare all fields
    if (formData.title !== initial.title) return true;
    if (formData.description !== initial.description) return true;
    if (formData.priority !== initial.priority) return true;
    if (formData.tags !== initial.tags) return true;
    if (formData.progress !== initial.progress) return true;

    // Compare dates (both undefined, or same timestamp)
    const initialTime = initial.dueDate?.getTime();
    const currentTime = formData.dueDate?.getTime();
    if (initialTime !== currentTime) return true;

    return false;
  }, [formData]);

  // Handle dialog close with unsaved changes check
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      const initial = getInitialFormData();
      setFormData(initial);
      initialFormDataRef.current = initial;
    } else if (hasUnsavedChanges()) {
      setShowUnsavedChangesDialog(true);
      return;
    }
    onOpenChange(newOpen);
  }, [hasUnsavedChanges, onOpenChange, getInitialFormData]);

  // Discard changes and close
  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    const result = await execute(async () => {
      const tags = parseTags(formData.tags);

      if (mode === "create") {
        await addTask({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          tags,
          status: 'todo',
          boardId,
          dueDate: formData.dueDate || undefined,
        });
      } else if (mode === "edit" && task) {
        const updates: Partial<Task> = {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          tags,
          dueDate: formData.dueDate || undefined,
        };

        // Only include progress if task is in-progress
        if (task.status === 'in-progress') {
          updates.progress = formData.progress;
        }

        await updateTask(task.id, updates);
      }
    });

    // Only close dialog on success (result is not undefined)
    if (result !== undefined) {
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dueDate: date }));
  };

  // Conditional rendering helpers
  const dialogTitle = mode === "create" ? "Create New Task" : "Edit Task";
  const submitButtonText = mode === "create"
    ? (isLoading ? "Creating..." : "Create Task")
    : (isLoading ? "Updating..." : "Update Task");
  const showProgressSlider = mode === "edit" && task?.status === 'in-progress';

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primary Fields - Always Visible */}
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              ref={titleInputRef}
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="What needs to be done?"
              maxLength={200}
              required
            />
          </div>

          {/* Due Date - Quick Picks */}
          <div className="space-y-3">
            <Label>Due Date</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={formData.dueDate && isToday(formData.dueDate) ? 'border-primary text-primary' : ''}
                onClick={() => handleDateChange(getToday())}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={formData.dueDate && isTomorrow(formData.dueDate) ? 'border-primary text-primary' : ''}
                onClick={() => handleDateChange(getTomorrow())}
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={formData.dueDate && isNextWeek(formData.dueDate) ? 'border-primary text-primary' : ''}
                onClick={() => handleDateChange(getNextWeek())}
              >
                Next Week
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={!formData.dueDate ? 'border-primary text-primary' : ''}
                onClick={() => handleDateChange(undefined)}
              >
                No Date
              </Button>
            </div>
            {formData.dueDate && (
              <div className="text-xs text-muted text-center">
                Due {formatDueDateQuick(formData.dueDate)}
              </div>
            )}
          </div>

          {/* Progressive Disclosure Toggle */}
          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-center"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
              <svg className={`ml-1 h-4 w-4 transition-transform ${
                showDetails ? 'rotate-180' : ''
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          {/* Secondary Fields - Progressive Disclosure */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add more details..."
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-muted text-right">
                  {formData.description.length}/500
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Task['priority']) =>
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="work, urgent, design..."
                />
                <div className="text-xs text-muted">
                  Separate tags with commas
                </div>
              </div>

              {/* Progress Slider - Only for in-progress tasks in edit mode */}
              {showProgressSlider && (
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress</Label>
                  <div className="px-3">
                    <Slider
                      id="progress"
                      min={0}
                      max={100}
                      step={5}
                      value={[formData.progress]}
                      onValueChange={(value: number[]) =>
                        setFormData(prev => ({ ...prev, progress: value[0] }))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted mt-1">
                      <span>0%</span>
                      <span className="font-medium">{formData.progress}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Date Picker */}
              <div className="space-y-2">
                <Label>Custom Date & Time</Label>
                <DateTimePicker
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  placeholder="Pick specific date and time"
                  minDate={new Date()}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title.trim()}>
              {submitButtonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Unsaved Changes Confirmation */}
    <ConfirmationDialog
      open={showUnsavedChangesDialog}
      onOpenChange={setShowUnsavedChangesDialog}
      title="Unsaved Changes"
      description="You have unsaved changes. Are you sure you want to discard them?"
      confirmText="Discard"
      cancelText="Keep Editing"
      type="warning"
      onConfirm={handleDiscardChanges}
    />
    </>
  );
}
