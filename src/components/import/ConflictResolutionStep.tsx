"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Info } from "lucide-react";
import { ImportConflicts } from "@/lib/utils/exportImport";
import { ConflictResolutionOptions } from "@/lib/utils/conflictResolution";

interface ConflictResolutionStepProps {
  conflicts: ImportConflicts;
  conflictOptions: ConflictResolutionOptions;
  onOptionsChange: (options: ConflictResolutionOptions) => void;
  onBack: () => void;
  onImport: () => void;
}

/**
 * Conflict resolution configuration step
 */
export function ConflictResolutionStep({
  conflicts,
  conflictOptions,
  onOptionsChange,
  onBack,
  onImport
}: ConflictResolutionStepProps) {
  const hasConflicts =
    (conflicts.duplicateTaskIds?.length ?? 0) > 0 ||
    (conflicts.duplicateBoardIds?.length ?? 0) > 0 ||
    (conflicts.defaultBoardConflicts?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Resolve Conflicts</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how to handle conflicts with existing data
        </p>
      </div>

      {hasConflicts && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Conflicts detected:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {(conflicts.duplicateTaskIds?.length ?? 0) > 0 && (
                <li>{conflicts.duplicateTaskIds!.length} task(s) with matching IDs</li>
              )}
              {(conflicts.duplicateBoardIds?.length ?? 0) > 0 && (
                <li>{conflicts.duplicateBoardIds!.length} board(s) with matching IDs</li>
              )}
              {(conflicts.defaultBoardConflicts?.length ?? 0) > 0 && (
                <li>{conflicts.defaultBoardConflicts!.length} default board conflict(s)</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Task Conflict Strategy</Label>
          <Select
            value={conflictOptions.taskStrategy}
            onValueChange={(value) =>
              onOptionsChange({ ...conflictOptions, taskStrategy: value as ConflictResolutionOptions['taskStrategy'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">Skip conflicting tasks</SelectItem>
              <SelectItem value="overwrite">Overwrite existing tasks</SelectItem>
              <SelectItem value="generate_new_ids">Generate new IDs</SelectItem>
              <SelectItem value="merge">Merge data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Board Conflict Strategy</Label>
          <Select
            value={conflictOptions.boardStrategy}
            onValueChange={(value) =>
              onOptionsChange({ ...conflictOptions, boardStrategy: value as ConflictResolutionOptions['boardStrategy'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">Skip conflicting boards</SelectItem>
              <SelectItem value="overwrite">Overwrite existing boards</SelectItem>
              <SelectItem value="generate_new_ids">Generate new IDs</SelectItem>
              <SelectItem value="merge">Merge data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Preserve Relationships</Label>
            <p className="text-xs text-muted-foreground">
              Maintain task-board relationships when generating new IDs
            </p>
          </div>
          <Switch
            checked={conflictOptions.preserveRelationships}
            onCheckedChange={(checked) =>
              onOptionsChange({ ...conflictOptions, preserveRelationships: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Generate Backup</Label>
            <p className="text-xs text-muted-foreground">
              Create a backup before importing
            </p>
          </div>
          <Switch
            checked={conflictOptions.generateBackup}
            onCheckedChange={(checked) =>
              onOptionsChange({ ...conflictOptions, generateBackup: checked })
            }
          />
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Recommended: Use &quot;Generate new IDs&quot; to avoid data loss
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button onClick={onImport} className="flex-1">
          Start Import
        </Button>
      </div>
    </div>
  );
}
