"use client";

import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExportDialogContent } from "./export-dialog/ExportDialogContent";
import { useExportDialogState } from "./export-dialog/useExportDialogState";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const exportDialog = useExportDialogState(onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Download className="h-5 w-5" style={{ color: "var(--accent-500)" }} />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your tasks, boards, and settings to a JSON file for backup or transfer.
          </DialogDescription>
        </DialogHeader>

        <ExportDialogContent
          stats={exportDialog.stats}
          exportOptions={exportDialog.exportOptions}
          validationResults={exportDialog.validationResults}
          isExporting={exportDialog.isExporting}
          exportProgress={exportDialog.exportProgress}
          filename={exportDialog.filename}
          exportCount={exportDialog.getExportCount()}
          canExport={exportDialog.canExport}
          onOptionChange={exportDialog.updateExportOption}
          onValidate={() => { exportDialog.validateExport(); }}
          onExport={() => { void exportDialog.handleExport(); }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
