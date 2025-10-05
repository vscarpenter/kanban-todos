import { useState, useRef } from "react";
import { ExportData, ImportConflicts } from "@/lib/utils/exportImport";
import { ConflictResolutionOptions } from "@/lib/utils/conflictResolution";

export interface ImportPreview {
  taskCount: number;
  boardCount: number;
  hasSettings: boolean;
  exportedAt: string;
  version: string;
  fileSize: string;
}

export type ImportStep = 'select' | 'preview' | 'conflicts' | 'importing' | 'complete';

/**
 * Custom hook to manage import dialog state
 */
export function useImportState() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<ImportStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [conflicts, setConflicts] = useState<ImportConflicts | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [conflictOptions, setConflictOptions] = useState<ConflictResolutionOptions>({
    taskStrategy: 'generate_new_ids',
    boardStrategy: 'generate_new_ids',
    settingsStrategy: 'merge',
    mergeStrategy: 'keep_newer',
    preserveRelationships: true,
    generateBackup: true,
  });

  const resetDialog = () => {
    setCurrentStep('select');
    setSelectedFile(null);
    setImportData(null);
    setImportPreview(null);
    setConflicts(null);
    setImportProgress(0);
    setIsProcessing(false);
    setErrors([]);
    setWarnings([]);
    setConflictOptions({
      taskStrategy: 'generate_new_ids',
      boardStrategy: 'generate_new_ids',
      settingsStrategy: 'merge',
      mergeStrategy: 'keep_newer',
      preserveRelationships: true,
      generateBackup: true,
    });
  };

  const hasConflicts = () => {
    if (!conflicts) return false;
    return (
      (conflicts.duplicateTaskIds?.length ?? 0) > 0 ||
      (conflicts.duplicateBoardIds?.length ?? 0) > 0 ||
      (conflicts.defaultBoardConflicts?.length ?? 0) > 0
    );
  };

  return {
    // Refs
    fileInputRef,

    // State
    currentStep,
    selectedFile,
    importData,
    importPreview,
    conflicts,
    importProgress,
    isProcessing,
    errors,
    warnings,
    conflictOptions,

    // Setters
    setCurrentStep,
    setSelectedFile,
    setImportData,
    setImportPreview,
    setConflicts,
    setImportProgress,
    setIsProcessing,
    setErrors,
    setWarnings,
    setConflictOptions,

    // Helpers
    resetDialog,
    hasConflicts,
  };
}
