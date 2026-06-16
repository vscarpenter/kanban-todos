import { describe, it, expect } from 'vitest';
import { previewImportData, prepareImport } from '../fileHandling';
import type { Board } from '@/lib/types';

function makeExportFile(): File {
  const exportData = {
    version: '1.0.0',
    exportedAt: '2026-01-15T12:00:00.000Z',
    tasks: [],
    boards: [],
  };
  return new File([JSON.stringify(exportData)], 'export.json', {
    type: 'application/json',
  });
}

function makeExportFileWithBoard(boardId: string): File {
  const exportData = {
    version: '1.0.0',
    exportedAt: '2026-01-15T12:00:00.000Z',
    tasks: [],
    boards: [
      {
        id: boardId,
        name: 'Imported Board',
        color: '#3b82f6',
        isDefault: false,
        order: 1,
        createdAt: '2026-01-15T12:00:00.000Z',
        updatedAt: '2026-01-15T12:00:00.000Z',
      },
    ],
  };
  return new File([JSON.stringify(exportData)], 'export.json', {
    type: 'application/json',
  });
}

const existingBoard: Board = {
  id: 'board-1',
  name: 'Existing Board',
  color: '#10b981',
  isDefault: true,
  order: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('previewImportData', () => {
  it('returns the parsed data alongside the preview, so callers need only one read', async () => {
    const result = await previewImportData(makeExportFile());

    expect(result.success).toBe(true);
    expect(result.preview?.taskCount).toBe(0);
    expect(result.preview?.boardCount).toBe(0);
    // The data was already parsed to build the preview — it must be returned
    // so the caller doesn't have to read and parse the file a second time.
    expect(result.data?.version).toBe('1.0.0');
    expect(result.data?.tasks).toEqual([]);
    expect(result.data?.boards).toEqual([]);
  });
});

describe('prepareImport', () => {
  it('returns preview, parsed data, and conflict detection in a single result', async () => {
    const result = await prepareImport(makeExportFile(), [], []);

    expect(result.success).toBe(true);
    expect(result.preview?.taskCount).toBe(0);
    expect(result.data?.version).toBe('1.0.0');
    // Conflict detection is folded into the single entry point so the dialog
    // doesn't have to run detectImportConflicts itself as a separate step.
    expect(result.conflicts).toBeDefined();
    expect(result.hasConflicts).toBe(false);
  });

  it('flags hasConflicts when an imported board id collides with an existing one', async () => {
    const result = await prepareImport(makeExportFileWithBoard('board-1'), [], [existingBoard]);

    expect(result.success).toBe(true);
    expect(result.conflicts?.duplicateBoardIds).toContain('board-1');
    expect(result.hasConflicts).toBe(true);
  });

  it('reports failure (no conflicts run) when the file is invalid', async () => {
    const badFile = new File(['not json'], 'bad.json', { type: 'application/json' });

    const result = await prepareImport(badFile, [], []);

    expect(result.success).toBe(false);
    expect(result.hasConflicts).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
