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

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  DEFAULT_MAX_REQUESTS: 10,      // Maximum requests allowed in window
  DEFAULT_WINDOW_MS: 1000,       // Window duration in milliseconds (1 second)
} as const;

// Allowed characters for different input types
const ALLOWED_PATTERNS = {
  TASK_TITLE: /^[a-zA-Z0-9\s\-_.,!?()[\]]*$/,
  BOARD_NAME: /^[a-zA-Z0-9\s\-_.,!?()[\]]*$/,
  TAG: /^[a-zA-Z0-9\s\-_]*$/,
  SEARCH: /^[a-zA-Z0-9\s\-_.,!?()[\]]*$/,
} as const;

/**
 * Removes dangerous protocols and event handlers from input
 */
function removeDangerousContent(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/file:/gi, '');
}

/**
 * Validates input against pattern and removes invalid characters if needed
 */
function validateAndCleanPattern(input: string, type: keyof typeof INPUT_LIMITS): string {
  const pattern = getPatternForType(type);
  if (pattern && !pattern.test(input)) {
    return input.replace(/[^a-zA-Z0-9\s\-_.,!?()[\]]/g, '');
  }
  return input;
}

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

  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim();
  }

  if (!options.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  sanitized = removeDangerousContent(sanitized);
  sanitized = validateAndCleanPattern(sanitized, type);

  const maxLength = INPUT_LIMITS[type];
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

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

  constructor(
    maxRequests: number = RATE_LIMIT_CONFIG.DEFAULT_MAX_REQUESTS,
    windowMs: number = RATE_LIMIT_CONFIG.DEFAULT_WINDOW_MS
  ) {
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

export const searchRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.DEFAULT_MAX_REQUESTS,
  RATE_LIMIT_CONFIG.DEFAULT_WINDOW_MS
);

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
