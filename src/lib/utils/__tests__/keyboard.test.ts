import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyboardManager, keyboardManager } from '@/lib/utils/keyboard';

function makeKeyEvent(key: string, modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrl ?? false,
    altKey: modifiers.alt ?? false,
    shiftKey: modifiers.shift ?? false,
    metaKey: modifiers.meta ?? false,
    bubbles: true,
    cancelable: true,
  });
}

describe('KeyboardManager', () => {
  let manager: KeyboardManager;

  beforeEach(() => {
    // Create a fresh instance for each test to avoid state bleed
    manager = new (KeyboardManager as unknown as { new(): KeyboardManager })();
  });

  describe('registerShortcut', () => {
    it('registers a shortcut', () => {
      const action = vi.fn();
      manager.registerShortcut({ key: 'n', action, description: 'New', category: 'tasks' });
      expect(manager.getShortcuts()).toHaveLength(1);
    });

    it('replaces existing shortcut with same key combination', () => {
      const first = vi.fn();
      const second = vi.fn();
      manager.registerShortcut({ key: 'n', action: first, description: 'First', category: 'tasks' });
      manager.registerShortcut({ key: 'n', action: second, description: 'Second', category: 'tasks' });
      expect(manager.getShortcuts()).toHaveLength(1);
      expect(manager.getShortcuts()[0].description).toBe('Second');
    });

    it('allows different modifiers for the same key', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      manager.registerShortcut({ key: 'n', action: action1, description: 'Plain N', category: 'tasks' });
      manager.registerShortcut({ key: 'n', ctrl: true, action: action2, description: 'Ctrl+N', category: 'tasks' });
      expect(manager.getShortcuts()).toHaveLength(2);
    });
  });

  describe('unregisterShortcut', () => {
    it('removes a registered shortcut', () => {
      manager.registerShortcut({ key: 'n', action: vi.fn(), description: 'New', category: 'tasks' });
      manager.unregisterShortcut('n');
      expect(manager.getShortcuts()).toHaveLength(0);
    });

    it('does nothing when shortcut does not exist', () => {
      expect(() => manager.unregisterShortcut('z')).not.toThrow();
      expect(manager.getShortcuts()).toHaveLength(0);
    });

    it('removes only the matching modifier combination', () => {
      manager.registerShortcut({ key: 'n', action: vi.fn(), description: 'Plain N', category: 'tasks' });
      manager.registerShortcut({ key: 'n', ctrl: true, action: vi.fn(), description: 'Ctrl+N', category: 'tasks' });
      manager.unregisterShortcut('n', { ctrl: true });
      const remaining = manager.getShortcuts();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].ctrl).toBeFalsy();
    });
  });

  describe('getShortcutsByCategory', () => {
    it('returns shortcuts for the given category', () => {
      manager.registerShortcut({ key: 'n', action: vi.fn(), description: 'New Task', category: 'tasks' });
      manager.registerShortcut({ key: 'b', action: vi.fn(), description: 'New Board', category: 'boards' });
      expect(manager.getShortcutsByCategory('tasks')).toHaveLength(1);
      expect(manager.getShortcutsByCategory('boards')).toHaveLength(1);
      expect(manager.getShortcutsByCategory('settings')).toHaveLength(0);
    });
  });

  describe('formatShortcut', () => {
    it('formats a plain key shortcut', () => {
      const shortcut = { key: 'n', action: vi.fn(), description: 'New', category: 'tasks' };
      expect(manager.formatShortcut(shortcut)).toBe('N');
    });

    it('formats a Ctrl+key shortcut', () => {
      const shortcut = { key: 'k', ctrl: true, action: vi.fn(), description: 'Search', category: 'nav' };
      expect(manager.formatShortcut(shortcut)).toBe('Ctrl + K');
    });

    it('formats a multi-modifier shortcut', () => {
      const shortcut = { key: 's', ctrl: true, shift: true, action: vi.fn(), description: 'Save all', category: 'file' };
      expect(manager.formatShortcut(shortcut)).toBe('Ctrl + Shift + S');
    });
  });

  describe('startListening / stopListening', () => {
    it('triggers registered shortcut on keydown event', () => {
      const action = vi.fn();
      manager.registerShortcut({ key: 'n', action, description: 'New', category: 'tasks' });
      manager.startListening();

      document.dispatchEvent(makeKeyEvent('n'));
      expect(action).toHaveBeenCalledTimes(1);

      manager.stopListening();
    });

    it('does not trigger when input element is focused', () => {
      const action = vi.fn();
      manager.registerShortcut({ key: 'n', action, description: 'New', category: 'tasks' });
      manager.startListening();

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      document.dispatchEvent(makeKeyEvent('n'));
      expect(action).not.toHaveBeenCalled();

      input.remove();
      manager.stopListening();
    });

    it('does not trigger shortcuts when not listening', () => {
      const action = vi.fn();
      manager.registerShortcut({ key: 'n', action, description: 'New', category: 'tasks' });
      // Don't call startListening

      document.dispatchEvent(makeKeyEvent('n'));
      expect(action).not.toHaveBeenCalled();
    });

    it('does not double-register on multiple startListening calls', () => {
      const action = vi.fn();
      manager.registerShortcut({ key: 'n', action, description: 'New', category: 'tasks' });
      manager.startListening();
      manager.startListening(); // second call should be a no-op

      document.dispatchEvent(makeKeyEvent('n'));
      expect(action).toHaveBeenCalledTimes(1);

      manager.stopListening();
    });

    it('stops responding after stopListening', () => {
      const action = vi.fn();
      manager.registerShortcut({ key: 'n', action, description: 'New', category: 'tasks' });
      manager.startListening();
      manager.stopListening();

      document.dispatchEvent(makeKeyEvent('n'));
      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('singleton', () => {
    it('keyboardManager is a singleton KeyboardManager instance', () => {
      expect(keyboardManager).toBeInstanceOf(KeyboardManager);
      // Calling getInstance again returns the same object
      expect(KeyboardManager.getInstance()).toBe(KeyboardManager.getInstance());
    });
  });
});
