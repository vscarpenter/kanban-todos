/**
 * Main AccessibilityManager that composes all accessibility sub-managers
 */

import { FocusManager } from './focusManager';
import { SettingsManager, type AccessibilitySettings } from './settingsManager';
import { AnnouncementManager, type AnnouncementOptions } from './announcementManager';
import { KeyboardNavigationManager } from './keyboardNavigation';
import {
  getAriaLabel,
  setAriaLabel,
  getAriaDescription,
  setAriaDescription,
  getRole,
  setRole,
} from './ariaHelpers';

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
