"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useBoardStore } from "@/lib/stores/boardStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { 
  readJsonFile, 
  previewImportData
} from "@/lib/utils/fileHandling";
import { 
  processAdvancedImport,
  detectImportConflicts,
  ImportConflicts,
  ExportData
} from "@/lib/utils/exportImport";
import { 
  ConflictResolutionOptions,
  ConflictResolutionStrategy,
  MergeStrategy,
  generateResolutionSummary
} from "@/lib/utils/conflictResolution";
import { 
  Upload, 
  FileText, 
  Folder, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Loader2,
  File,
  AlertTriangle,
  Info
} from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportPreview {
  taskCount: number;
  boardCount: number;
  hasSettings: boolean;
  exportedAt: string;
  version: string;
  fileSize: string;
}

interface ImportStep {
  id: 'select' | 'preview' | 'conflicts' | 'importing' | 'complete';
  title: string;
  description: string;
}

const importSteps: ImportStep[] = [
  { id: 'select', title: 'Select File', description: 'Choose a JSON file to import' },
  { id: 'preview', title: 'Preview Data', description: 'Review the data to be imported' },
  { id: 'conflicts', title: 'Resolve Conflicts', description: 'Handle any data conflicts' },
  { id: 'importing', title: 'Importing', description: 'Processing your data' },
  { id: 'complete', title: 'Complete', description: 'Import finished successfully' },
];

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { tasks, importTasks } = useTaskStore();
  const { boards, importBoards } = useBoardStore();
  const { settings, importSettings } = useSettingsStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<ImportStep['id']>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [conflicts, setConflicts] = useState<ImportConflicts | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Conflict resolution options
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
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);
    setWarnings([]);

    try {
      // Step 1: Read and validate file
      const fileResult = await readJsonFile(file);
      
      if (!fileResult.success || !fileResult.data) {
        setErrors([fileResult.error || 'Failed to read file']);
        return;
      }

      // Step 2: Generate preview
      const previewResult = await previewImportData(file);
      
      if (!previewResult.success || !previewResult.preview) {
        setErrors([previewResult.error || 'Failed to preview file']);
        return;
      }

      // Step 3: Detect conflicts
      const detectedConflicts = detectImportConflicts(fileResult.data, tasks, boards);

      // Set state
      setSelectedFile(file);
      setImportData(fileResult.data);
      setImportPreview(previewResult.preview);
      setConflicts(detectedConflicts);
      
      // Add validation warnings if any
      if (fileResult.validationResult?.warnings) {
        setWarnings(fileResult.validationResult.warnings.map(w => 
          typeof w === 'string' ? w : (w as { message: string }).message
        ));
      }

      // Move to next step
      setCurrentStep('preview');

    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unexpected error occurred']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importData || !conflicts) return;

    setIsProcessing(true);
    setCurrentStep('importing');
    setImportProgress(0);

    try {
      // Step 1: Process import with advanced conflict resolution
      setImportProgress(20);
      const result = processAdvancedImport(
        importData,
        tasks,
        boards,
        settings,
        conflictOptions
      );

      // Step 2: Import boards first (tasks depend on boards)
      setImportProgress(40);
      if (result.result.resolvedBoards.length > 0) {
        await importBoards(result.result.resolvedBoards);
      }

      // Step 3: Import tasks
      setImportProgress(60);
      if (result.result.resolvedTasks.length > 0) {
        await importTasks(result.result.resolvedTasks);
      }

      // Step 4: Import settings
      setImportProgress(80);
      if (result.result.resolvedSettings) {
        await importSettings(result.result.resolvedSettings);
      }

      // Step 5: Complete
      setImportProgress(100);
      setCurrentStep('complete');

      // Generate summary
      const summary = generateResolutionSummary(result.result.resolutionLog);
      console.log('Import completed:', summary);

      // Close dialog after delay
      setTimeout(() => {
        onOpenChange(false);
        resetDialog();
      }, 2000);

    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Import failed']);
      setCurrentStep('preview'); // Go back to allow retry
    } finally {
      setIsProcessing(false);
    }
  };

  const hasConflicts = () => {
    if (!conflicts) return false;
    return conflicts.duplicateTaskIds.length > 0 ||
           conflicts.duplicateBoardIds.length > 0 ||
           conflicts.orphanedTasks.length > 0 ||
           conflicts.boardNameConflicts.length > 0 ||
           (conflicts.defaultBoardConflicts?.length ?? 0) > 0;
  };

  const hasDefaultBoardConflicts = () => {
    return (conflicts?.defaultBoardConflicts?.length ?? 0) > 0;
  };

  const getStepIndex = () => {
    return importSteps.findIndex(step => step.id === currentStep);
  };

  const updateConflictOption = <K extends keyof ConflictResolutionOptions>(
    key: K,
    value: ConflictResolutionOptions[K]
  ) => {
    setConflictOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </DialogTitle>
          <DialogDescription>
            Import tasks, boards, and settings from a JSON file. Review conflicts before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {importSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${index <= getStepIndex() 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {index + 1}
                  </div>
                  {index < importSteps.length - 1 && (
                    <div className={`
                      w-16 h-0.5 mx-2
                      ${index < getStepIndex() ? 'bg-primary' : 'bg-muted'}
                    `} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="font-medium">{importSteps[getStepIndex()]?.title}</h3>
              <p className="text-sm text-muted-foreground">
                {importSteps[getStepIndex()]?.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Step Content */}
          {currentStep === 'select' && (
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Select Import File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose a JSON file exported from Cascade Task Management
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <File className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* File Requirements */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Supported formats: JSON files exported from Cascade Task Management.
                  Maximum file size: 10MB.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 'preview' && importPreview && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Import Preview</h3>
              
              {/* File Info */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File:</span>
                  <span className="text-sm">{selectedFile?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Size:</span>
                  <span className="text-sm">{importPreview.fileSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version:</span>
                  <Badge variant="outline">{importPreview.version}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Exported:</span>
                  <span className="text-sm">
                    {new Date(importPreview.exportedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Data Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{importPreview.taskCount}</div>
                  <div className="text-sm text-muted-foreground">Tasks</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Folder className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{importPreview.boardCount}</div>
                  <div className="text-sm text-muted-foreground">Boards</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{importPreview.hasSettings ? '1' : '0'}</div>
                  <div className="text-sm text-muted-foreground">Settings</div>
                </div>
              </div>

              {/* Default Board Conflicts Warning */}
              {hasDefaultBoardConflicts() && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Default board conflicts detected! The import contains boards that match your existing default boards (like &quot;Work Tasks&quot;). 
                    These will be merged with your existing boards to avoid duplicates.
                  </AlertDescription>
                </Alert>
              )}

              {/* Default Board Conflicts Details */}
              {hasDefaultBoardConflicts() && (
                <div className="space-y-3">
                  <h4 className="font-medium">Default Board Merges</h4>
                  {conflicts!.defaultBoardConflicts?.map((conflict, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{conflict.importedBoard.name}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">Will merge with existing default board</span>
                      </div>
                      <Badge variant="outline">Auto-merge</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Other Conflicts Warning */}
              {(hasConflicts() && !hasDefaultBoardConflicts()) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Conflicts detected! Some data already exists in your workspace. 
                    You&apos;ll need to resolve these conflicts before importing.
                  </AlertDescription>
                </Alert>
              )}

              {/* Mixed Conflicts Warning */}
              {(hasConflicts() && hasDefaultBoardConflicts() && conflicts &&
                (conflicts.duplicateTaskIds.length > 0 || conflicts.duplicateBoardIds.length > 0 || 
                 conflicts.orphanedTasks.length > 0 || conflicts.boardNameConflicts.length > 0)) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Additional conflicts detected beyond default boards. 
                    Please configure resolution strategies below.
                  </AlertDescription>
                </Alert>
              )}

              {/* Conflict Resolution Options */}
              {(hasConflicts() && conflicts && (conflicts.duplicateTaskIds.length > 0 || conflicts.duplicateBoardIds.length > 0 || 
                conflicts.orphanedTasks.length > 0 || conflicts.boardNameConflicts.length > 0)) && (
                <div className="space-y-4">
                  <h4 className="font-medium">Conflict Resolution</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Task Conflicts</Label>
                      <Select
                        value={conflictOptions.taskStrategy}
                        onValueChange={(value: ConflictResolutionStrategy) => 
                          updateConflictOption('taskStrategy', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip conflicting tasks</SelectItem>
                          <SelectItem value="overwrite">Overwrite existing tasks</SelectItem>
                          <SelectItem value="merge">Merge task data</SelectItem>
                          <SelectItem value="generate_new_ids">Generate new IDs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Board Conflicts</Label>
                      <Select
                        value={conflictOptions.boardStrategy}
                        onValueChange={(value: ConflictResolutionStrategy) => 
                          updateConflictOption('boardStrategy', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Skip conflicting boards</SelectItem>
                          <SelectItem value="overwrite">Overwrite existing boards</SelectItem>
                          <SelectItem value="merge">Merge board data</SelectItem>
                          <SelectItem value="rename">Rename boards</SelectItem>
                          <SelectItem value="generate_new_ids">Generate new IDs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Merge Strategy</Label>
                    <Select
                      value={conflictOptions.mergeStrategy}
                      onValueChange={(value: MergeStrategy) => 
                        updateConflictOption('mergeStrategy', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep_existing">Keep existing data</SelectItem>
                        <SelectItem value="use_imported">Use imported data</SelectItem>
                        <SelectItem value="merge_fields">Merge individual fields</SelectItem>
                        <SelectItem value="keep_newer">Keep newer data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="generateBackup"
                      checked={conflictOptions.generateBackup}
                      onCheckedChange={(checked) => updateConflictOption('generateBackup', checked)}
                    />
                    <Label htmlFor="generateBackup">Create backup before import</Label>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'importing' && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium">Importing Data...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your data
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium">Import Complete!</h3>
                <p className="text-sm text-muted-foreground">
                  Your data has been successfully imported
                </p>
              </div>
            </div>
          )}

          {/* Errors and Warnings */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {warnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'preview') {
                  setCurrentStep('select');
                } else {
                  onOpenChange(false);
                  resetDialog();
                }
              }}
              disabled={isProcessing}
            >
              {currentStep === 'preview' ? 'Back' : 'Cancel'}
            </Button>
            
            <div className="flex gap-2">
              {currentStep === 'preview' && (
                <Button 
                  onClick={handleImport}
                  disabled={isProcessing || errors.length > 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
