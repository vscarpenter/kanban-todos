import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsDialog } from '../SettingsDialog';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { Settings } from '@/lib/types';

// Uses the REAL settingsStore (only the database layer is mocked) — this bug
// is specifically about SettingsDialog reacting to genuine store changes
// while open, which a fully-mocked store can't reproduce.
vi.mock('@/lib/utils/database', () => ({
  taskDB: {
    init: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

const defaultSettings: Settings = {
  theme: 'system',
  autoArchiveDays: 30,
  enableNotifications: false,
  enableKeyboardShortcuts: true,
  searchPreferences: { defaultScope: 'current-board', rememberScope: true },
  accessibility: { highContrast: false, reduceMotion: false, fontSize: 'medium' },
};

describe('SettingsDialog vs. concurrent external settings updates', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: defaultSettings, isLoading: false, error: null });
  });

  it('does not silently discard an in-progress toggle when something else updates the store first', async () => {
    render(<SettingsDialog open onOpenChange={vi.fn()} />);

    const notificationsSwitch = screen.getByRole('switch', { name: 'Enable notifications' });
    expect(notificationsSwitch).not.toBeChecked();

    // User toggles the switch (an unsaved local edit)...
    fireEvent.click(notificationsSwitch);
    await waitFor(() => expect(notificationsSwitch).toBeChecked());

    // ...then, before they click Save, something else writes to the settings
    // store — e.g. boardStore.setCurrentBoard persisting a board selection
    // through settingsStore.updateSettings (see ARCH-1), or any other
    // concurrent settings write. This must not silently wipe the user's
    // pending, not-yet-saved edit.
    await act(async () => {
      await useSettingsStore.getState().updateSettings({ currentBoardId: 'board-2' });
    });

    expect(notificationsSwitch).toBeChecked();
  });
});
