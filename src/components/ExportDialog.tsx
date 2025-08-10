"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { 
  exportData, 
  downloadAsJson, 
  generateExportFilename,
  validateAndSanitizeExport,
  ExportOptions 
} from "@/lib/utils/exportImport";
import { 
  Download, 
  FileText, 
  Folder, 
  Settings, 
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExportStats {
  totalTasks: number;
  activeTasks: number;
  archivedTasks: number;
  totalBoards: number;
  activeBoards: number;
  archivedBoards: number;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
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
  const [validationResults, setValidationResults] = useState<{
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });

  // Calculate export statistics
  const stats: ExportStats = {
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => !t.archivedAt).length,
    archivedTasks: tasks.filter(t => t.archivedAt).length,
    totalBoards: boards.length,
    activeBoards: boards.filter(b => !b.archivedAt).length,
    archivedBoards: boards.filter(b => b.archivedAt).length,
  };

  const updateExportOption = <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
    setValidationResults({ errors: [], warnings: [] }); // Clear previous validation
  };

  const validateExport = () => {
    try {
      const result = validateAndSanitizeExport(tasks, boards, settings, exportOptions);
      setValidationResults({
        errors: result.validationResult.errors.map(e => e.message),
        warnings: result.validationResult.warnings.map(w => w.message),
      });
      return result.validationResult.isValid;
    } catch (error) {
      setValidationResults({
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
      });
      return false;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Step 1: Validate export data
      setExportProgress(20);
      const isValid = validateExport();
      
      if (!isValid && validationResults.errors.length > 0) {
        throw new Error('Export validation failed');
      }

      // Step 2: Generate export data
      setExportProgress(40);
      const exportedData = exportData(tasks, boards, settings, exportOptions);

      // Step 3: Generate filename
      setExportProgress(60);
      const filename = generateExportFilename(exportOptions);

      // Step 4: Download file
      setExportProgress(80);
      downloadAsJson(exportedData, filename);

      // Show success message and toast notification
      const itemCount = getExportCount();
      const successMessage = `✅ Export completed successfully! Downloaded ${itemCount} items.`;
      
      setValidationResults(prev => ({
        ...prev,
        errors: [],
        warnings: [successMessage]
      }));
      
      toast.success('Export Successful', {
        description: `Successfully exported ${itemCount} items to ${filename}`,
        duration: 4000,
      });
      
      // Close dialog after showing success message
      setTimeout(() => {
        onOpenChange(false);
        setExportProgress(0);
        setValidationResults({ errors: [], warnings: [] });
      }, 2500);

    } catch (error) {
      console.error('Export failed:', error);
      setValidationResults(prev => ({
        ...prev,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Export failed']
      }));
    } finally {
      setIsExporting(false);
    }
  };

  const getExportCount = () => {
    let count = 0;
    if (exportOptions.includeTasks) {
      count += exportOptions.includeArchivedTasks ? stats.totalTasks : stats.activeTasks;
    }
    if (exportOptions.includeBoards) {
      count += exportOptions.includeArchivedBoards ? stats.totalBoards : stats.activeBoards;
    }
    if (exportOptions.includeSettings) count += 1;
    return count;
  };

  const canExport = () => {
    return (exportOptions.includeTasks || exportOptions.includeBoards || exportOptions.includeSettings) &&
           !isExporting &&
           validationResults.errors.length === 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your tasks, boards, and settings to a JSON file for backup or transfer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting...</span>
                <span className="text-sm text-muted-foreground">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Data Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What to Export</h3>
            
            {/* Tasks */}
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
                  onCheckedChange={(checked) => updateExportOption('includeTasks', checked)}
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
                      onCheckedChange={(checked) => updateExportOption('includeArchivedTasks', checked)}
                      disabled={isExporting}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Boards */}
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
                  onCheckedChange={(checked) => updateExportOption('includeBoards', checked)}
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
                      onCheckedChange={(checked) => updateExportOption('includeArchivedBoards', checked)}
                      disabled={isExporting}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
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
                  onCheckedChange={(checked) => updateExportOption('includeSettings', checked)}
                  disabled={isExporting}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Summary */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Export Summary</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Items to export:</span>
                <Badge>{getExportCount()} items</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">File format:</span>
                <Badge variant="outline">JSON</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Filename:</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {generateExportFilename(exportOptions)}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Results */}
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
                    {validationResults.errors.map((error, index) => (
                      <p key={index} className="text-xs text-destructive">{error}</p>
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
                    {validationResults.warnings.map((warning, index) => (
                      <p key={index} className="text-xs text-orange-700 dark:text-orange-400">{warning}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => validateExport()}
              disabled={isExporting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate Export
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={!canExport()}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
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
      </DialogContent>
    </Dialog>
  );
}
