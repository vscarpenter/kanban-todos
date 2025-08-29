"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText } from "@/lib/icons";
import { attachmentManager, validateAttachmentFile } from "@/lib/utils/attachments";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AttachmentUploaderProps {
  onFileAdd: (file: File) => Promise<void>;
  taskId?: string; // For validation against task attachment limits
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function AttachmentUploader({ 
  onFileAdd, 
  taskId,
  maxFiles = 10, 
  disabled = false,
  className
}: AttachmentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState<Map<string, { name: string; progress: number; controller: AbortController; retryCount: number }>>(new Map());
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [maxConcurrentUploads] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const supportedTypes = attachmentManager.getAllSupportedTypes();
  const acceptedTypes = supportedTypes.join(',');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the drop zone completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const processUploadQueue = useCallback(async () => {
    if (uploadQueue.length === 0 || uploading.size >= maxConcurrentUploads) return;
    
    const filesToProcess = uploadQueue.slice(0, maxConcurrentUploads - uploading.size);
    setUploadQueue(prev => prev.slice(filesToProcess.length));
    
    const uploadPromises = filesToProcess.map(async (file) => {
      const fileId = `${file.name}_${Date.now()}_${Math.random()}`;
      
      const uploadFile = async (retryCount = 0): Promise<void> => {
        try {
          const controller = new AbortController();
          setUploading(prev => new Map(prev).set(fileId, { name: file.name, progress: 0, controller, retryCount }));
          
          // Validate file
          const validation = await validateAttachmentFile(file, taskId);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          // Show warnings as info toasts
          if (validation.warnings?.length) {
            validation.warnings.forEach(warning => {
              toast.info(warning);
            });
          }

          // Simulate progress updates
          setUploading(prev => new Map(prev).set(fileId, { name: file.name, progress: 50, controller, retryCount }));
          
          // Upload file
          await onFileAdd(file);
          
          setUploading(prev => new Map(prev).set(fileId, { name: file.name, progress: 100, controller, retryCount }));
          
        } catch (error) {
          if (retryCount < 2) {
            // Retry up to 2 times
            toast.info(`Retrying upload of ${file.name} (attempt ${retryCount + 2}/3)`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return uploadFile(retryCount + 1);
          } else {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            toast.error(`${file.name}: ${errorMessage} (failed after 3 attempts)`);
          }
        } finally {
          setUploading(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileId);
            return newMap;
          });
        }
      };
      
      return uploadFile();
    });
    
    await Promise.allSettled(uploadPromises);
  }, [uploadQueue, uploading.size, maxConcurrentUploads, taskId, onFileAdd]);
  
  // Process queue when it changes or uploads complete
  useEffect(() => {
    processUploadQueue();
  }, [processUploadQueue]);

  const handleFiles = useCallback(async (files: File[]) => {
    // Check max files limit
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed at once`);
      return;
    }

    // Add files to queue
    setUploadQueue(prev => [...prev, ...files]);
    toast.info(`Added ${files.length} file${files.length > 1 ? 's' : ''} to upload queue`);
  }, [maxFiles]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, [disabled, handleFiles]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (disabled) return;
    
    const items = Array.from(e.clipboardData?.items || []);
    const files: File[] = [];
    
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    
    if (files.length > 0) {
      e.preventDefault();
      await handleFiles(files);
      setShowPasteHint(false);
    }
  }, [disabled, handleFiles]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      setShowPasteHint(true);
      setTimeout(() => setShowPasteHint(false), 2000);
    }
  }, []);
  
  // Add global paste event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePaste, handleKeyDown]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    
    const files = Array.from(e.target.files);
    await handleFiles(files);
    
    // Reset input
    e.target.value = '';
  }, [disabled, handleFiles]);

  return (
    <div className={cn("space-y-4", className)} ref={containerRef} tabIndex={0}>
      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-primary/50 relative",
          isDragOver && "border-primary bg-primary/5 scale-[1.02]",
          showPasteHint && "border-green-500 bg-green-50 dark:bg-green-950/20",
          disabled && "opacity-50 cursor-not-allowed hover:border-border"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Upload className={cn(
                "h-10 w-10 transition-colors",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div>
              <h4 className="text-base font-medium">
                {showPasteHint ? "Paste files here (Ctrl+V)" : 
                 isDragOver ? "Drop files here" : "Drop files here or click to browse"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {showPasteHint ? "You can paste images and files from your clipboard" :
                 "Images (JPG, PNG, GIF, WebP) • Documents (PDF, DOCX, XLSX, PPTX, TXT)"}
              </p>
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <div>Max file size: 10MB • Max per task: 25MB</div>
                <div>Max files at once: {maxFiles} • Paste with Ctrl+V (⌘+V on Mac)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Progress */}
      {(uploading.size > 0 || uploadQueue.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Upload Status ({uploading.size} active, {uploadQueue.length} queued)
          </h4>
          {Array.from(uploading.entries()).map(([fileId, uploadInfo]) => {
            const handleCancel = () => {
              uploadInfo.controller.abort();
              setUploading(prev => {
                const newMap = new Map(prev);
                newMap.delete(fileId);
                return newMap;
              });
              toast.info(`Cancelled upload of ${uploadInfo.name}`);
            };
            
            return (
              <div key={fileId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium">{uploadInfo.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {uploadInfo.progress === 100 ? 'Upload complete' : 
                     uploadInfo.retryCount > 0 ? `Retrying... ${uploadInfo.progress}% (attempt ${uploadInfo.retryCount + 1}/3)` :
                     `Uploading... ${uploadInfo.progress}%`}
                  </div>
                  <Progress value={uploadInfo.progress} className="h-2" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  title="Cancel upload"
                >
                  ×
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}