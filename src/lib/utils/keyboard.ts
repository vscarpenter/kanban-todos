export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export class KeyboardManager {
  private static instance: KeyboardManager;
  private shortcuts: KeyboardShortcut[] = [];
  private isListening = false;

  static getInstance(): KeyboardManager {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager();
    }
    return KeyboardManager.instance;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (this.isInputFocused()) return;

    const matchingShortcut = this.shortcuts.find(shortcut => 
      this.matchesShortcut(event, shortcut)
    );

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  };

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const inputTypes = ['input', 'textarea', 'select'];
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
    
    return inputTypes.includes(activeElement.tagName.toLowerCase()) || isContentEditable;
  }

  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrl &&
      !!event.altKey === !!shortcut.alt &&
      !!event.shiftKey === !!shortcut.shift &&
      !!event.metaKey === !!shortcut.meta
    );
  }

  registerShortcut(shortcut: KeyboardShortcut) {
    // Remove existing shortcut with same key combination
    this.shortcuts = this.shortcuts.filter(s => 
      !(s.key === shortcut.key &&
        s.ctrl === shortcut.ctrl &&
        s.alt === shortcut.alt &&
        s.shift === shortcut.shift &&
        s.meta === shortcut.meta)
    );

    this.shortcuts.push(shortcut);
  }

  unregisterShortcut(key: string, modifiers?: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean }) {
    this.shortcuts = this.shortcuts.filter(s => 
      !(s.key === key &&
        s.ctrl === modifiers?.ctrl &&
        s.alt === modifiers?.alt &&
        s.shift === modifiers?.shift &&
        s.meta === modifiers?.meta)
    );
  }

  startListening() {
    if (this.isListening) return;
    
    document.addEventListener('keydown', this.handleKeyDown);
    this.isListening = true;
  }

  stopListening() {
    if (!this.isListening) return;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    this.isListening = false;
  }

  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }

  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.shortcuts.filter(s => s.category === category);
  }

  // Helper to format shortcut display
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('Cmd');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  }
}

export const keyboardManager = KeyboardManager.getInstance();

// Common keyboard navigation utilities
export const navigationKeys = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  SPACE: ' ',
} as const;