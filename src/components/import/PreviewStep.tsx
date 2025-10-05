"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Folder, FileText, Settings, Info, AlertTriangle } from "lucide-react";
import { ImportPreview } from "@/hooks/useImportState";

interface PreviewStepProps {
  preview: ImportPreview;
  warnings: string[];
  onBack: () => void;
  onNext: () => void;
}

/**
 * Preview step showing import data summary
 */
export function PreviewStep({
  preview,
  warnings,
  onBack,
  onNext
}: PreviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Import Preview</h3>

        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Tasks</span>
            </div>
            <Badge variant="secondary">{preview.taskCount}</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Boards</span>
            </div>
            <Badge variant="secondary">{preview.boardCount}</Badge>
          </div>

          {preview.hasSettings && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Settings</span>
              </div>
              <Badge variant="secondary">Included</Badge>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exported</span>
            <span>{preview.exportedAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>{preview.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">File Size</span>
            <span>{preview.fileSize}</span>
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Warnings:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          The import process will check for conflicts with existing data in the next step.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
