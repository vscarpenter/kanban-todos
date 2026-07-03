import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoreErrorToasts } from '../useStoreErrorToasts';

const mocks = vi.hoisted(() => ({
  useBoardStore: vi.fn(),
  useSettingsStore: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('@/lib/stores/boardStore', () => ({ useBoardStore: mocks.useBoardStore }));
vi.mock('@/lib/stores/settingsStore', () => ({ useSettingsStore: mocks.useSettingsStore }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));

describe('useStoreErrorToasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useBoardStore.mockImplementation((selector: (s: { error: string | null }) => unknown) =>
      selector({ error: null })
    );
    mocks.useSettingsStore.mockImplementation((selector: (s: { error: string | null }) => unknown) =>
      selector({ error: null })
    );
  });

  it('does nothing when neither store has an error', () => {
    renderHook(() => useStoreErrorToasts());

    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('toasts when boardStore.error is set — it was never read by any component before', () => {
    mocks.useBoardStore.mockImplementation((selector: (s: { error: string | null }) => unknown) =>
      selector({ error: 'Failed to persist current board selection' })
    );

    renderHook(() => useStoreErrorToasts());

    expect(mocks.toastError).toHaveBeenCalledWith('Failed to persist current board selection');
  });

  it('toasts when settingsStore.error is set — it was never read by any component before', () => {
    mocks.useSettingsStore.mockImplementation((selector: (s: { error: string | null }) => unknown) =>
      selector({ error: 'Failed to update settings' })
    );

    renderHook(() => useStoreErrorToasts());

    expect(mocks.toastError).toHaveBeenCalledWith('Failed to update settings');
  });

  it('re-toasts only when the error message actually changes, not on every re-render', () => {
    let boardError: string | null = 'first failure';
    mocks.useBoardStore.mockImplementation((selector: (s: { error: string | null }) => unknown) =>
      selector({ error: boardError })
    );

    const { rerender } = renderHook(() => useStoreErrorToasts());
    expect(mocks.toastError).toHaveBeenCalledTimes(1);

    rerender();
    expect(mocks.toastError).toHaveBeenCalledTimes(1);

    boardError = 'second failure';
    rerender();
    expect(mocks.toastError).toHaveBeenCalledTimes(2);
    expect(mocks.toastError).toHaveBeenLastCalledWith('second failure');
  });
});
