import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '@/lib/types';
import {
  createFileInput,
  formatFileSize,
  previewImportData,
  validateFile,
} from '../fileHandling';
import {
  copyToClipboard,
  generateTaskMailtoLink,
  generateTaskShareText,
} from '../shareTask';
import {
  detectIOSDevice,
  detectTouchCapabilities,
  getDeviceInfo,
  getIOSTouchClasses,
  getIOSTouchSensorConfig,
} from '../iosDetection';

const loggerMocks = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock('../logger', () => ({
  logger: loggerMocks,
}));

const task: Task = {
  id: 'task-1',
  title: 'Publish release notes',
  description: 'Summarize the release clearly',
  status: 'in-progress',
  boardId: 'board-1',
  priority: 'high',
  tags: ['release', 'docs'],
  createdAt: new Date('2026-01-15T12:00:00.000Z'),
  updatedAt: new Date('2026-01-15T12:00:00.000Z'),
  completedAt: new Date('2026-01-16T12:00:00.000Z'),
};

function setNavigatorProperty<K extends keyof Navigator>(key: K, value: Navigator[K]) {
  Object.defineProperty(window.navigator, key, {
    value,
    configurable: true,
  });
}

function setScreenSize(width: number, height: number) {
  Object.defineProperty(window, 'screen', {
    value: { width, height },
    configurable: true,
  });
}

function setMediaMatches(matchesByQuery: Record<string, boolean>) {
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query: string) => ({
      matches: matchesByQuery[query] ?? false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    configurable: true,
  });
}

describe('file handling helpers', () => {
  it('rejects empty, oversized, and non-json files with clear validation errors', () => {
    const empty = new File([], 'empty.json', { type: 'application/json' });
    const invalidType = new File(['{}'], 'backup.txt', { type: 'text/plain' });
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'huge.json', {
      type: 'application/json',
    });

    expect(validateFile(empty)).toEqual(
      expect.objectContaining({
        isValid: false,
        errors: expect.arrayContaining(['File is empty']),
      })
    );
    expect(validateFile(invalidType).errors[0]).toMatch(/invalid file type/i);
    expect(validateFile(oversized)).toEqual(
      expect.objectContaining({
        isValid: false,
        errors: expect.arrayContaining([expect.stringMatching(/exceeds maximum allowed size/i)]),
        warnings: expect.arrayContaining(['Large file detected. Import may take some time to process']),
      })
    );
  });

  it('formats file sizes and builds a hidden json file input', () => {
    const selected = vi.fn();
    const onError = vi.fn();
    const input = createFileInput(selected, onError);
    const validFile = new File(['{}'], 'backup.json', { type: 'application/json' });

    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(input.type).toBe('file');
    expect(input.accept).toBe('.json');
    expect(input.style.display).toBe('none');

    Object.defineProperty(input, 'files', {
      value: [validFile],
      configurable: true,
    });
    input.dispatchEvent(new Event('change'));

    expect(selected).toHaveBeenCalledWith(validFile);
    expect(onError).not.toHaveBeenCalled();
    expect(input.value).toBe('');
  });

  it('previews valid export files with counts and metadata', async () => {
    const exportFile = new File([
      JSON.stringify({
        version: '1.0.0',
        exportedAt: '2026-01-15T12:00:00.000Z',
        tasks: [],
        boards: [],
      }),
    ], 'backup.json', { type: 'application/json' });

    const result = await previewImportData(exportFile);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        preview: expect.objectContaining({
          taskCount: 0,
          boardCount: 0,
          hasSettings: false,
          exportedAt: '2026-01-15T12:00:00.000Z',
          version: '1.0.0',
        }),
      })
    );
  });
});

describe('task sharing helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });
  });

  it('generates markdown, plain text, and mailto share content', () => {
    const markdown = generateTaskShareText(task);
    const plain = generateTaskShareText(task, { format: 'plain', includeAppLink: false });
    const mailto = generateTaskMailtoLink(task, 'person@example.com');

    expect(markdown).toContain('# Task: Publish release notes');
    expect(markdown).toContain('- **Status:** In Progress');
    expect(markdown).toContain('- **Priority:** High');
    expect(markdown).toContain('*Sent from http://localhost*');
    expect(plain).toContain('Task: Publish release notes');
    expect(plain).not.toContain('Sent from');
    expect(mailto).toContain('mailto:person%40example.com');
    expect(mailto).toContain('subject=Task%3A%20Publish%20release%20notes');
  });

  it('copies only in a secure clipboard-capable context', async () => {
    await expect(copyToClipboard('hello')).resolves.toBe(true);
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith('hello');

    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    });

    await expect(copyToClipboard('blocked')).resolves.toBe(false);
    expect(loggerMocks.error).toHaveBeenCalledWith(
      'Clipboard API unavailable. Cascade requires a secure (https://) context.'
    );
  });
});

describe('iOS and touch detection helpers', () => {
  beforeEach(() => {
    setMediaMatches({
      '(pointer: coarse)': false,
      '(hover: hover)': true,
    });
    setScreenSize(1440, 900);
    setNavigatorProperty('userAgent', 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36');
    setNavigatorProperty('vendor', 'Google Inc.');
    setNavigatorProperty('platform', 'MacIntel');
    setNavigatorProperty('maxTouchPoints', 0);
  });

  it('detects supported iPhone Safari and returns iOS-optimized classes/config', () => {
    setNavigatorProperty(
      'userAgent',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
    );
    setNavigatorProperty('vendor', 'Apple Computer, Inc.');
    setNavigatorProperty('platform', 'iPhone');
    setNavigatorProperty('maxTouchPoints', 5);

    expect(detectIOSDevice()).toEqual(
      expect.objectContaining({
        isIOS: true,
        isIPhone: true,
        isSafari: true,
        iosVersion: 18,
        safariVersion: 18,
        isIOSSupported: true,
      })
    );
    expect(getIOSTouchClasses()).toEqual([
      'ios-device',
      'iphone-device',
      'safari-browser',
      'ios-supported',
    ]);
    expect(getIOSTouchSensorConfig()).toEqual({
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    });
  });

  it('classifies touch phone, tablet, and desktop capabilities', () => {
    setNavigatorProperty('maxTouchPoints', 5);
    setScreenSize(390, 844);
    setMediaMatches({
      '(pointer: coarse)': true,
      '(hover: hover)': false,
    });

    expect(detectTouchCapabilities()).toEqual(
      expect.objectContaining({
        hasTouch: true,
        isPrimaryTouch: true,
        isLikelyMobile: true,
        isLikelyTablet: false,
      })
    );
    expect(getDeviceInfo()).toEqual(
      expect.objectContaining({
        deviceClass: 'mobile',
        needsTouchOptimizations: true,
      })
    );

    setScreenSize(820, 1180);

    expect(detectTouchCapabilities()).toEqual(
      expect.objectContaining({
        isLikelyMobile: false,
        isLikelyTablet: true,
      })
    );
    expect(getDeviceInfo()).toEqual(
      expect.objectContaining({
        deviceClass: 'tablet',
      })
    );
  });
});
