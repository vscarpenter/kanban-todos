import { describe, it, expect } from 'vitest';
import { previewImportData } from '../fileHandling';

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
