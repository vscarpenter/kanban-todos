/**
 * ARIA attribute helper utilities
 */

/**
 * Gets the accessible label for an element
 */
export function getAriaLabel(element: HTMLElement): string {
  return element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim() ||
    '';
}

/**
 * Sets aria-label on an element
 */
export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

/**
 * Gets the accessible description for an element
 */
export function getAriaDescription(element: HTMLElement): string {
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const descElement = document.getElementById(describedBy);
    return descElement?.textContent?.trim() || '';
  }
  return '';
}

/**
 * Sets aria-describedby with generated description element
 */
export function setAriaDescription(element: HTMLElement, description: string): void {
  const id = `desc-${Math.random().toString(36).substr(2, 9)}`;
  const descElement = document.createElement('div');
  descElement.id = id;
  descElement.className = 'sr-only';
  descElement.textContent = description;
  document.body.appendChild(descElement);
  element.setAttribute('aria-describedby', id);
}

/**
 * Gets the role of an element (explicit or implicit)
 */
export function getRole(element: HTMLElement): string {
  return element.getAttribute('role') || element.tagName.toLowerCase();
}

/**
 * Sets the role attribute on an element
 */
export function setRole(element: HTMLElement, role: string): void {
  element.setAttribute('role', role);
}
