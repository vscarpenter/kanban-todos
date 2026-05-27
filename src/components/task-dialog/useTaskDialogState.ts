"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAsyncOperation } from "@/lib/hooks/useAsyncOperation";
import { useTaskStore } from "@/lib/stores/taskStore";
import type { Task } from "@/lib/types";
import { formatTags, parseTags } from "../taskDialogUtils";

export interface TaskDialogFormData {
  title: string;
  description: string;
  priority: Task["priority"];
  tags: string;
  progress: number;
  dueDate: Date | undefined;
}

interface UseTaskDialogStateOptions {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  task?: Task;
  initialStatus?: Task["status"];
}

export function useTaskDialogState({
  mode,
  open,
  onOpenChange,
  boardId,
  task,
  initialStatus,
}: UseTaskDialogStateOptions) {
  const { addTask, updateTask } = useTaskStore();
  const { execute, isLoading } = useAsyncOperation<true>({
    errorMessage: `Failed to ${mode} task`,
  });
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const initialFormDataRef = useRef<TaskDialogFormData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const getInitialFormData = useCallback((): TaskDialogFormData => {
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

    return {
      title: "",
      description: "",
      priority: "medium",
      tags: "",
      progress: 0,
      dueDate: undefined,
    };
  }, [mode, task]);

  const [formData, setFormData] = useState<TaskDialogFormData>(getInitialFormData);

  // Client-only mount effect to avoid SSR/CSR Date divergence in the picker.
  // react-doctor-disable-next-line react-doctor/rendering-hydration-no-flicker
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinDate(new Date());
  }, []);

  useEffect(() => {
    if (!open || !titleInputRef.current) return undefined;

    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [open]);

  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialFormDataRef.current) return false;

    const initial = initialFormDataRef.current;
    if (formData.title !== initial.title) return true;
    if (formData.description !== initial.description) return true;
    if (formData.priority !== initial.priority) return true;
    if (formData.tags !== initial.tags) return true;
    if (formData.progress !== initial.progress) return true;

    const initialTime = initial.dueDate?.getTime();
    const currentTime = formData.dueDate?.getTime();
    return initialTime !== currentTime;
  }, [formData]);

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
  }, [getInitialFormData, hasUnsavedChanges, onOpenChange]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const submitTask = useCallback(async () => {
    if (!formData.title.trim()) return;

    const succeeded = await execute(async () => {
      const tags = parseTags(formData.tags);

      if (mode === "create") {
        await addTask({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          priority: formData.priority,
          tags,
          status: initialStatus || "todo",
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

        if (task.status === "in-progress") {
          updates.progress = formData.progress;
        }

        await updateTask(task.id, updates);
      }

      return true as const;
    });

    if (succeeded) {
      onOpenChange(false);
    }
  }, [addTask, boardId, execute, formData, initialStatus, mode, onOpenChange, task, updateTask]);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitTask();
  }, [submitTask]);

  const handleTitleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitTask();
    }
  }, [submitTask]);

  const updateFormData = useCallback(<K extends keyof TaskDialogFormData>(
    field: K,
    value: TaskDialogFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDateChange = useCallback((date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dueDate: date }));
  }, []);

  return {
    formData,
    showDetails,
    setShowDetails,
    minDate,
    titleInputRef,
    isLoading,
    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
    handleOpenChange,
    handleDiscardChanges,
    handleSubmit,
    handleTitleKeyDown,
    updateFormData,
    handleDateChange,
    dialogTitle: mode === "create" ? "Create New Task" : "Edit Task",
    submitButtonText: mode === "create"
      ? (isLoading ? "Creating..." : "Create Task")
      : (isLoading ? "Updating..." : "Update Task"),
    showProgressSlider: mode === "edit" && task?.status === "in-progress",
  };
}
