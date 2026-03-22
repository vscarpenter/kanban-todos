/**
 * Accessibility utilities - barrel export
 * Re-exports all accessibility sub-modules for backward compatibility
 */

export { FocusManager, FOCUSABLE_SELECTORS } from './focusManager';
export { SettingsManager, type AccessibilitySettings } from './settingsManager';
export { AnnouncementManager, type AnnouncementOptions } from './announcementManager';
export { KeyboardNavigationManager } from './keyboardNavigation';
export { AccessibilityManager } from './accessibilityManager';
export {
  getAriaLabel,
  setAriaLabel,
  getAriaDescription,
  setAriaDescription,
  getRole,
  setRole,
} from './ariaHelpers';
