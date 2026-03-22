/**
 * Keyboard navigation management for WCAG 2.1 AA compliance
 */

// Grid navigation assumes cells are approximately this width in pixels
const GRID_CELL_WIDTH_PX = 200;

export class KeyboardNavigationManager {
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
