import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetApplication } from '@/lib/utils/resetApp';

vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    resetDatabase: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('resetApplication', () => {
  let originalLocation: Location;
  let hrefSetter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalLocation = window.location;
    hrefSetter = vi.fn();
    // Replace window.location with a writable mock
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        pathname: '/',
        reload: vi.fn(),
        hostname: 'localhost',
      },
      writable: true,
      configurable: true,
    });
    // Spy on href setter
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter as unknown as (v: string) => void,
      get: () => 'http://localhost:3000/',
      configurable: true,
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('calls taskDB.resetDatabase', async () => {
    const { taskDB } = await import('@/lib/utils/database');
    await resetApplication();
    expect(taskDB.resetDatabase).toHaveBeenCalled();
  });

  it('clears localStorage', async () => {
    window.localStorage.setItem('test-key', 'test-value');
    await resetApplication();
    expect(window.localStorage.getItem('test-key')).toBeNull();
  });

  it('clears sessionStorage', async () => {
    window.sessionStorage.setItem('session-key', 'session-value');
    await resetApplication();
    expect(window.sessionStorage.getItem('session-key')).toBeNull();
  });

  it('navigates to origin after a short delay', async () => {
    await resetApplication();
    vi.runAllTimers();
    expect(hrefSetter).toHaveBeenCalledWith('http://localhost:3000/');
  });

  it('still navigates even when database reset fails', async () => {
    const { taskDB } = await import('@/lib/utils/database');
    vi.mocked(taskDB.resetDatabase).mockRejectedValueOnce(new Error('DB error'));
    await resetApplication();
    vi.runAllTimers();
    expect(hrefSetter).toHaveBeenCalledWith('http://localhost:3000/');
  });
});
