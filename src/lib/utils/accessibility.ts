/**
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance
 * Refactored to use specialized managers for better maintainability
 */

import { KeyboardNavigationManager } from './accessibility/keyboardNavigation';
import { FocusManager } from './accessibility/focusManagement';
import { AnnouncementManager, type AnnouncementOptions } from './accessibility/announcements';
import { AccessibilitySettingsManager, type AccessibilitySettings } from './accessibility/settingsManager';
import * as AriaHelpers from './accessibility/ariaHelpers';

export type { AccessibilitySettings, AnnouncementOptions };

/**
 * Main accessibility manager coordinating all accessibility features
 */
export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private keyboardNav: KeyboardNavigationManager;
  private focusManager: FocusManager;
  private announcements: AnnouncementManager;
  private settingsManager: AccessibilitySettingsManager;

  constructor() {
    this.settingsManager = new AccessibilitySettingsManager();
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

  /**
   * Initializes all accessibility features
   */
  private initialize(): void {
    this.settingsManager.detectScreenReader();
    this.setupKeyboardNavigation();
    this.focusManager.setupFocusTracking();
    this.announcements.setupLiveRegion();
    this.settingsManager.applySettings();
  }

  /**
   * Sets up keyboard event listeners
   */
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

  /**
   * Handles Tab key with focus wrapping
   */
  private handleTabKey(event: KeyboardEvent): void {
    const focusableElements = this.focusManager.getFocusableElements(document.body);
    this.keyboardNav.handleTabNavigation(event, focusableElements);
  }

  // Delegation methods for focus management
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return this.focusManager.getFocusableElements(container);
  }

  trapFocus(element: HTMLElement): () => void {
    return this.focusManager.trapFocus(element);
  }

  restoreFocus(): void {
    this.focusManager.restoreFocus();
  }

  // Delegation methods for announcements
  announce(message: string, options: AnnouncementOptions = { priority: 'polite' }): void {
    this.announcements.announce(message, options);
  }

  // Delegation methods for settings
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settingsManager.updateSettings(newSettings);

    // Update dependent managers
    this.keyboardNav.setEnabled(newSettings.keyboardNavigation ?? this.settingsManager.isEnabled('keyboardNavigation'));
    this.announcements.setEnabled(newSettings.announceChanges ?? this.settingsManager.isEnabled('announceChanges'));
  }

  getSettings(): AccessibilitySettings {
    return this.settingsManager.getSettings();
  }

  // Static utility methods (delegated to AriaHelpers)
  static getAriaLabel = AriaHelpers.getAriaLabel;
  static setAriaLabel = AriaHelpers.setAriaLabel;
  static getAriaDescription = AriaHelpers.getAriaDescription;
  static setAriaDescription = AriaHelpers.setAriaDescription;
  static getRole = AriaHelpers.getRole;
  static setRole = AriaHelpers.setRole;

  static isFocusable(element: HTMLElement): boolean {
    const manager = AccessibilityManager.getInstance();
    return manager.focusManager.isFocusable(element);
  }
}

// Initialize accessibility manager
if (typeof window !== 'undefined') {
  AccessibilityManager.getInstance();
}
