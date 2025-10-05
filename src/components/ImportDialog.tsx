"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { readJsonFile, previewImportData } from "@/lib/utils/fileHandling";
import { processAdvancedImport, detectImportConflicts } from "@/lib/utils/exportImport";
import { useImportState, ImportPreview } from "@/hooks/useImportState";
import { FileSelectStep } from "./import/FileSelectStep";
import { PreviewStep } from "./import/PreviewStep";
import { ConflictResolutionStep } from "./import/ConflictResolutionStep";
import { ImportingStep } from "./import/ImportingStep";
import { CompleteStep } from "./import/CompleteStep";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_TITLES = {
  select: 'Select File',
  preview: 'Preview Data',
  conflicts: 'Resolve Conflicts',
  importing: 'Importing',
  complete: 'Complete',
};

const STEP_DESCRIPTIONS = {
  select: 'Choose a JSON file to import',
  preview: 'Review the data to be imported',
  conflicts: 'Handle any data conflicts',
  importing: 'Processing your data',
  complete: 'Import finished successfully',
};

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { tasks, importTasks } = useTaskStore();
  const { boards, importBoards } = useBoardStore();
  const { settings, importSettings } = useSettingsStore();

  const state = useImportState();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    state.setSelectedFile(file);
    state.setErrors([]);
    state.setWarnings([]);

    try {
      const result = await previewImportData(file);

      if (!result.success || !result.preview) {
        state.setErrors([result.error || 'Failed to read import file']);
        return;
      }

      const importPreview: ImportPreview = {
        taskCount: result.preview.taskCount,
        boardCount: result.preview.boardCount,
        hasSettings: result.preview.hasSettings,
        exportedAt: result.preview.exportedAt,
        version: result.preview.version,
        fileSize: result.preview.fileSize,
      };

      const fileReadResult = await readJsonFile(file);
      if (fileReadResult.success && fileReadResult.data) {
        state.setImportData(fileReadResult.data);
      }

      state.setImportPreview(importPreview);

      if (result.validation?.warnings && result.validation.warnings.length > 0) {
        state.setWarnings(result.validation.warnings);
      }
    } catch (error) {
      state.setErrors([
        error instanceof Error ? error.message : 'Failed to read import file'
      ]);
    }
  };

  const handlePreviewNext = () => {
    if (!state.importData) return;

    const conflicts = detectImportConflicts(state.importData, tasks, boards);
    state.setConflicts(conflicts);
    state.setCurrentStep(state.hasConflicts() ? 'conflicts' : 'importing');

    if (!state.hasConflicts()) {
      handleImport();
    }
  };

  const handleImport = async () => {
    if (!state.importData) return;

    state.setIsProcessing(true);
    state.setCurrentStep('importing');
    state.setImportProgress(0);

    try {
      const { result, sanitizationLog, validationResult } = processAdvancedImport(
        state.importData,
        tasks,
        boards,
        settings,
        state.conflictOptions
      );

      state.setImportProgress(33);

      if (result.resolvedTasks.length > 0) {
        await importTasks(result.resolvedTasks);
      }

      state.setImportProgress(66);

      if (result.resolvedBoards.length > 0) {
        await importBoards(result.resolvedBoards);
      }

      state.setImportProgress(85);

      if (result.resolvedSettings) {
        await importSettings(result.resolvedSettings);
      }

      state.setImportProgress(100);

      const warnings = [
        ...validationResult.warnings.map(w => w.message),
        ...sanitizationLog,
      ];

      state.setWarnings(warnings);
      state.setCurrentStep('complete');
    } catch (error) {
      state.setErrors([
        error instanceof Error ? error.message : 'Import failed'
      ]);
      state.setCurrentStep('select');
    } finally {
      state.setIsProcessing(false);
    }
  };

  const handleClose = () => {
    state.resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{STEP_TITLES[state.currentStep]}</DialogTitle>
          <DialogDescription>
            {STEP_DESCRIPTIONS[state.currentStep]}
          </DialogDescription>
        </DialogHeader>

        {state.currentStep === 'select' && (
          <FileSelectStep
            fileInputRef={state.fileInputRef}
            selectedFile={state.selectedFile}
            errors={state.errors}
            onFileSelect={handleFileSelect}
            onNext={() => state.setCurrentStep('preview')}
          />
        )}

        {state.currentStep === 'preview' && state.importPreview && (
          <PreviewStep
            preview={state.importPreview}
            warnings={state.warnings}
            onBack={() => state.setCurrentStep('select')}
            onNext={handlePreviewNext}
          />
        )}

        {state.currentStep === 'conflicts' && state.conflicts && (
          <ConflictResolutionStep
            conflicts={state.conflicts}
            conflictOptions={state.conflictOptions}
            onOptionsChange={state.setConflictOptions}
            onBack={() => state.setCurrentStep('preview')}
            onImport={handleImport}
          />
        )}

        {state.currentStep === 'importing' && (
          <ImportingStep progress={state.importProgress} />
        )}

        {state.currentStep === 'complete' && state.importPreview && (
          <CompleteStep
            taskCount={state.importPreview.taskCount}
            boardCount={state.importPreview.boardCount}
            hasSettings={state.importPreview.hasSettings}
            warnings={state.warnings}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
