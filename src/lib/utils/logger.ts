/**
 * Structured logger utility.
 * Outputs JSON-formatted log entries in production; plain console in development.
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.error('Failed to load board', { boardId, error });
 *   logger.warn('Slow search', { durationMs: 450 });
 *   logger.info('Store initialized', { taskCount: 42 });
 *   logger.debug('Cache hit', { key }); // no-op in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown> | unknown;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const isDevelopment =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

function toContext(context: LogContext): Record<string, unknown> | undefined {
  if (context === undefined || context === null) return undefined;
  if (typeof context === 'object' && !Array.isArray(context)) {
    return context as Record<string, unknown>;
  }
  // Wrap non-object values (e.g. Error, string) in a plain object
  if (context instanceof Error) {
    return { message: context.message, stack: context.stack, name: context.name };
  }
  return { value: context };
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (typeof window === 'undefined') return; // SSR guard — app is client-only

  const ctx = toContext(context);
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
  };

  if (isDevelopment) {
    const fn = level === 'error' ? console.error
             : level === 'warn'  ? console.warn
             : level === 'debug' ? console.debug
             : console.info;
    fn(`[${level.toUpperCase()}] ${message}`, ctx ?? '');
  } else {
    // Production: structured JSON line for log aggregators
    const fn = level === 'error' ? console.error
             : level === 'warn'  ? console.warn
             : console.info;
    fn(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) write('debug', message, context);
    // debug logs are suppressed in production
  },
  info:  (message: string, context?: LogContext) => write('info',  message, context),
  warn:  (message: string, context?: LogContext) => write('warn',  message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
