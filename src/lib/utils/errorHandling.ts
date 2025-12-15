/**
 * Comprehensive error handling and recovery utilities
 */

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

export interface ErrorRecoveryOptions {
  retryCount: number;
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: () => void;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly isRecoverable: boolean;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    isRecoverable: boolean = true,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.isRecoverable = isRecoverable;
    this.severity = severity;
  }
}

/**
 * Error codes for different types of failures
 */
export const ERROR_CODES = {
  // Database errors
  DATABASE_INIT_FAILED: 'DATABASE_INIT_FAILED',
  DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
  DATABASE_WRITE_FAILED: 'DATABASE_WRITE_FAILED',
  DATABASE_READ_FAILED: 'DATABASE_READ_FAILED',
  DATABASE_CORRUPTED: 'DATABASE_CORRUPTED',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_FORMAT: 'INVALID_DATA_FORMAT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTED: 'STORAGE_CORRUPTED',
  
  // Search errors
  SEARCH_RATE_LIMITED: 'SEARCH_RATE_LIMITED',
  SEARCH_QUERY_INVALID: 'SEARCH_QUERY_INVALID',
  
  // Import/Export errors
  IMPORT_FILE_INVALID: 'IMPORT_FILE_INVALID',
  EXPORT_FAILED: 'EXPORT_FAILED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  OPERATION_FAILED: 'OPERATION_FAILED',
} as const;

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  private static retryStrategies = new Map<string, ErrorRecoveryOptions>();

  static registerStrategy(
    errorCode: string,
    options: ErrorRecoveryOptions
  ): void {
    this.retryStrategies.set(errorCode, options);
  }

  static getStrategy(errorCode: string): ErrorRecoveryOptions | null {
    return this.retryStrategies.get(errorCode) || null;
  }

  private static async attemptOperation<T>(
    operation: () => Promise<T>,
    strategy: ErrorRecoveryOptions
  ): Promise<{ success: boolean; result?: T; error?: Error }> {
    for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
      try {
        const result = await operation();
        return { success: true, result };
      } catch (error) {
        if (attempt === strategy.maxRetries) {
          return { success: false, error: error as Error };
        }
        await new Promise(resolve =>
          setTimeout(resolve, strategy.retryDelay * (attempt + 1))
        );
      }
    }
    return { success: false };
  }

  private static executeFallback(strategy: ErrorRecoveryOptions): void {
    if (strategy.fallbackAction) {
      try {
        strategy.fallbackAction();
      } catch (fallbackError) {
        console.error('Fallback action failed:', fallbackError);
      }
    }
  }

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorCode: string,
    context: ErrorContext
  ): Promise<T> {
    const strategy = this.getStrategy(errorCode);

    if (!strategy) {
      throw new AppError(
        `No recovery strategy for error: ${errorCode}`,
        'UNKNOWN_ERROR',
        context,
        false,
        'high'
      );
    }

    const { success, result, error } = await this.attemptOperation(operation, strategy);

    if (success && result !== undefined) {
      return result;
    }

    this.executeFallback(strategy);

    throw new AppError(
      `Operation failed after ${strategy.maxRetries} retries: ${error?.message}`,
      errorCode,
      context,
      false,
      'high'
    );
  }
}

/**
 * Initialize default error recovery strategies
 */
export function initializeErrorRecovery(): void {
  // Database operations
  ErrorRecovery.registerStrategy(ERROR_CODES.DATABASE_QUERY_FAILED, {
    retryCount: 0,
    maxRetries: 3,
    retryDelay: 1000,
    fallbackAction: () => {
      console.warn('Database query failed, attempting to reinitialize...');
      // This would be implemented in the actual store
    },
  });

  ErrorRecovery.registerStrategy(ERROR_CODES.DATABASE_WRITE_FAILED, {
    retryCount: 0,
    maxRetries: 2,
    retryDelay: 500,
    fallbackAction: () => {
      console.warn('Database write failed, data may not be saved');
    },
  });

  // Search operations
  ErrorRecovery.registerStrategy(ERROR_CODES.SEARCH_RATE_LIMITED, {
    retryCount: 0,
    maxRetries: 1,
    retryDelay: 2000,
    fallbackAction: () => {
      console.warn('Search rate limited, please wait before searching again');
    },
  });

  // Import operations
  ErrorRecovery.registerStrategy(ERROR_CODES.IMPORT_FILE_INVALID, {
    retryCount: 0,
    maxRetries: 0,
    retryDelay: 0,
    fallbackAction: () => {
      console.warn('Import file is invalid, please check the file format');
    },
  });
}

/**
 * Global error handler for unhandled errors
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  static getInstance(): GlobalErrorHandler {
    if (!this.instance) {
      this.instance = new GlobalErrorHandler();
    }
    return this.instance;
  }

  handleError(error: Error, context: Partial<ErrorContext> = {}): void {
    const appError = this.createAppError(error, context);
    this.logError(appError);
    this.notifyUser(appError);
  }

  private createAppError(error: Error, context: Partial<ErrorContext>): AppError {
    const fullContext: ErrorContext = {
      operation: context.operation || 'unknown',
      component: context.component,
      userId: context.userId,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context,
    };

    // Determine error code and severity based on error type
    let code: keyof typeof ERROR_CODES = 'UNKNOWN_ERROR';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const isRecoverable = true;

    if (error.message.includes('IndexedDB')) {
      code = 'DATABASE_QUERY_FAILED';
      severity = 'high';
    } else if (error.message.includes('quota')) {
      code = 'STORAGE_QUOTA_EXCEEDED';
      severity = 'high';
    } else if (error.message.includes('rate limit')) {
      code = 'SEARCH_RATE_LIMITED';
      severity = 'low';
    } else if (error.message.includes('validation')) {
      code = 'INVALID_INPUT';
      severity = 'medium';
    }

    return new AppError(error.message, ERROR_CODES[code], fullContext, isRecoverable, severity);
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Keep only the most recent errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', {
        message: error.message,
        code: error.code,
        context: error.context,
        severity: error.severity,
        isRecoverable: error.isRecoverable,
      });
    }
  }

  private notifyUser(error: AppError): void {
    // Only show user notifications for high severity errors
    if (error.severity === 'high' || error.severity === 'critical') {
      // This would integrate with your notification system
      console.warn('User notification:', this.getUserFriendlyMessage(error));
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case ERROR_CODES.DATABASE_QUERY_FAILED:
        return 'There was a problem accessing your data. Please refresh the page.';
      case ERROR_CODES.STORAGE_QUOTA_EXCEEDED:
        return 'Storage is full. Please delete some old data or export your tasks.';
      case ERROR_CODES.SEARCH_RATE_LIMITED:
        return 'Search is temporarily limited. Please wait a moment before searching again.';
      case ERROR_CODES.INVALID_INPUT:
        return 'Please check your input and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * Error boundary component for React
 */
export class ErrorBoundary extends Error {
  public readonly componentStack: string;
  public readonly errorInfo: unknown;

  constructor(message: string, componentStack: string, errorInfo: unknown) {
    super(message);
    this.name = 'ErrorBoundary';
    this.componentStack = componentStack;
    this.errorInfo = errorInfo;
  }
}

/**
 * Utility function to create error context
 */
export function createErrorContext(
  operation: string,
  component?: string,
  additionalContext?: Partial<ErrorContext>
): ErrorContext {
  return {
    operation,
    component,
    timestamp: Date.now(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    ...additionalContext,
  };
}

/**
 * Utility function to safely execute operations with error handling
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const handler = GlobalErrorHandler.getInstance();
    handler.handleError(error as Error, context);
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}

/**
 * Database recovery utilities
 */
export class DatabaseRecovery {
  static async attemptRecovery(): Promise<boolean> {
    try {
      // Try to reinitialize the database
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        // Check if IndexedDB is available
        const request = indexedDB.open('cascade-tasks', 1);
        return new Promise((resolve) => {
          request.onsuccess = () => {
            resolve(true);
          };
          request.onerror = () => {
            resolve(false);
          };
        });
      }
      return false;
    } catch (error) {
      console.error('Database recovery failed:', error);
      return false;
    }
  }

  static async clearCorruptedData(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        // Clear all IndexedDB data
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name?.includes('cascade')) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear corrupted data:', error);
    }
  }
}

// Initialize error recovery strategies on module load
initializeErrorRecovery();
