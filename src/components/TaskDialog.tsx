"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useTaskStore } from "@/lib/stores/taskStore";
import { Task } from "@/lib/types";

// Helper to parse comma-separated tags
function parseTags(tagsString: string): string[] {
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

// Helper to format tags for display
function formatTags(tags: string[]): string {
  return tags.join(", ");
}

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
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data based on mode
  const getInitialFormData = (): FormData => {
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
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData());

  // Reset form data when mode or task changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    setIsLoading(true);

    try {
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

      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to ${mode} task:`, error);
    } finally {
      setIsLoading(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              maxLength={200}
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.title.length}/200
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
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

          {/* Progress Slider - Only show for in-progress tasks in edit mode */}
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
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-medium">{formData.progress}%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Track your progress on this task
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <DateTimePicker
              value={formData.dueDate}
              onChange={handleDateChange}
              placeholder="Select due date and time"
              minDate={new Date()}
            />
            <div className="text-xs text-muted-foreground">
              Optional deadline for this task
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            <div className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
  );
}
