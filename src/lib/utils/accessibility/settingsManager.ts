/**
 * Accessibility settings management
 */

export interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  announceChanges: boolean;
}

export class AccessibilitySettingsManager {
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

  /**
   * Detects if screen reader is likely active
   */
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

  /**
   * Updates accessibility settings
   */
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }

  /**
   * Applies settings to DOM
   */
  applySettings(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // High contrast
    root.classList.toggle('high-contrast', this.settings.highContrast);

    // Reduced motion
    root.classList.toggle('reduce-motion', this.settings.reduceMotion);

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${this.settings.fontSize}`);

    // Focus visible
    root.classList.toggle('focus-visible', this.settings.focusVisible);
  }

  /**
   * Gets current settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Checks if specific setting is enabled
   */
  isEnabled(setting: keyof AccessibilitySettings): boolean {
    return Boolean(this.settings[setting]);
  }
}
