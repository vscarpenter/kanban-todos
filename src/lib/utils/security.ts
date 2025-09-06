/**
 * Security utilities for input sanitization, validation, and XSS prevention
 */

// Maximum lengths for different input types
export const INPUT_LIMITS = {
  TASK_TITLE: 200,
  TASK_DESCRIPTION: 1000,
  BOARD_NAME: 100,
  BOARD_DESCRIPTION: 500,
  TAG_LENGTH: 50,
  MAX_TAGS: 10,
  SEARCH_QUERY: 500,
} as const;

// Allowed characters for different input types
const ALLOWED_PATTERNS = {
  TASK_TITLE: /^[a-zA-Z0-9\s\-_.,!?()[\]]*$/,
  BOARD_NAME: /^[a-zA-Z0-9\s\-_.,!?()[\]]*$/,
  TAG: /^[a-zA-Z0-9\s\-_]*$/,
  SEARCH: /^[a-zA-Z0-9\s\-_.,!?()[\]]*$/,
} as const;

/**
 * Sanitizes text input by removing potentially dangerous characters
 */
export function sanitizeTextInput(
  input: string,
  type: keyof typeof INPUT_LIMITS,
  options: {
    allowHtml?: boolean;
    preserveWhitespace?: boolean;
    trimWhitespace?: boolean;
  } = {}
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace if requested
  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim();
  }

  // Remove HTML tags if not allowed
  if (!options.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/file:/gi, ''); // Remove file: protocol

  // Apply pattern validation based on type
  const pattern = getPatternForType(type);
  if (pattern && !pattern.test(sanitized)) {
    // Remove invalid characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,!?()[\]]/g, '');
  }

  // Enforce length limits
  const maxLength = INPUT_LIMITS[type];
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Normalize whitespace if not preserving
  if (!options.preserveWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  return sanitized;
}

/**
 * Gets the appropriate pattern for input type validation
 */
function getPatternForType(type: keyof typeof INPUT_LIMITS): RegExp | null {
  switch (type) {
    case 'TASK_TITLE':
    case 'BOARD_NAME':
      return ALLOWED_PATTERNS.TASK_TITLE;
    case 'TAG_LENGTH':
      return ALLOWED_PATTERNS.TAG;
    case 'SEARCH_QUERY':
      return ALLOWED_PATTERNS.SEARCH;
    default:
      return null;
  }
}

/**
 * Validates and sanitizes task data
 */
export function sanitizeTaskData(taskData: {
  title: string;
  description?: string;
  tags?: string[];
}): {
  title: string;
  description: string;
  tags: string[];
} {
  const sanitizedTitle = sanitizeTextInput(taskData.title, 'TASK_TITLE');
  const sanitizedDescription = sanitizeTextInput(
    taskData.description || '',
    'TASK_DESCRIPTION',
    { preserveWhitespace: true }
  );

  // Sanitize and limit tags
  const sanitizedTags = (taskData.tags || [])
    .map(tag => sanitizeTextInput(tag, 'TAG_LENGTH'))
    .filter(tag => tag.length > 0)
    .slice(0, INPUT_LIMITS.MAX_TAGS);

  return {
    title: sanitizedTitle,
    description: sanitizedDescription,
    tags: sanitizedTags,
  };
}

/**
 * Validates and sanitizes board data
 */
export function sanitizeBoardData(boardData: {
  name: string;
  description?: string;
}): {
  name: string;
  description: string;
} {
  const sanitizedName = sanitizeTextInput(boardData.name, 'BOARD_NAME');
  const sanitizedDescription = sanitizeTextInput(
    boardData.description || '',
    'BOARD_DESCRIPTION',
    { preserveWhitespace: true }
  );

  return {
    name: sanitizedName,
    description: sanitizedDescription,
  };
}

/**
 * Validates and sanitizes search query
 */
export function sanitizeSearchQuery(query: string): string {
  return sanitizeTextInput(query, 'SEARCH_QUERY');
}

/**
 * Validates file upload for import operations
 */
export function validateImportFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // Check file type
  if (file.type !== 'application/json') {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JSON file.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JSON file.',
    };
  }

  return { isValid: true };
}

/**
 * Validates JSON content for import operations
 */
export function validateImportJson(jsonString: string): {
  isValid: boolean;
  error?: string;
  data?: unknown;
} {
  try {
    const data = JSON.parse(jsonString);
    
    // Check for basic structure
    if (typeof data !== 'object' || data === null) {
      return {
        isValid: false,
        error: 'Invalid JSON structure. Expected an object.',
      };
    }

    // Check for required fields
    if (!data.version || !data.exportedAt) {
      return {
        isValid: false,
        error: 'Invalid export format. Missing required fields.',
      };
    }

    return { isValid: true, data };
    } catch {
    return {
      isValid: false,
      error: 'Invalid JSON format. Please check your file.',
    };
  }
}

/**
 * Rate limiting for search operations
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const searchRateLimiter = new RateLimiter(10, 1000); // 10 requests per second

/**
 * Content Security Policy utilities
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
} as const;

/**
 * Generates CSP header value
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Validates and sanitizes user input for display
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitizes and validates board ID
 */
export function sanitizeBoardId(boardId: string): string | null {
  if (!boardId || typeof boardId !== 'string') {
    return null;
  }

  const sanitized = boardId.trim();
  
  if (!isValidUUID(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Sanitizes and validates task ID
 */
export function sanitizeTaskId(taskId: string): string | null {
  if (!taskId || typeof taskId !== 'string') {
    return null;
  }

  const sanitized = taskId.trim();
  
  if (!isValidUUID(sanitized)) {
    return null;
  }

  return sanitized;
}
