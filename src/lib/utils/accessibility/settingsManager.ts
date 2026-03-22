/**
 * Accessibility settings management for WCAG 2.1 AA compliance
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

export class SettingsManager {
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
