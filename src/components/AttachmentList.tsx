"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Eye, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  FileText
} from "@/lib/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskAttachment } from "@/lib/types";
import { attachmentManager } from "@/lib/utils/attachments";
import { useTaskStore } from "@/lib/stores/taskStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AttachmentModalViewer } from "./AttachmentModalViewer";

interface AttachmentListProps {
  taskId: string;
  attachments: TaskAttachment[];
  onAttachmentRemove?: (attachmentId: string) => void;
  readonly?: boolean;
  className?: string;
}

export function AttachmentList({ 
  attachments, 
  onAttachmentRemove,
  readonly = false,
  className
}: AttachmentListProps) {
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);
  const { downloadAttachment } = useTaskStore();

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      const blob = await downloadAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${attachment.originalName}`);
    } catch {
      toast.error('Failed to download attachment');
    }
  };

  const handlePreview = (attachment: TaskAttachment) => {
    // Always show in modal viewer for all supported file types
    setPreviewAttachment(attachment);
  };

  const handleRemove = async (attachment: TaskAttachment) => {
    if (!onAttachmentRemove) return;
    
    try {
      onAttachmentRemove(attachment.id);
      toast.success(`Removed ${attachment.originalName}`);
    } catch {
      toast.error('Failed to remove attachment');
    }
  };

  if (attachments.length === 0) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground", className)}>
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No attachments</p>
      </div>
    );
  }

  const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</span>
        <span>{attachmentManager.formatFileSize(totalSize)} total</span>
      </div>

      {/* Attachment Items */}
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment.id}
            attachment={attachment}
            onDownload={() => handleDownload(attachment)}
            onPreview={() => handlePreview(attachment)}
            onRemove={readonly ? undefined : () => handleRemove(attachment)}
          />
        ))}
      </div>
      
      {/* Attachment Modal Viewer */}
      {previewAttachment && (
        <AttachmentModalViewer
          attachment={previewAttachment}
          attachments={attachments}
          onClose={() => setPreviewAttachment(null)}
          onAttachmentChange={setPreviewAttachment}
        />
      )}
    </div>
  );
}

interface AttachmentItemProps {
  attachment: TaskAttachment;
  onDownload: () => void;
  onPreview: () => void;
  onRemove?: () => void;
}

function AttachmentItem({ attachment, onDownload, onPreview, onRemove }: AttachmentItemProps) {
  const icon = attachmentManager.getFileIcon(attachment.fileType);
  const size = attachmentManager.formatFileSize(attachment.fileSize);

  return (
    <Card className="hover:shadow-sm transition-all duration-200 hover:scale-[1.01]">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Thumbnail or Icon */}
          <div className="relative flex-shrink-0">
            {attachment.thumbnail ? (
              <img
                src={attachment.thumbnail}
                alt={attachment.originalName}
                className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                onClick={onPreview}
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-muted rounded border hover:bg-muted/80 transition-colors cursor-pointer"
                   onClick={onPreview}>
                {icon}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-background border shadow-sm hover:bg-background/80"
              onClick={onPreview}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer"
                 onClick={onPreview}
                 title={attachment.originalName}>
              {attachment.originalName}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {attachment.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
              <span className="text-xs text-muted-foreground">{size}</span>
            </div>
            
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
            </div>

            {/* Metadata */}
            {attachment.metadata && (
              <div className="text-xs text-muted-foreground mt-1">
                {attachment.metadata.width && attachment.metadata.height && (
                  <span>{attachment.metadata.width} × {attachment.metadata.height}</span>
                )}
                {attachment.metadata.pageCount && (
                  <span>{attachment.metadata.pageCount} pages</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              {onRemove && (
                <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

