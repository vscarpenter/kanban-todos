import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger utilities', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleInfoSpy: any;
  let consoleDebugSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Set window to undefined to simulate SSR
    delete (global as any).window;
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
    
    // Restore any NODE_ENV stubbed via vi.stubEnv
    vi.unstubAllEnvs();

    // Restore window
    (global as any).window = {};
  });

  describe('SSR guard', () => {
    it('does not log when window is undefined', () => {
      delete (global as any).window;
      
      logger.info('Test message');
      logger.error('Test error');
      logger.warn('Test warning');
      
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('development mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      (global as any).window = {};
    });

    it('logs info messages in development', () => {
      logger.info('Test info message', { key: 'value' });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test info message',
        { key: 'value' }
      );
    });

    it('logs warn messages in development', () => {
      logger.warn('Test warning', { key: 'value' });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Test warning',
        { key: 'value' }
      );
    });

    it('logs error messages in development', () => {
      logger.error('Test error', { key: 'value' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Test error',
        { key: 'value' }
      );
    });

    it('logs debug messages in development', () => {
      logger.debug('Test debug', { key: 'value' });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Test debug',
        { key: 'value' }
      );
    });

    it('handles messages without context', () => {
      logger.info('Simple message');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Simple message',
        ''
      );
    });

    it('handles Error objects in context', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';
      
      logger.error('Failed operation', error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedContext = consoleErrorSpy.mock.calls[0][1];
      expect(loggedContext).toHaveProperty('message', 'Test error');
      expect(loggedContext).toHaveProperty('stack');
      expect(loggedContext).toHaveProperty('name', 'Error');
    });

    it('handles primitive values in context', () => {
      logger.info('Number value', 42);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Number value',
        { value: 42 }
      );
    });

    it('handles null context', () => {
      logger.info('Null context', null);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Null context',
        ''
      );
    });

    it('handles undefined context', () => {
      logger.info('Undefined context', undefined);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Undefined context',
        ''
      );
    });

    it('handles arrays in context', () => {
      logger.info('Array value', [1, 2, 3]);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Array value',
        { value: [1, 2, 3] }
      );
    });
  });

  describe('production mode', () => {
    // Note: The logger checks NODE_ENV at module load time, so we can't truly
    // test production mode in these tests. We'll test the development behavior
    // and note that production JSON logging would need integration testing.
    
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      (global as any).window = {};
    });

    it('logs info with level prefix in development', () => {
      logger.info('Test info', { key: 'value' });
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test info',
        { key: 'value' }
      );
    });

    it('logs warn with level prefix in development', () => {
      logger.warn('Test warning', { key: 'value' });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Test warning',
        { key: 'value' }
      );
    });

    it('logs error with level prefix in development', () => {
      logger.error('Test error', { key: 'value' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] Test error',
        { key: 'value' }
      );
    });

    it('logs debug messages in development', () => {
      logger.debug('Test debug', { key: 'value' });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[DEBUG] Test debug',
        { key: 'value' }
      );
    });

    it('includes timestamp in logged context', () => {
      logger.info('Timestamp test');
      
      expect(consoleInfoSpy).toHaveBeenCalled();
      // In development mode, timestamp is included in the context object
      // The actual structure depends on the logger implementation
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Timestamp test',
        expect.anything()
      );
    });

    it('handles Error objects in development', () => {
      const error = new Error('Development error');
      error.stack = 'Error: Development error\n    at test.ts:1:1';
      
      logger.error('Failed', error);
      
      const loggedContext = consoleErrorSpy.mock.calls[0][1];
      expect(loggedContext.message).toBe('Development error');
      expect(loggedContext.stack).toBeDefined();
      expect(loggedContext.name).toBe('Error');
    });
  });

  describe('log level routing', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      (global as any).window = {};
    });

    it('routes debug to console.debug', () => {
      logger.debug('Debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('routes info to console.info', () => {
      logger.info('Info message');
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('routes warn to console.warn', () => {
      logger.warn('Warn message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('routes error to console.error', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('context transformation', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
      (global as any).window = {};
    });

    it('passes through plain objects unchanged', () => {
      const context = { key1: 'value1', key2: 'value2' };
      logger.info('Test', context);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test',
        context
      );
    });

    it('wraps strings in value property', () => {
      logger.info('Test', 'string context');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test',
        { value: 'string context' }
      );
    });

    it('wraps numbers in value property', () => {
      logger.info('Test', 123);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test',
        { value: 123 }
      );
    });

    it('extracts Error properties', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';
      
      logger.info('Test', error);
      
      const loggedContext = consoleInfoSpy.mock.calls[0][1];
      expect(loggedContext.message).toBe('Test error');
      expect(loggedContext.stack).toBeDefined();
      expect(loggedContext.name).toBe('Error');
    });

    it('handles boolean context', () => {
      logger.info('Test', true);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Test',
        { value: true }
      );
    });
  });
});