/**
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance
 * Consolidated module containing settings, focus management, and ARIA helpers
 */

// ============================================================================
// Types
// ============================================================================

export interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  announceChanges: boolean;
}

export interface AnnouncementOptions {
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
}

// ============================================================================
// Constants
// ============================================================================

// Grid navigation assumes cells are approximately this width in pixels
const GRID_CELL_WIDTH_PX = 200;

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]:not([disabled])',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="gridcell"]',
].join(', ');

// ============================================================================
// ARIA Helper Functions
// ============================================================================

export function getAriaLabel(element: HTMLElement): string {
  return element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim() ||
    '';
}

export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

export function getAriaDescription(element: HTMLElement): string {
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const descElement = document.getElementById(describedBy);
    return descElement?.textContent?.trim() || '';
  }
  return '';
}

export function setAriaDescription(element: HTMLElement, description: string): void {
  const id = `desc-${Math.random().toString(36).substr(2, 9)}`;
  const descElement = document.createElement('div');
  descElement.id = id;
  descElement.className = 'sr-only';
  descElement.textContent = description;
  document.body.appendChild(descElement);
  element.setAttribute('aria-describedby', id);
}

export function getRole(element: HTMLElement): string {
  return element.getAttribute('role') || element.tagName.toLowerCase();
}

export function setRole(element: HTMLElement, role: string): void {
  element.setAttribute('role', role);
}

// ============================================================================
// Focus Management
// ============================================================================

class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private maxHistorySize = 10;

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
  }

  trapFocus(element: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(element);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => element.removeEventListener('keydown', handleKeyDown);
  }

  trackFocusChange(target: HTMLElement): void {
    if (!target || target === document.body) return;

    this.focusHistory.push(target);
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory = this.focusHistory.slice(-this.maxHistorySize);
    }
  }

  removeFocusFromHistory(target: HTMLElement): void {
    this.focusHistory = this.focusHistory.filter(el => el !== target);
  }

  restoreFocus(): void {
    const lastFocused = this.focusHistory[this.focusHistory.length - 1];
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  isFocusable(element: HTMLElement): boolean {
    return this.getFocusableElements(document.body).includes(element);
  }

  setupFocusTracking(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('focusin', (event) => {
      this.trackFocusChange(event.target as HTMLElement);
    });

    document.addEventListener('focusout', (event) => {
      this.removeFocusFromHistory(event.target as HTMLElement);
    });
  }
}

// ============================================================================
// Settings Management
// ============================================================================

class SettingsManager {
  private settings: AccessibilitySettings;

  constructor(initialSettings?: Partial<AccessibilitySettings>) {
    this.settings = {
      highContrast: false,
      reduceMotion: false,
      fontSize: 'medium',
      screenReader: false,
      keyboardNavigation: true,
      focusVisible: true,
      announceChanges: true,
      ...initialSettings
    };
  }

  detectScreenReader(): boolean {
    if (typeof window === 'undefined') return false;

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const hasScreenReader =
      'speechSynthesis' in window ||
      'speechRecognition' in window ||
      userAgent.includes('NVDA') ||
      userAgent.includes('JAWS') ||
      userAgent.includes('VoiceOver') ||
      document.documentElement.getAttribute('aria-hidden') !== null;

    this.settings.screenReader = hasScreenReader;
    return hasScreenReader;
  }

  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }

  applySettings(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle('high-contrast', this.settings.highContrast);
    root.classList.toggle('reduce-motion', this.settings.reduceMotion);
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${this.settings.fontSize}`);
    root.classList.toggle('focus-visible', this.settings.focusVisible);
  }

  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  isEnabled(setting: keyof AccessibilitySettings): boolean {
    return Boolean(this.settings[setting]);
  }
}

// ============================================================================
// Announcement System
// ============================================================================

interface QueuedAnnouncement {
  message: string;
  options: AnnouncementOptions;
}

class AnnouncementManager {
  private queue: QueuedAnnouncement[] = [];
  private isProcessing = false;
  private enabled = true;
  private liveRegionId = 'accessibility-announcements';

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  setupLiveRegion(): void {
    if (typeof window === 'undefined') return;

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = this.liveRegionId;
    document.body.appendChild(liveRegion);
  }

  announce(message: string, options: AnnouncementOptions = { priority: 'polite' }): void {
    if (!this.enabled) return;
    this.queue.push({ message, options });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const announcement = this.queue.shift();
      if (!announcement || announcement.options.priority === 'off') continue;
      await this.makeAnnouncement(announcement.message, announcement.options.priority);
    }

    this.isProcessing = false;
  }

  private async makeAnnouncement(message: string, priority: 'polite' | 'assertive'): Promise<void> {
    const liveRegion = document.getElementById(this.liveRegionId);
    if (!liveRegion) return;

    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  clearQueue(): void {
    this.queue = [];
  }
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

class KeyboardNavigationManager {
  private enabled = true;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  handleTabNavigation(event: KeyboardEvent, focusableElements: HTMLElement[]): void {
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    if (event.shiftKey) {
      if (currentIndex <= 0) {
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }
    } else {
      if (currentIndex >= focusableElements.length - 1) {
        event.preventDefault();
        focusableElements[0]?.focus();
      }
    }
  }

  handleEscapeKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    // Close modals/dialogs
    const modal = target.closest('[role="dialog"], [role="alertdialog"]');
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
      closeButton?.click();
      return;
    }

    // Clear search inputs
    if (target.matches('input[type="search"], input[placeholder*="search" i]')) {
      (target as HTMLInputElement).value = '';
      target.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // Close dropdowns/menus
    const dropdown = target.closest('[role="menu"], [role="listbox"]');
    if (dropdown) {
      const trigger = document.querySelector(`[aria-controls="${dropdown.id}"]`) as HTMLElement;
      trigger?.focus();
    }
  }

  handleActivationKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    if (target.matches('button, [role="button"]') && event.key === ' ') {
      event.preventDefault();
      (target as HTMLButtonElement).click();
    }

    if (target.matches('a[href]') && event.key === 'Enter') {
      (target as HTMLAnchorElement).click();
    }
  }

  handleArrowKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    const menu = target.closest('[role="menu"], [role="menubar"]');
    if (menu) {
      this.navigateMenu(menu, event.key);
      return;
    }

    const listbox = target.closest('[role="listbox"]');
    if (listbox) {
      this.navigateListbox(listbox, event.key);
      return;
    }

    const grid = target.closest('[role="grid"]');
    if (grid) {
      this.navigateGrid(grid, event.key);
    }
  }

  private navigateMenu(menu: Element, key: string): void {
    const items = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'ArrowRight': {
        const currentItem = items[currentIndex];
        if (currentItem) {
          const submenu = currentItem.querySelector('[role="menu"]');
          if (submenu) {
            const firstSubmenuItem = submenu.querySelector('[role="menuitem"]') as HTMLElement;
            firstSubmenuItem?.focus();
          }
        }
        return;
      }
      case 'ArrowLeft': {
        const parentMenu = menu.closest('[role="menu"]');
        if (parentMenu) {
          const parentItem = parentMenu.querySelector('[aria-expanded="true"]') as HTMLElement;
          parentItem?.focus();
        }
        return;
      }
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
    }
  }

  private navigateListbox(listbox: Element, key: string): void {
    const options = Array.from(listbox.querySelectorAll('[role="option"]')) as HTMLElement[];
    const currentIndex = options.indexOf(document.activeElement as HTMLElement);
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + 1, options.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = options.length - 1;
        break;
    }

    if (nextIndex !== currentIndex && options[nextIndex]) {
      options[nextIndex].focus();
    }
  }

  private navigateGrid(grid: Element, key: string): void {
    const cells = Array.from(grid.querySelectorAll('[role="gridcell"]')) as HTMLElement[];
    const currentIndex = cells.indexOf(document.activeElement as HTMLElement);
    const gridElement = grid as HTMLElement;
    const gridWidth = Math.floor(gridElement.offsetWidth / GRID_CELL_WIDTH_PX);
    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, cells.length - 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + gridWidth, cells.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - gridWidth, 0);
        break;
    }

    if (nextIndex !== currentIndex && cells[nextIndex]) {
      cells[nextIndex].focus();
    }
  }
}

// ============================================================================
// Main Accessibility Manager
// ============================================================================

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private keyboardNav: KeyboardNavigationManager;
  private focusManager: FocusManager;
  private announcements: AnnouncementManager;
  private settingsManager: SettingsManager;

  constructor() {
    this.settingsManager = new SettingsManager();
    this.keyboardNav = new KeyboardNavigationManager(true);
    this.focusManager = new FocusManager();
    this.announcements = new AnnouncementManager(true);

    this.initialize();
  }

  static getInstance(): AccessibilityManager {
    if (!this.instance) {
      this.instance = new AccessibilityManager();
    }
    return this.instance;
  }

  private initialize(): void {
    this.settingsManager.detectScreenReader();
    this.setupKeyboardNavigation();
    this.focusManager.setupFocusTracking();
    this.announcements.setupLiveRegion();
    this.settingsManager.applySettings();
  }

  private setupKeyboardNavigation(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      if (!this.keyboardNav.isEnabled()) return;

      switch (event.key) {
        case 'Tab':
          this.handleTabKey(event);
          break;
        case 'Escape':
          this.keyboardNav.handleEscapeKey(event);
          break;
        case 'Enter':
        case ' ':
          this.keyboardNav.handleActivationKeys(event);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.keyboardNav.handleArrowKeys(event);
          break;
      }
    });
  }

  private handleTabKey(event: KeyboardEvent): void {
    const focusableElements = this.focusManager.getFocusableElements(document.body);
    this.keyboardNav.handleTabNavigation(event, focusableElements);
  }

  // Focus management delegation
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return this.focusManager.getFocusableElements(container);
  }

  trapFocus(element: HTMLElement): () => void {
    return this.focusManager.trapFocus(element);
  }

  restoreFocus(): void {
    this.focusManager.restoreFocus();
  }

  // Announcement delegation
  announce(message: string, options: AnnouncementOptions = { priority: 'polite' }): void {
    this.announcements.announce(message, options);
  }

  // Settings delegation
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settingsManager.updateSettings(newSettings);
    this.keyboardNav.setEnabled(newSettings.keyboardNavigation ?? this.settingsManager.isEnabled('keyboardNavigation'));
    this.announcements.setEnabled(newSettings.announceChanges ?? this.settingsManager.isEnabled('announceChanges'));
  }

  getSettings(): AccessibilitySettings {
    return this.settingsManager.getSettings();
  }

  // Static utility methods
  static getAriaLabel = getAriaLabel;
  static setAriaLabel = setAriaLabel;
  static getAriaDescription = getAriaDescription;
  static setAriaDescription = setAriaDescription;
  static getRole = getRole;
  static setRole = setRole;

  static isFocusable(element: HTMLElement): boolean {
    const manager = AccessibilityManager.getInstance();
    return manager.focusManager.isFocusable(element);
  }
}

// Initialize accessibility manager
if (typeof window !== 'undefined') {
  AccessibilityManager.getInstance();
}
