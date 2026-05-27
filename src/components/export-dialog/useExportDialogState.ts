"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useTaskStore } from "@/lib/stores/taskStore";
import { logger } from "@/lib/utils/logger";
import {
  downloadAsJson,
  exportData,
  generateExportFilename,
  validateAndSanitizeExport,
  type ExportOptions,
} from "@/lib/utils/exportImport";

export interface ExportStats {
  totalTasks: number;
  activeTasks: number;
  archivedTasks: number;
  totalBoards: number;
  activeBoards: number;
  archivedBoards: number;
}

export interface ValidationResults {
  errors: string[];
  warnings: string[];
}

export function useExportDialogState(onOpenChange: (open: boolean) => void) {
  const { tasks } = useTaskStore();
  const { boards } = useBoardStore();
  const { settings } = useSettingsStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTasks: true,
    includeBoards: true,
    includeSettings: true,
    includeArchivedTasks: true,
    includeArchivedBoards: true,
  });
  const [validationResults, setValidationResults] = useState<ValidationResults>({
    errors: [],
    warnings: [],
  });

  const stats = useMemo<ExportStats>(() => ({
    totalTasks: tasks.length,
    activeTasks: tasks.filter(task => !task.archivedAt).length,
    archivedTasks: tasks.filter(task => task.archivedAt).length,
    totalBoards: boards.length,
    activeBoards: boards.filter(board => !board.archivedAt).length,
    archivedBoards: boards.filter(board => board.archivedAt).length,
  }), [boards, tasks]);

  const updateExportOption = useCallback(<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
    setValidationResults({ errors: [], warnings: [] });
  }, []);

  const validateExport = useCallback(() => {
    try {
      const result = validateAndSanitizeExport(tasks, boards, settings, exportOptions);
      const nextValidationResults = {
        errors: result.validationResult.errors.map(error => error.message),
        warnings: result.validationResult.warnings.map(warning => warning.message),
      };

      setValidationResults(nextValidationResults);

      return {
        isValid: result.validationResult.isValid,
        ...nextValidationResults,
      };
    } catch (error) {
      const nextValidationResults = {
        errors: [error instanceof Error ? error.message : "Validation failed"],
        warnings: [],
      };

      setValidationResults(nextValidationResults);

      return {
        isValid: false,
        ...nextValidationResults,
      };
    }
  }, [boards, exportOptions, settings, tasks]);

  const getExportCount = useCallback(() => {
    let count = 0;

    if (exportOptions.includeTasks) {
      count += exportOptions.includeArchivedTasks ? stats.totalTasks : stats.activeTasks;
    }

    if (exportOptions.includeBoards) {
      count += exportOptions.includeArchivedBoards ? stats.totalBoards : stats.activeBoards;
    }

    if (exportOptions.includeSettings) count += 1;
    return count;
  }, [exportOptions, stats]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      setExportProgress(20);
      const validation = validateExport();

      if (!validation.isValid) {
        throw new Error("Export validation failed");
      }

      setExportProgress(40);
      const exportedData = exportData(tasks, boards, settings, exportOptions);

      setExportProgress(60);
      const filename = generateExportFilename(exportOptions);

      setExportProgress(80);
      downloadAsJson(exportedData, filename);

      const itemCount = getExportCount();
      const successMessage = `✅ Export completed successfully! Downloaded ${itemCount} items.`;

      setValidationResults(prev => ({
        ...prev,
        errors: [],
        warnings: [successMessage],
      }));

      toast.success("Export Successful", {
        description: `Successfully exported ${itemCount} items to ${filename}`,
        duration: 4000,
      });

      setTimeout(() => {
        onOpenChange(false);
        setExportProgress(0);
        setValidationResults({ errors: [], warnings: [] });
      }, 2500);
    } catch (error) {
      logger.error("Export failed", error);
      setValidationResults(prev => ({
        ...prev,
        errors: [...prev.errors, error instanceof Error ? error.message : "Export failed"],
      }));
    } finally {
      setIsExporting(false);
    }
  }, [boards, exportOptions, getExportCount, onOpenChange, settings, tasks, validateExport]);

  const canExport = (
    exportOptions.includeTasks ||
    exportOptions.includeBoards ||
    exportOptions.includeSettings
  ) && !isExporting && validationResults.errors.length === 0;

  return {
    stats,
    isExporting,
    exportProgress,
    exportOptions,
    validationResults,
    updateExportOption,
    validateExport,
    handleExport,
    getExportCount,
    canExport,
    filename: generateExportFilename(exportOptions),
  };
}
