"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface FileSelectStepProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  errors: string[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
}

/**
 * File selection step for import wizard
 */
export function FileSelectStep({
  fileInputRef,
  selectedFile,
  errors,
  onFileSelect,
  onNext
}: FileSelectStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Upload className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">Select Import File</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a JSON file exported from Kanban Todos
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onFileSelect}
        className="hidden"
        id="import-file-input"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
        size="lg"
      >
        <Upload className="h-4 w-4 mr-2" />
        Choose File
      </Button>

      {selectedFile && (
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {selectedFile && errors.length === 0 && (
        <Button onClick={onNext} className="w-full">
          Continue
        </Button>
      )}
    </div>
  );
}
