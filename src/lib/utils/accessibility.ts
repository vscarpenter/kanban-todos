/**
 * Accessibility utilities - re-export barrel
 * All implementation has been split into src/lib/utils/accessibility/ directory.
 * This file ensures backward compatibility for imports from '@/lib/utils/accessibility'.
 */

export { FocusManager, FOCUSABLE_SELECTORS } from './accessibility/focusManager';
export { SettingsManager, type AccessibilitySettings } from './accessibility/settingsManager';
export { AnnouncementManager, type AnnouncementOptions } from './accessibility/announcementManager';
export { KeyboardNavigationManager } from './accessibility/keyboardNavigation';
export { AccessibilityManager } from './accessibility/accessibilityManager';
export {
  getAriaLabel,
  setAriaLabel,
  getAriaDescription,
  setAriaDescription,
  getRole,
  setRole,
} from './accessibility/ariaHelpers';
