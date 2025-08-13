"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, RotateCcw, Calendar } from "@/lib/icons";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { Task } from "@/lib/types";
import { format } from "date-fns";

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchiveDialog({ open, onOpenChange }: ArchiveDialogProps) {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { tasks, unarchiveTask, deleteTask } = useTaskStore();
  const { boards } = useBoardStore();

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      // Filter archived tasks from the current tasks
      const archived = tasks.filter(task => task.archivedAt);
      setArchivedTasks(archived);
      setIsLoading(false);
    }
  }, [open, tasks]);

  const getBoardName = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    return board?.name || 'Unknown Board';
  };

  const getBoardColor = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    return board?.color || '#6b7280';
  };

  const handleUnarchive = async (taskId: string) => {
    await unarchiveTask(taskId);
    // Update local state
    setArchivedTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      await deleteTask(taskId);
      // Update local state
      setArchivedTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Archive ({archivedTasks.length} tasks)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : archivedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No archived tasks</p>
              <p className="text-sm">Tasks you archive will appear here</p>
            </div>
          ) : (
            <div className="h-[500px] overflow-y-auto pr-4">
              <div className="space-y-3">
                {archivedTasks.map((task) => (
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
                            <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                              {task.status.replace('-', ' ')}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
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
                            onClick={() => handleDelete(task.id)}
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
    </Dialog>
  );
}