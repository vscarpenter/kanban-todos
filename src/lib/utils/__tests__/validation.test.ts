import { describe, it, expect } from 'vitest';
import { 
  validateExportData, 
  validateDataRelationships,
  sanitizeData,
  exportDataSchema
} from '../validation';
import type { ExportData } from '../exportImport';

describe('validation with attachments', () => {
  const testExportData: ExportData = {
    version: '1.0.0',
    exportedAt: '2025-01-01T12:00:00.000Z',
    tasks: [
      {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        status: 'todo',
        boardId: 'board-1',
        createdAt: '2025-01-01T12:00:00.000Z',
        updatedAt: '2025-01-01T12:00:00.000Z',
        priority: 'medium',
        tags: [],
        attachments: [
          {
            id: 'att-1',
            fileName: 'test.jpg',
            originalName: 'test-image.jpg',
            fileType: 'image/jpeg',
            fileSize: 1024,
            uploadedAt: '2025-01-01T12:00:00.000Z',
            taskId: 'task-1'
          }
        ],
        attachmentCount: 1
      }
    ],
    boards: [
      {
        id: 'board-1',
        name: 'Test Board',
        color: '#007bff',
        isDefault: true,
        order: 0,
        createdAt: '2025-01-01T12:00:00.000Z',
        updatedAt: '2025-01-01T12:00:00.000Z'
      },
      {
        id: 'board-2',
        name: 'Second Board',
        color: '#28a745',
        isDefault: true, // This will trigger the multiple defaults issue
        order: 1,
        createdAt: '2025-01-01T12:00:00.000Z',
        updatedAt: '2025-01-01T12:00:00.000Z'
      }
    ],
    settings: {
      theme: 'light',
      autoArchiveDays: 30,
      enableNotifications: true,
      enableKeyboardShortcuts: true,
      enableDebugMode: false,
      currentBoardId: 'board-1',
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        fontSize: 'medium'
      }
    }
  };

  it('should validate export data with attachments without unexpected property errors', () => {
    const result = validateExportData(testExportData);
    
    // Should not have attachment-related validation errors
    const attachmentErrors = result.errors.filter(e => 
      e.message.includes('attachments') || e.message.includes('attachmentCount')
    );
    
    expect(attachmentErrors).toHaveLength(0);
  });

  it('should detect multiple default boards issue', () => {
    const result = validateDataRelationships(testExportData);
    
    const multipleDefaultsWarning = result.warnings.find(w => 
      w.message.includes('Multiple boards marked as default')
    );
    
    expect(multipleDefaultsWarning).toBeDefined();
  });

  it('should sanitize multiple default boards', () => {
    const sanitizeOptions = {
      removeInvalidFields: true,
      fixDateFormats: true,
      normalizeStrings: true,
      validateRelationships: true,
      generateMissingIds: false,
      setDefaultValues: false,
    };

    const result = sanitizeData(testExportData, exportDataSchema, sanitizeOptions);
    
    // Should have changes indicating default board fix
    const defaultBoardChanges = result.changes.filter(c => 
      c.includes('Removed default flag from board')
    );
    
    expect(defaultBoardChanges.length).toBeGreaterThan(0);
    
    // The sanitized data should have only one default board
    const sanitized = result.sanitized as ExportData;
    const defaultBoards = sanitized.boards.filter(board => board.isDefault);
    
    expect(defaultBoards).toHaveLength(1);
  });

  it('should accept currentBoardId in settings without warning', () => {
    const result = validateExportData(testExportData);
    
    // Should not have currentBoardId-related validation errors
    const currentBoardIdErrors = result.errors.filter(e => 
      e.message.includes('currentBoardId')
    );
    
    expect(currentBoardIdErrors).toHaveLength(0);
  });
});