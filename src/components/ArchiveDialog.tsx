"use client";

import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Trash2, RotateCcw, Calendar, Search, X } from "@/lib/icons";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { Task } from "@/lib/types";
import { format } from "date-fns";
import { DeleteTaskDialog } from "./DeleteTaskDialog";

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveDialog({ open, onOpenChange }: ArchiveDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { tasks, unarchiveTask, deleteTask } = useTaskStore();
  const { boards } = useBoardStore();

  // Derive archived tasks directly from tasks - no need for separate state
  const archivedTasks = useMemo(() => {
    if (!open) return [];
    return tasks.filter(task => task.archivedAt);
  }, [open, tasks]);

  // Reset search when dialog closes and reopens
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen && !open) {
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  }, [open, onOpenChange]);

  const getBoardName = useCallback((boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    return board?.name || 'Unknown Board';
  }, [boards]);

  const getBoardColor = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    return board?.color || '#6b7280';
  };

  // Filter archived tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return archivedTasks;
    }

    const query = searchQuery.toLowerCase();
    return archivedTasks.filter(task => {
      // Search in title
      if (task.title.toLowerCase().includes(query)) return true;
      // Search in description
      if (task.description?.toLowerCase().includes(query)) return true;
      // Search in tags
      if (task.tags.some(tag => tag.toLowerCase().includes(query))) return true;
      // Search in board name
      if (getBoardName(task.boardId).toLowerCase().includes(query)) return true;
      return false;
    });
  }, [archivedTasks, searchQuery, getBoardName]);

  const handleUnarchive = async (taskId: string) => {
    await unarchiveTask(taskId);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  // Editorial palette for archived task badges. Inline styles let us
  // reference the design tokens directly so light/dark and high-contrast
  // modes all swap without per-class duplication.
  const getStatusBadgeStyle = (status: Task['status']): React.CSSProperties => {
    switch (status) {
      case 'todo':
        return { background: 'var(--info-50)', color: 'var(--info-500)', border: '1px solid var(--hairline)' };
      case 'in-progress':
        return { background: 'var(--warn-50)', color: 'var(--warn-700)', border: '1px solid var(--hairline)' };
      case 'done':
        return { background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--hairline)' };
      default:
        return { background: 'var(--paper-1)', color: 'var(--ink-3)', border: '1px solid var(--hairline)' };
    }
  };

  const getPriorityBadgeStyle = (priority: Task['priority']): React.CSSProperties => {
    switch (priority) {
      case 'low':
        return { background: 'var(--ok-50)', color: 'var(--ok-700)', border: '1px solid var(--hairline)' };
      case 'medium':
        return { background: 'var(--warn-50)', color: 'var(--warn-700)', border: '1px solid var(--hairline)' };
      case 'high':
        return { background: 'var(--danger-50)', color: 'var(--danger-700)', border: '1px solid var(--hairline)' };
      default:
        return { background: 'var(--paper-1)', color: 'var(--ink-3)', border: '1px solid var(--hairline)' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Archive ({archivedTasks.length} tasks)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          {archivedTasks.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archived tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {archivedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No archived tasks</p>
              <p className="text-sm">Tasks you archive will appear here</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No matching tasks</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="h-[450px] overflow-y-auto pr-4">
              <div className="text-xs text-muted-foreground mb-2">
                Showing {filteredTasks.length} of {archivedTasks.length} archived tasks
              </div>
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getBoardColor(task.boardId) }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {getBoardName(task.boardId)}
                            </span>
                          </div>
                          
                          <h3 className="font-medium text-foreground mb-1 leading-tight">
                            {task.title}
                          </h3>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="text-xs" style={getStatusBadgeStyle(task.status)}>
                              {task.status.replace('-', ' ')}
                            </Badge>
                            <Badge className="text-xs" style={getPriorityBadgeStyle(task.priority)}>
                              {task.priority}
                            </Badge>
                            {task.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {task.archivedAt && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Archived {format(task.archivedAt, 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnarchive(task.id)}
                            className="h-8 w-8 p-0"
                            title="Restore task"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(task)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Use the restore button to unarchive tasks</span>
          <span>Use the trash button to permanently delete</span>
        </div>
      </DialogContent>

      {/* Delete Task Dialog */}
      <DeleteTaskDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        task={taskToDelete}
        onConfirm={confirmDelete}
        isPermanent={true}
      />
    </Dialog>
  );
}