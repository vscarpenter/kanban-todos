import type { TaskAttachment } from '@/lib/types';

export type FileCategory = 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'archive' | 'code' | 'other';

export interface FileTypeInfo {
  category: FileCategory;
  icon: string;
  color: string;
  canPreview: boolean;
  description: string;
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  // Document types
  if (mimeType.includes('word') || 
      mimeType.includes('document') ||
      mimeType === 'application/vnd.oasis.opendocument.text' ||
      mimeType === 'application/rtf') return 'document';
  
  // Spreadsheet types
  if (mimeType.includes('sheet') || 
      mimeType.includes('excel') ||
      mimeType === 'application/vnd.oasis.opendocument.spreadsheet' ||
      mimeType === 'text/csv') return 'spreadsheet';
  
  // Presentation types
  if (mimeType.includes('presentation') || 
      mimeType.includes('powerpoint') ||
      mimeType === 'application/vnd.oasis.opendocument.presentation') return 'presentation';
  
  // Archive types
  if (mimeType.includes('zip') ||
      mimeType.includes('rar') ||
      mimeType.includes('tar') ||
      mimeType.includes('gz') ||
      mimeType.includes('7z')) return 'archive';
  
  // Code types
  if (mimeType.startsWith('text/') ||
      mimeType.includes('javascript') ||
      mimeType.includes('json') ||
      mimeType.includes('xml') ||
      mimeType.includes('html')) return 'code';
  
  return 'other';
}

/**
 * Get file type information including icon and styling
 */
export function getFileTypeInfo(mimeType: string): FileTypeInfo {
  const category = getFileCategory(mimeType);
  
  const fileTypeMap: Record<FileCategory, FileTypeInfo> = {
    image: {
      category: 'image',
      icon: 'Image',
      color: 'text-green-600',
      canPreview: true,
      description: 'Image'
    },
    pdf: {
      category: 'pdf',
      icon: 'FileText',
      color: 'text-red-600',
      canPreview: true,
      description: 'PDF Document'
    },
    document: {
      category: 'document',
      icon: 'FileText',
      color: 'text-blue-600',
      canPreview: false,
      description: 'Document'
    },
    spreadsheet: {
      category: 'spreadsheet',
      icon: 'BarChart',
      color: 'text-green-700',
      canPreview: false,
      description: 'Spreadsheet'
    },
    presentation: {
      category: 'presentation',
      icon: 'Monitor',
      color: 'text-orange-600',
      canPreview: false,
      description: 'Presentation'
    },
    video: {
      category: 'video',
      icon: 'Video',
      color: 'text-purple-600',
      canPreview: true,
      description: 'Video'
    },
    audio: {
      category: 'audio',
      icon: 'Music',
      color: 'text-pink-600',
      canPreview: true,
      description: 'Audio'
    },
    archive: {
      category: 'archive',
      icon: 'Archive',
      color: 'text-gray-600',
      canPreview: false,
      description: 'Archive'
    },
    code: {
      category: 'code',
      icon: 'FileText',
      color: 'text-indigo-600',
      canPreview: true,
      description: 'Code'
    },
    other: {
      category: 'other',
      icon: 'FileText',
      color: 'text-gray-600',
      canPreview: false,
      description: 'File'
    }
  };
  
  return fileTypeMap[category];
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
}

/**
 * Check if file type supports thumbnail generation
 */
export function supportsThumbnail(mimeType: string): boolean {
  const category = getFileCategory(mimeType);
  return category === 'image' || category === 'pdf';
}

/**
 * Check if file can be previewed in browser
 */
export function canPreviewInBrowser(mimeType: string): boolean {
  const info = getFileTypeInfo(mimeType);
  return info.canPreview;
}

/**
 * Generate a safe filename for storage
 */
export function generateSafeFilename(originalName: string): string {
  // Remove special characters and spaces, keep extension
  const ext = getFileExtension(originalName);
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  const safeName = nameWithoutExt
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50); // Limit length
  
  return ext ? `${safeName}.${ext}` : safeName;
}

/**
 * Get attachment display name (prioritize original name)
 */
export function getAttachmentDisplayName(attachment: TaskAttachment): string {
  return attachment.originalName || attachment.fileName;
}

/**
 * Get attachment description with metadata
 */
export function getAttachmentDescription(attachment: TaskAttachment): string {
  const fileInfo = getFileTypeInfo(attachment.fileType);
  const size = formatFileSize(attachment.fileSize);
  
  let description = `${fileInfo.description} • ${size}`;
  
  // Add specific metadata based on file type
  if (attachment.metadata) {
    if (fileInfo.category === 'pdf' && attachment.metadata.pageCount) {
      description += ` • ${attachment.metadata.pageCount} pages`;
    } else if (fileInfo.category === 'image' && attachment.metadata.width && attachment.metadata.height) {
      description += ` • ${attachment.metadata.width}x${attachment.metadata.height}`;
    }
  }
  
  return description;
}