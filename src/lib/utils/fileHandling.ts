import { ExportData, ImportValidationResult, validateImportData } from './exportImport';

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.json'];

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  file?: File;
}

export interface FileReadResult {
  success: boolean;
  data?: ExportData;
  error?: string;
  validationResult?: ImportValidationResult;
}

/**
 * Validates a file before processing
 */
export function validateFile(file: File): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`);
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
    errors.push(`Invalid file type. Only ${ALLOWED_FILE_TYPES.join(', ')} files are allowed`);
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Warn about large files
  if (file.size > 1024 * 1024) { // 1MB
    warnings.push('Large file detected. Import may take some time to process');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    file: errors.length === 0 ? file : undefined,
  };
}

/**
 * Reads and parses a JSON file
 */
export async function readJsonFile(file: File): Promise<FileReadResult> {
  try {
    // Validate file first
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.errors.join(', '),
      };
    }

    // Read file content
    const fileContent = await readFileAsText(file);
    
    // Parse JSON
    let jsonData: any;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON format: ' + (parseError instanceof Error ? parseError.message : 'Unknown parsing error'),
      };
    }

    // Validate data structure
    const validationResult = validateImportData(jsonData);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        error: 'Invalid data format: ' + validationResult.errors.join(', '),
        validationResult,
      };
    }

    return {
      success: true,
      data: validationResult.data,
      validationResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while reading file',
    };
  }
}

/**
 * Reads a file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file: ' + reader.error?.message));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Creates a file input element for JSON file selection
 */
export function createFileInput(
  onFileSelected: (file: File) => void,
  onError?: (error: string) => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = ALLOWED_FILE_TYPES.join(',');
  input.style.display = 'none';
  
  input.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      const validation = validateFile(file);
      if (validation.isValid) {
        onFileSelected(file);
      } else if (onError) {
        onError(validation.errors.join(', '));
      }
    }
    
    // Reset input value to allow selecting the same file again
    target.value = '';
  });
  
  return input;
}

/**
 * Triggers file selection dialog
 */
export function selectJsonFile(): Promise<File> {
  return new Promise((resolve, reject) => {
    const input = createFileInput(
      (file) => resolve(file),
      (error) => reject(new Error(error))
    );
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}

/**
 * Validates and previews import data
 */
export async function previewImportData(file: File): Promise<{
  success: boolean;
  preview?: {
    taskCount: number;
    boardCount: number;
    hasSettings: boolean;
    exportedAt: string;
    version: string;
    fileSize: string;
  };
  validation?: ImportValidationResult;
  error?: string;
}> {
  try {
    const result = await readJsonFile(file);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error,
        validation: result.validationResult,
      };
    }

    const preview = {
      taskCount: result.data.tasks.length,
      boardCount: result.data.boards.length,
      hasSettings: !!result.data.settings,
      exportedAt: result.data.exportedAt,
      version: result.data.version,
      fileSize: formatFileSize(file.size),
    };

    return {
      success: true,
      preview,
      validation: result.validationResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Batch processes multiple files
 */
export async function processMultipleFiles(
  files: FileList,
  onProgress?: (current: number, total: number) => void
): Promise<{
  successful: FileReadResult[];
  failed: { file: File; error: string }[];
}> {
  const successful: FileReadResult[] = [];
  const failed: { file: File; error: string }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
    
    try {
      const result = await readJsonFile(file);
      if (result.success) {
        successful.push(result);
      } else {
        failed.push({ file, error: result.error || 'Unknown error' });
      }
    } catch (error) {
      failed.push({ 
        file, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return { successful, failed };
}
