/**
 * Version Management and Update Detection Utility
 * Handles version comparison, update notifications, and cache management
 */

export interface VersionInfo {
  version: string;
  buildTime: string;
  buildHash: string;
  buildTimestamp: number;
}

export interface UpdateStatus {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  isRequired: boolean;
  releaseNotes?: string[];
  updateAvailableAt: number;
}

/**
 * Parse semantic version string into comparable components
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const cleaned = version.replace(/^v/, ''); // Remove 'v' prefix if present
  const parts = cleaned.split('.');
  
  return {
    major: parseInt(parts[0] || '0', 10),
    minor: parseInt(parts[1] || '0', 10),
    patch: parseInt(parts[2] || '0', 10),
  };
}

/**
 * Compare two semantic versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);
  
  if (versionA.major !== versionB.major) {
    return versionA.major < versionB.major ? -1 : 1;
  }
  
  if (versionA.minor !== versionB.minor) {
    return versionA.minor < versionB.minor ? -1 : 1;
  }
  
  if (versionA.patch !== versionB.patch) {
    return versionA.patch < versionB.patch ? -1 : 1;
  }
  
  return 0;
}

/**
 * Get current application version info
 */
export function getCurrentVersionInfo(): VersionInfo {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
  const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev';
  const buildTimestamp = parseInt(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || Date.now().toString(), 10);
  
  return {
    version,
    buildTime,
    buildHash,
    buildTimestamp,
  };
}

/**
 * Check for service worker updates
 */
export async function checkServiceWorkerUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Force a check for updates
    await registration.update();
    
    // Check if there's a waiting service worker (new version available)
    return Boolean(registration.waiting || registration.installing);
  } catch (error) {
    console.error('Failed to check for service worker updates:', error);
    return false;
  }
}

/**
 * Install pending service worker update
 */
export async function installUpdate(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers not supported');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait for the new service worker to take control
      return new Promise((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve();
        };
        
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      });
    }
  } catch (error) {
    console.error('Failed to install update:', error);
    throw error;
  }
}

/**
 * Get stored version preference settings
 */
export interface VersionPreferences {
  autoUpdate: boolean;
  notificationsEnabled: boolean;
  dismissedVersions: string[];
  lastUpdateCheck: number;
}

const VERSION_PREFERENCES_KEY = 'cascade-version-preferences';
const DEFAULT_PREFERENCES: VersionPreferences = {
  autoUpdate: false,
  notificationsEnabled: true,
  dismissedVersions: [],
  lastUpdateCheck: 0,
};

export function getVersionPreferences(): VersionPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(VERSION_PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load version preferences:', error);
  }
  
  return DEFAULT_PREFERENCES;
}

export function setVersionPreferences(preferences: Partial<VersionPreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getVersionPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(VERSION_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save version preferences:', error);
  }
}

/**
 * Check if a version has been dismissed by the user
 */
export function isVersionDismissed(version: string): boolean {
  const preferences = getVersionPreferences();
  return preferences.dismissedVersions.includes(version);
}

/**
 * Mark a version as dismissed
 */
export function dismissVersion(version: string): void {
  const preferences = getVersionPreferences();
  if (!preferences.dismissedVersions.includes(version)) {
    setVersionPreferences({
      dismissedVersions: [...preferences.dismissedVersions, version],
    });
  }
}

/**
 * Clear all dismissed versions (useful after major updates)
 */
export function clearDismissedVersions(): void {
  setVersionPreferences({ dismissedVersions: [] });
}

/**
 * Schedule periodic update checks
 */
export function scheduleUpdateChecks(callback: () => void, intervalMs: number = 5 * 60 * 1000): () => void {
  const interval = setInterval(callback, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Format build time for display
 */
export function formatBuildTime(buildTime: string): string {
  try {
    const date = new Date(buildTime);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Generate release notes based on version differences
 * In a real app, this would fetch from a server or release notes file
 */
export function generateReleaseNotes(fromVersion: string, toVersion: string): string[] {
  const versionDiff = compareVersions(toVersion, fromVersion);
  
  if (versionDiff <= 0) {
    return [];
  }
  
  // Mock release notes - in production, fetch from server or static file
  const releaseNotes: Record<string, string[]> = {
    '1.0.1': [
      'Improved iOS Safari compatibility',
      'Fixed drag-and-drop issues on touch devices',
      'Better error handling',
    ],
    '1.0.2': [
      'Enhanced board reordering controls',
      'Touch-optimized UI improvements',
      'Performance optimizations',
    ],
    '1.1.0': [
      'New version management system',
      'Update notifications',
      'Enhanced cache busting',
      'iOS 18+ optimizations',
    ],
  };
  
  return releaseNotes[toVersion] || ['Bug fixes and improvements'];
}

/**
 * Debug information for version management
 */
export function getVersionDebugInfo(): Record<string, unknown> {
  return {
    currentVersion: getCurrentVersionInfo(),
    preferences: getVersionPreferences(),
    serviceWorkerSupport: 'serviceWorker' in navigator,
    buildEnvironment: {
      nodeEnv: process.env.NODE_ENV,
      nextPublicAppVersion: process.env.NEXT_PUBLIC_APP_VERSION,
      nextPublicBuildTime: process.env.NEXT_PUBLIC_BUILD_TIME,
      nextPublicBuildHash: process.env.NEXT_PUBLIC_BUILD_HASH,
      nextPublicBuildTimestamp: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP,
    },
  };
}