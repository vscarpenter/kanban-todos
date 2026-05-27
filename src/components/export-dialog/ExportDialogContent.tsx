"use client";

import {
  AlertCircle,
  Archive,
  CheckCircle,
  Download,
  FileText,
  Folder,
  Loader2,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { ExportOptions } from "@/lib/utils/exportImport";
import type { ExportStats, ValidationResults } from "./useExportDialogState";

interface ExportDialogContentProps {
  stats: ExportStats;
  exportOptions: ExportOptions;
  validationResults: ValidationResults;
  isExporting: boolean;
  exportProgress: number;
  filename: string;
  exportCount: number;
  canExport: boolean;
  onOptionChange: <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => void;
  onValidate: () => void;
  onExport: () => void;
  onCancel: () => void;
}

export function ExportDialogContent({
  stats,
  exportOptions,
  validationResults,
  isExporting,
  exportProgress,
  filename,
  exportCount,
  canExport,
  onOptionChange,
  onValidate,
  onExport,
  onCancel,
}: ExportDialogContentProps) {
  return (
    <div className="space-y-6">
      {isExporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Exporting…</span>
            <span className="text-sm text-muted-foreground">{exportProgress}%</span>
          </div>
          <Progress value={exportProgress} className="w-full" />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">What to Export</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <Label htmlFor="includeTasks" className="font-medium">Tasks</Label>
              <Badge variant="secondary">{stats.totalTasks} total</Badge>
            </div>
            <Switch
              id="includeTasks"
              checked={exportOptions.includeTasks}
              onCheckedChange={(checked) => onOptionChange("includeTasks", checked)}
              disabled={isExporting}
            />
          </div>

          {exportOptions.includeTasks && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-3 w-3" />
                  <Label htmlFor="includeArchivedTasks" className="text-sm">Include archived tasks</Label>
                  <Badge variant="outline" className="text-xs">
                    {stats.archivedTasks} archived
                  </Badge>
                </div>
                <Switch
                  id="includeArchivedTasks"
                  checked={exportOptions.includeArchivedTasks}
                  onCheckedChange={(checked) => onOptionChange("includeArchivedTasks", checked)}
                  disabled={isExporting}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <Label htmlFor="includeBoards" className="font-medium">Boards</Label>
              <Badge variant="secondary">{stats.totalBoards} total</Badge>
            </div>
            <Switch
              id="includeBoards"
              checked={exportOptions.includeBoards}
              onCheckedChange={(checked) => onOptionChange("includeBoards", checked)}
              disabled={isExporting}
            />
          </div>

          {exportOptions.includeBoards && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-3 w-3" />
                  <Label htmlFor="includeArchivedBoards" className="text-sm">Include archived boards</Label>
                  <Badge variant="outline" className="text-xs">
                    {stats.archivedBoards} archived
                  </Badge>
                </div>
                <Switch
                  id="includeArchivedBoards"
                  checked={exportOptions.includeArchivedBoards}
                  onCheckedChange={(checked) => onOptionChange("includeArchivedBoards", checked)}
                  disabled={isExporting}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Label htmlFor="includeSettings" className="font-medium">Settings</Label>
              <Badge variant="secondary">User preferences</Badge>
            </div>
            <Switch
              id="includeSettings"
              checked={exportOptions.includeSettings}
              onCheckedChange={(checked) => onOptionChange("includeSettings", checked)}
              disabled={isExporting}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Export Summary</h3>
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Items to export:</span>
            <Badge>{exportCount} items</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">File format:</span>
            <Badge variant="outline">JSON</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Filename:</span>
            <span className="text-xs text-muted-foreground font-mono">{filename}</span>
          </div>
        </div>
      </div>

      {(validationResults.errors.length > 0 || validationResults.warnings.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Validation Results</h3>

          {validationResults.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Errors ({validationResults.errors.length})</span>
              </div>
              <div className="bg-destructive/10 p-3 rounded-lg space-y-1">
                {validationResults.errors.map((error) => (
                  <p key={error} className="text-xs text-destructive">{error}</p>
                ))}
              </div>
            </div>
          )}

          {validationResults.warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Warnings ({validationResults.warnings.length})</span>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg space-y-1">
                {validationResults.warnings.map((warning) => (
                  <p key={warning} className="text-xs text-orange-700 dark:text-orange-400">{warning}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onValidate}
          disabled={isExporting}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Validate Export
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={onExport}
            disabled={!canExport}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
