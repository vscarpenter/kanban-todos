"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Info } from "lucide-react";

interface CompleteStepProps {
  taskCount: number;
  boardCount: number;
  hasSettings: boolean;
  warnings: string[];
  onClose: () => void;
}

/**
 * Import complete step
 */
export function CompleteStep({
  taskCount,
  boardCount,
  hasSettings,
  warnings,
  onClose
}: CompleteStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900 p-6">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Import Complete!</h3>
        <p className="text-sm text-muted-foreground">
          Your data has been successfully imported
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between px-4">
          <span className="text-muted-foreground">Tasks imported:</span>
          <span className="font-medium">{taskCount}</span>
        </div>
        <div className="flex justify-between px-4">
          <span className="text-muted-foreground">Boards imported:</span>
          <span className="font-medium">{boardCount}</span>
        </div>
        {hasSettings && (
          <div className="flex justify-between px-4">
            <span className="text-muted-foreground">Settings:</span>
            <span className="font-medium">Updated</span>
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Import completed with warnings:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-left">
              {warnings.slice(0, 3).map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
              {warnings.length > 3 && (
                <li className="text-muted-foreground">
                  +{warnings.length - 3} more warnings
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );
}
