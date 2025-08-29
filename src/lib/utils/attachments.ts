import { TaskAttachment, FileValidation, StorageQuota } from '@/lib/types';
import { taskDB } from './database';
import { 
  generatePDFThumbnail, 
  extractPDFMetadata, 
  validatePDFFile, 
  isPDFProcessingSupported 
} from './pdfUtils';

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
export const MAX_TASK_ATTACHMENTS_SIZE = 25 * 1024 * 1024; // 25MB per task

// Supported file types
export const SUPPORTED_TYPES = {
  images: {
    'image/jpeg': { ext: ['.jpg', '.jpeg'], maxSize: MAX_FILE_SIZE },
    'image/png': { ext: ['.png'], maxSize: MAX_FILE_SIZE },
    'image/gif': { ext: ['.gif'], maxSize: MAX_FILE_SIZE },
    'image/webp': { ext: ['.webp'], maxSize: MAX_FILE_SIZE }
  },
  documents: {
    'application/pdf': { ext: ['.pdf'], maxSize: MAX_FILE_SIZE },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['.docx'], maxSize: MAX_FILE_SIZE },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['.xlsx'], maxSize: MAX_FILE_SIZE },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: ['.pptx'], maxSize: MAX_FILE_SIZE },
    'text/plain': { ext: ['.txt'], maxSize: MAX_FILE_SIZE }
  }
};

export class AttachmentManager {
  private static instance: AttachmentManager;
  
  static getInstance(): AttachmentManager {
    if (!AttachmentManager.instance) {
      AttachmentManager.instance = new AttachmentManager();
    }
    return AttachmentManager.instance;
  }

  // File validation
  async validateFile(file: File, taskId?: string): Promise<FileValidation> {
    const validation: FileValidation = { valid: true, warnings: [] };
    
    // Check file size (individual file limit: 10MB)
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    // Check file type
    const supportedTypes = this.getSupportedTypes();
    const isSupported = Object.values(supportedTypes).flat()
      .some(type => type === file.type);
      
    if (!isSupported) {
      return { 
        valid: false, 
        error: 'File type not supported. Supported types: Images (JPG, PNG, GIF, WebP), Documents (PDF, DOCX, XLSX, PPTX, TXT)' 
      };
    }
    
    // Check task attachment limit (25MB per task)
    if (taskId) {
      const taskAttachments = await taskDB.getTaskAttachments(taskId);
      const currentTaskSize = taskAttachments.reduce((total, att) => total + att.fileSize, 0);
      
      if (currentTaskSize + file.size > MAX_TASK_ATTACHMENTS_SIZE) {
        return { 
          valid: false, 
          error: `Task attachment limit exceeded. Maximum 25MB of attachments per task. Current: ${this.formatFileSize(currentTaskSize)}` 
        };
      }
      
      if (currentTaskSize + file.size > MAX_TASK_ATTACHMENTS_SIZE * 0.8) {
        validation.warnings?.push('Approaching task attachment limit (25MB)');
      }
    }
    
    // Type-specific validation
    if (file.type.startsWith('image/')) {
      const imageValidation = await this.validateImage(file);
      if (!imageValidation.valid) return imageValidation;
      validation.warnings?.push(...(imageValidation.warnings || []));
    } else if (file.type === 'application/pdf') {
      const pdfValidation = await validatePDFFile(file);
      if (!pdfValidation.isValid) {
        return { valid: false, error: pdfValidation.error };
      }
      if (!isPDFProcessingSupported()) {
        validation.warnings?.push('PDF thumbnail generation not supported in this browser');
      }
    }
    
    // Check available storage
    const storageInfo = await this.getStorageInfo();
    if (storageInfo.percentage > 90) {
      validation.warnings?.push('Storage space is running low');
    }
    
    return validation;
  }

  private async validateImage(file: File): Promise<FileValidation> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const warnings: string[] = [];
        
        // Check dimensions for performance warning
        if (img.width > 4000 || img.height > 4000) {
          warnings.push('Large image dimensions may impact performance');
        }
        
        resolve({ valid: true, warnings });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, error: 'Invalid image file' });
      };
      
      img.src = url;
    });
  }

  // Thumbnail generation
  async generateThumbnail(file: File): Promise<string | undefined> {
    if (file.type.startsWith('image/')) {
      return this.generateImageThumbnail(file);
    } else if (file.type === 'application/pdf' && isPDFProcessingSupported()) {
      try {
        return await generatePDFThumbnail(file, {
          maxWidth: 150,
          maxHeight: 200,
          quality: 0.8
        });
      } catch (error) {
        console.warn('Failed to generate PDF thumbnail:', error);
        return undefined;
      }
    }
    
    return undefined;
  }

  private async generateImageThumbnail(file: File): Promise<string | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Calculate thumbnail size (max 150x150, maintain aspect ratio)
        const maxSize = 150;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 (JPEG, quality 0.7 for smaller size, target <10KB)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        
        // Check thumbnail size and reduce quality if needed
        if (thumbnail.length > 13000) { // ~10KB in base64
          const smallerThumbnail = canvas.toDataURL('image/jpeg', 0.5);
          resolve(smallerThumbnail);
        } else {
          resolve(thumbnail);
        }
        
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(undefined);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Metadata extraction
  async extractMetadata(file: File): Promise<TaskAttachment['metadata']> {
    const metadata: TaskAttachment['metadata'] = {};
    
    if (file.type.startsWith('image/')) {
      try {
        const imageData = await this.getImageDimensions(file);
        metadata.width = imageData.width;
        metadata.height = imageData.height;
      } catch (error) {
        console.warn('Failed to extract image dimensions:', error);
      }
    }
    
    if (file.type === 'application/pdf' && isPDFProcessingSupported()) {
      try {
        const pdfMetadata = await extractPDFMetadata(file);
        metadata.pageCount = pdfMetadata.pageCount;
        metadata.description = pdfMetadata.title || pdfMetadata.subject;
      } catch (error) {
        console.warn('Failed to extract PDF metadata:', error);
        // Fallback to simple estimation
        metadata.pageCount = await this.estimatePDFPageCount(file);
      }
    }
    
    return metadata;
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  private async estimatePDFPageCount(file: File): Promise<number | undefined> {
    try {
      // Simple PDF page estimation by counting page objects
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = new TextDecoder('latin1').decode(uint8Array);
      
      // Count "/Type /Page" occurrences
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      return matches?.length || 1;
    } catch {
      return undefined;
    }
  }

  // File utilities
  sanitizeFileName(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-_]/g, '_') // Replace invalid chars
      .replace(/_{2,}/g, '_')           // Collapse multiple underscores
      .substring(0, 100);               // Limit length
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(mimeType: string): string {
    const iconMap: Record<string, string> = {
      'application/pdf': '📄',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📈',
      'text/plain': '📄',
      'image/jpeg': '🖼️',
      'image/png': '🖼️',
      'image/gif': '🖼️',
      'image/webp': '🖼️'
    };
    
    return iconMap[mimeType] || '📎';
  }

  async getStorageInfo(): Promise<StorageQuota> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return { used: 0, available: 0, percentage: 0, attachmentSize: 0 };
    }
    
    try {
      return await taskDB.getStorageInfo();
    } catch {
      return { used: 0, available: 0, percentage: 0, attachmentSize: 0 };
    }
  }

  getSupportedTypes(): Record<string, string[]> {
    return {
      images: Object.keys(SUPPORTED_TYPES.images),
      documents: Object.keys(SUPPORTED_TYPES.documents)
    };
  }

  getAllSupportedTypes(): string[] {
    return [
      ...Object.keys(SUPPORTED_TYPES.images),
      ...Object.keys(SUPPORTED_TYPES.documents)
    ];
  }

  // Download functionality
  async downloadAttachment(attachment: TaskAttachment, fileData: ArrayBuffer): Promise<void> {
    const blob = new Blob([fileData], { type: attachment.fileType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Create attachment metadata
  createAttachmentMetadata(file: File, taskId: string): Omit<TaskAttachment, 'thumbnail' | 'metadata'> {
    return {
      id: crypto.randomUUID(),
      fileName: this.sanitizeFileName(file.name),
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
      taskId
    };
  }
}

export const attachmentManager = AttachmentManager.getInstance();

// Convenience functions
export async function validateAttachmentFile(file: File, taskId?: string): Promise<FileValidation> {
  return attachmentManager.validateFile(file, taskId);
}

export async function generateThumbnail(file: File): Promise<string | undefined> {
  return attachmentManager.generateThumbnail(file);
}

export async function extractMetadata(file: File): Promise<TaskAttachment['metadata']> {
  return attachmentManager.extractMetadata(file);
}

export function sanitizeFileName(filename: string): string {
  return attachmentManager.sanitizeFileName(filename);
}

export function formatFileSize(bytes: number): string {
  return attachmentManager.formatFileSize(bytes);
}