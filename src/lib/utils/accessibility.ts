/**
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance
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

export interface FocusManager {
  trapFocus: (element: HTMLElement) => () => void;
  restoreFocus: (element: HTMLElement) => void;
  moveFocus: (direction: 'next' | 'previous') => void;
  getFocusableElements: (container: HTMLElement) => HTMLElement[];
}

export interface AnnouncementOptions {
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private settings: AccessibilitySettings;
  private focusHistory: HTMLElement[] = [];
  private currentFocusTrap: (() => void) | null = null;
  private announcementQueue: Array<{ message: string; options: AnnouncementOptions }> = [];
  private isProcessingAnnouncements = false;

  constructor() {
    this.settings = {
      highContrast: false,
      reduceMotion: false,
      fontSize: 'medium',
      screenReader: false,
      keyboardNavigation: true,
      focusVisible: true,
      announceChanges: true,
    };

    this.initializeAccessibility();
  }

  static getInstance(): AccessibilityManager {
    if (!this.instance) {
      this.instance = new AccessibilityManager();
    }
    return this.instance;
  }

  private initializeAccessibility(): void {
    // Detect screen reader
    this.detectScreenReader();
    
    // Set up keyboard navigation
    this.setupKeyboardNavigation();
    
    // Set up focus management
    this.setupFocusManagement();
    
    // Set up announcement system
    this.setupAnnouncementSystem();
    
    // Apply initial settings
    this.applySettings();
  }

  private detectScreenReader(): void {
    // Check for common screen reader indicators
    const hasScreenReader = 
      'speechSynthesis' in window ||
      'speechRecognition' in window ||
      (typeof window !== 'undefined' && (window as Window & { navigator?: { userAgent: string } }).navigator?.userAgent.includes('NVDA')) ||
      (typeof window !== 'undefined' && (window as Window & { navigator?: { userAgent: string } }).navigator?.userAgent.includes('JAWS')) ||
      (typeof window !== 'undefined' && (window as Window & { navigator?: { userAgent: string } }).navigator?.userAgent.includes('VoiceOver')) ||
      document.documentElement.getAttribute('aria-hidden') !== null;

    this.settings.screenReader = hasScreenReader;
  }

  private setupKeyboardNavigation(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      if (!this.settings.keyboardNavigation) return;

      // Handle common keyboard shortcuts
      switch (event.key) {
        case 'Tab':
          this.handleTabNavigation(event);
          break;
        case 'Escape':
          this.handleEscapeKey(event);
          break;
        case 'Enter':
        case ' ':
          this.handleActivationKeys(event);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowKeys(event);
          break;
      }
    });
  }

  private setupFocusManagement(): void {
    if (typeof window === 'undefined') return;

    // Track focus changes
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        // Keep only last 10 focus elements
        if (this.focusHistory.length > 10) {
          this.focusHistory = this.focusHistory.slice(-10);
        }
      }
    });

    // Handle focus restoration
    document.addEventListener('focusout', (event) => {
      const target = event.target as HTMLElement;
      if (target && this.focusHistory.includes(target)) {
        // Element is losing focus, update history
        this.focusHistory = this.focusHistory.filter(el => el !== target);
      }
    });
  }

  private setupAnnouncementSystem(): void {
    if (typeof window === 'undefined') return;

    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'accessibility-announcements';
    document.body.appendChild(liveRegion);
  }

  private handleTabNavigation(event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements(document.body);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (event.shiftKey) {
      // Shift + Tab: move backward
      if (currentIndex <= 0) {
        event.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }
    } else {
      // Tab: move forward
      if (currentIndex >= focusableElements.length - 1) {
        event.preventDefault();
        focusableElements[0]?.focus();
      }
    }
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    // Close modals, clear search, etc.
    const target = event.target as HTMLElement;
    
    // Check if we're in a modal or dialog
    const modal = target.closest('[role="dialog"], [role="alertdialog"]');
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
      closeButton?.click();
      return;
    }

    // Check if we're in a search input
    if (target.matches('input[type="search"], input[placeholder*="search" i]')) {
      (target as HTMLInputElement).value = '';
      target.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // Check if we're in a dropdown or menu
    const dropdown = target.closest('[role="menu"], [role="listbox"]');
    if (dropdown) {
      const trigger = document.querySelector(`[aria-controls="${dropdown.id}"]`) as HTMLElement;
      trigger?.focus();
      return;
    }
  }

  private handleActivationKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle button activation
    if (target.matches('button, [role="button"]')) {
      if (event.key === ' ') {
        event.preventDefault();
        (target as HTMLButtonElement).click();
      }
    }

    // Handle link activation
    if (target.matches('a[href]')) {
      if (event.key === 'Enter') {
        (target as HTMLAnchorElement).click();
      }
    }
  }

  private handleArrowKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    
    // Handle menu navigation
    const menu = target.closest('[role="menu"], [role="menubar"]');
    if (menu) {
      this.navigateMenu(menu, event.key);
      return;
    }

    // Handle listbox navigation
    const listbox = target.closest('[role="listbox"]');
    if (listbox) {
      this.navigateListbox(listbox, event.key);
      return;
    }

    // Handle grid navigation
    const grid = target.closest('[role="grid"]');
    if (grid) {
      this.navigateGrid(grid, event.key);
      return;
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
      case 'ArrowRight':
        // Move to submenu if available
        const submenu = items[currentIndex]?.querySelector('[role="menu"]');
        if (submenu) {
          const firstSubmenuItem = submenu.querySelector('[role="menuitem"]') as HTMLElement;
          firstSubmenuItem?.focus();
          return;
        }
        break;
      case 'ArrowLeft':
        // Move to parent menu
        const parentMenu = menu.closest('[role="menu"]');
        if (parentMenu) {
          const parentItem = parentMenu.querySelector('[aria-expanded="true"]') as HTMLElement;
          parentItem?.focus();
          return;
        }
        break;
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
    
    // Calculate grid dimensions (simplified - assumes uniform grid)
    const gridElement = grid as HTMLElement;
    const gridWidth = Math.floor(gridElement.offsetWidth / 200); // Approximate cell width
    // const gridHeight = Math.ceil(cells.length / gridWidth);
    
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

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
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

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  trapFocus(element: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(element);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
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
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }

  restoreFocus(): void {
    const lastFocused = this.focusHistory[this.focusHistory.length - 1];
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  announce(message: string, options: AnnouncementOptions = { priority: 'polite' }): void {
    if (!this.settings.announceChanges) return;

    this.announcementQueue.push({ message, options });
    this.processAnnouncementQueue();
  }

  private async processAnnouncementQueue(): Promise<void> {
    if (this.isProcessingAnnouncements || this.announcementQueue.length === 0) return;

    this.isProcessingAnnouncements = true;

    while (this.announcementQueue.length > 0) {
      const { message, options } = this.announcementQueue.shift()!;
      
      if (options.priority === 'off') continue;

      const liveRegion = document.getElementById('accessibility-announcements');
      if (liveRegion) {
        liveRegion.setAttribute('aria-live', options.priority);
        liveRegion.textContent = message;
        
        // Wait for announcement to be processed
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessingAnnouncements = false;
  }

  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }

  private applySettings(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Apply high contrast
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (this.settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${this.settings.fontSize}`);

    // Apply focus visible
    if (this.settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  }

  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // Utility methods for components
  static getAriaLabel(element: HTMLElement): string {
    return element.getAttribute('aria-label') || 
           element.getAttribute('aria-labelledby') || 
           element.textContent?.trim() || 
           '';
  }

  static setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  static getAriaDescription(element: HTMLElement): string {
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const descElement = document.getElementById(describedBy);
      return descElement?.textContent?.trim() || '';
    }
    return '';
  }

  static setAriaDescription(element: HTMLElement, description: string): void {
    const id = `desc-${Math.random().toString(36).substr(2, 9)}`;
    const descElement = document.createElement('div');
    descElement.id = id;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    document.body.appendChild(descElement);
    element.setAttribute('aria-describedby', id);
  }

  static isFocusable(element: HTMLElement): boolean {
    const manager = AccessibilityManager.getInstance();
    return manager.getFocusableElements(document.body).includes(element);
  }

  static getRole(element: HTMLElement): string {
    return element.getAttribute('role') || element.tagName.toLowerCase();
  }

  static setRole(element: HTMLElement, role: string): void {
    element.setAttribute('role', role);
  }
}

// Initialize accessibility manager
if (typeof window !== 'undefined') {
  AccessibilityManager.getInstance();
}
