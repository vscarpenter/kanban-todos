/**
 * Screen reader announcement system
 */

export interface AnnouncementOptions {
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
}

interface QueuedAnnouncement {
  message: string;
  options: AnnouncementOptions;
}

export class AnnouncementManager {
  private queue: QueuedAnnouncement[] = [];
  private isProcessing = false;
  private enabled = true;
  private liveRegionId = 'accessibility-announcements';

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * Initializes the live region for announcements
   */
  setupLiveRegion(): void {
    if (typeof window === 'undefined') return;

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = this.liveRegionId;
    document.body.appendChild(liveRegion);
  }

  /**
   * Announces a message to screen readers
   */
  announce(message: string, options: AnnouncementOptions = { priority: 'polite' }): void {
    if (!this.enabled) return;

    this.queue.push({ message, options });
    this.processQueue();
  }

  /**
   * Processes announcement queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const announcement = this.queue.shift();
      if (!announcement || announcement.options.priority === 'off') continue;

      await this.makeAnnouncement(announcement.message, announcement.options.priority);
    }

    this.isProcessing = false;
  }

  /**
   * Makes a single announcement
   */
  private async makeAnnouncement(message: string, priority: 'polite' | 'assertive'): Promise<void> {
    const liveRegion = document.getElementById(this.liveRegionId);
    if (!liveRegion) return;

    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Enables or disables announcements
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clears announcement queue
   */
  clearQueue(): void {
    this.queue = [];
  }
}
