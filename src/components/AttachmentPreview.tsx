import React, { memo, useState } from 'react';
import { 
  Eye, 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive, 
  BarChart, 
  Monitor 
} from '@/lib/icons';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { TaskAttachment } from '@/lib/types';
import {
  getFileTypeInfo,
  getAttachmentDisplayName,
  getAttachmentDescription,
  canPreviewInBrowser,
  formatFileSize
} from '@/lib/utils/fileUtils';

interface AttachmentPreviewProps {
  attachment: TaskAttachment;
  size?: 'thumbnail' | 'card' | 'full';
  showMetadata?: boolean;
  onClick?: () => void;
  onDownload?: () => void;
  onPreview?: () => void;
  className?: string;
}

const AttachmentPreview = memo(({
  attachment,
  size = 'card',
  showMetadata = true,
  onClick,
  onDownload,
  onPreview,
  className
}: AttachmentPreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const fileInfo = getFileTypeInfo(attachment.fileType);
  const displayName = getAttachmentDisplayName(attachment);
  const description = getAttachmentDescription(attachment);
  const canPreview = canPreviewInBrowser(attachment.fileType);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload?.();
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.();
  };

  const renderThumbnail = () => {
    // For images with thumbnails or original data
    if (fileInfo.category === 'image' && attachment.thumbnail && !imageError) {
      return (
        <img
          src={attachment.thumbnail}
          alt={displayName}
          className={cn(
            "object-cover rounded",
            size === 'thumbnail' && "w-8 h-8",
            size === 'card' && "w-12 h-12",
            size === 'full' && "w-16 h-16"
          )}
          onError={() => setImageError(true)}
        />
      );
    }

    // For PDFs with thumbnails
    if (fileInfo.category === 'pdf' && attachment.thumbnail && !imageError) {
      return (
        <div className="relative">
          <img
            src={attachment.thumbnail}
            alt={displayName}
            className={cn(
              "object-cover rounded border border-gray-200",
              size === 'thumbnail' && "w-8 h-8",
              size === 'card' && "w-12 h-12",
              size === 'full' && "w-16 h-16"
            )}
            onError={() => setImageError(true)}
          />
          {/* PDF indicator overlay */}
          <div className={cn(
            "absolute bottom-0 left-0 bg-red-600 text-white text-xs px-1 rounded-tl rounded-br",
            size === 'thumbnail' && "text-[8px] px-0.5",
            size === 'card' && "text-[10px]",
            size === 'full' && "text-xs"
          )}>
            PDF
          </div>
        </div>
      );
    }

    // Fallback to file type icon
    const getIconComponent = (iconName: string) => {
      switch (iconName) {
        case 'Image': return ImageIcon;
        case 'FileText': return FileText;
        case 'Video': return Video;
        case 'Music': return Music;
        case 'Archive': return Archive;
        case 'BarChart': return BarChart;
        case 'Monitor': return Monitor;
        default: return FileText;
      }
    };

    const IconComponent = getIconComponent(fileInfo.icon);
    return (
      <div className={cn(
        "flex items-center justify-center rounded bg-gray-50 border border-gray-200",
        fileInfo.color,
        size === 'thumbnail' && "w-8 h-8",
        size === 'card' && "w-12 h-12",
        size === 'full' && "w-16 h-16"
      )}>
        <IconComponent 
          size={
            size === 'thumbnail' ? 14 : 
            size === 'card' ? 20 : 
            24
          } 
        />
      </div>
    );
  };

  if (size === 'thumbnail') {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex-shrink-0 hover:opacity-80 transition-opacity",
          className
        )}
        title={`${displayName} (${formatFileSize(attachment.fileSize)})`}
      >
        {renderThumbnail()}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "group relative bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-sm",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex items-start gap-3",
        size === 'card' && "p-3",
        size === 'full' && "p-4"
      )}>
        {/* Thumbnail/Icon */}
        <div className="flex-shrink-0">
          {renderThumbnail()}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className={cn(
                "font-medium text-gray-900 truncate",
                size === 'card' && "text-sm",
                size === 'full' && "text-base"
              )}>
                {displayName}
              </h4>
              {showMetadata && (
                <p className={cn(
                  "text-gray-500 truncate",
                  size === 'card' && "text-xs mt-0.5",
                  size === 'full' && "text-sm mt-1"
                )}>
                  {description}
                </p>
              )}
              {size === 'full' && attachment.metadata?.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {attachment.metadata.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0",
                    size === 'full' && "h-8 w-8"
                  )}
                  onClick={handlePreview}
                  title="Preview"
                >
                  <Eye size={size === 'full' ? 16 : 14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  size === 'full' && "h-8 w-8"
                )}
                onClick={handleDownload}
                title="Download"
              >
                <Download size={size === 'full' ? 16 : 14} />
              </Button>
              {size === 'full' && canPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handlePreview}
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator if uploading */}
      {attachment.fileSize === 0 && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-sm text-gray-600">Uploading...</div>
        </div>
      )}
    </div>
  );
});

AttachmentPreview.displayName = 'AttachmentPreview';

export default AttachmentPreview;