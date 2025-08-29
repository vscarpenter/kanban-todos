"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useTaskStore } from "@/lib/stores/taskStore";
import { Task } from "@/lib/types";
import { AttachmentUploader } from "./AttachmentUploader";
import { toast } from "sonner";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export function CreateTaskDialog({ open, onOpenChange, boardId }: CreateTaskDialogProps) {
  const { addTask, addAttachmentToTask } = useTaskStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as Task['priority'],
    tags: "",
    dueDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    
    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create the task first
      const newTaskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        tags,
        status: 'todo' as const,
        boardId,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      };

      const createdTask = await addTask(newTaskData);

      // Add any pending attachments to the created task
      if (pendingAttachments.length > 0) {
        let successCount = 0;
        for (const file of pendingAttachments) {
          try {
            await addAttachmentToTask(createdTask.id, file);
            successCount++;
          } catch (error) {
            console.error('Failed to attach file:', file.name, error);
            toast.error(`Failed to attach ${file.name}`);
          }
        }
        
        if (successCount === pendingAttachments.length) {
          toast.success(`Task created successfully with ${successCount} attachment${successCount !== 1 ? 's' : ''}!`);
        } else if (successCount > 0) {
          toast.success(`Task created with ${successCount}/${pendingAttachments.length} attachments`);
        } else {
          toast.success('Task created successfully (attachments failed)');
        }
      } else {
        toast.success('Task created successfully!');
      }

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        tags: "",
        dueDate: "",
      });
      setPendingAttachments([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileAdd = async (file: File) => {
    // For create dialog, we'll store files temporarily and add them after task creation
    setPendingAttachments(prev => [...prev, file]);
    toast.success(`${file.name} ready to attach`);
  };

  const handleRemovePendingAttachment = (fileName: string) => {
    setPendingAttachments(prev => prev.filter(file => file.name !== fileName));
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        tags: "",
        dueDate: "",
      });
      setPendingAttachments([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
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

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <DateTimePicker
              value={formData.dueDate}
              onChange={(value) => handleInputChange('dueDate', value)}
              placeholder="Select due date and time"
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

          {/* Attachments Section */}
          <div className="space-y-3">
            <Separator />
            <div>
              <Label>Attachments</Label>
              <div className="text-xs text-muted-foreground mb-3">
                Add files to your task (max 10MB per file, 25MB total)
              </div>
              
              {/* Show pending attachments if any */}
              {pendingAttachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="text-sm font-medium">Files ready to attach:</div>
                  {pendingAttachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="text-sm">
                        <div className="font-medium">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePendingAttachment(file.name)}
                        className="h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Attachment Uploader */}
              <AttachmentUploader
                onFileAdd={handleFileAdd}
                disabled={isLoading}
                maxFiles={5}
              />
              
              {pendingAttachments.length > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  ✅ {pendingAttachments.length} file{pendingAttachments.length !== 1 ? 's' : ''} ready to attach
                </div>
              )}
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
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
