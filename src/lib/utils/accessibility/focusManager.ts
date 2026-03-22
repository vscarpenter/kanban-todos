/**
 * Focus management utilities for WCAG 2.1 AA compliance
 */

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

export { FOCUSABLE_SELECTORS };

export class FocusManager {
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
