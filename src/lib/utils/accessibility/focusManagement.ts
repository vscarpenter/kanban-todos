/**
 * Focus management utilities
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

export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private maxHistorySize = 10;

  /**
   * Gets all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[];
  }

  /**
   * Traps focus within an element (for modals/dialogs)
   * Returns cleanup function
   */
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

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Tracks focus changes to maintain history
   */
  trackFocusChange(target: HTMLElement): void {
    if (!target || target === document.body) return;

    this.focusHistory.push(target);
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory = this.focusHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Removes element from focus history
   */
  removeFocusFromHistory(target: HTMLElement): void {
    this.focusHistory = this.focusHistory.filter(el => el !== target);
  }

  /**
   * Restores focus to last focused element
   */
  restoreFocus(): void {
    const lastFocused = this.focusHistory[this.focusHistory.length - 1];
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  /**
   * Checks if an element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    return this.getFocusableElements(document.body).includes(element);
  }

  /**
   * Sets up focus tracking event listeners
   */
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
