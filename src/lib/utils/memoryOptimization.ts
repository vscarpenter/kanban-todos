// Memory optimization utilities for the kanban application

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cleanup function to remove event listeners and clear timers
export function createCleanupManager() {
  const cleanupFunctions: (() => void)[] = [];
  const timers: NodeJS.Timeout[] = [];
  const intervals: NodeJS.Timeout[] = [];
  
  return {
    addCleanup: (fn: () => void) => {
      cleanupFunctions.push(fn);
    },
    
    addTimer: (timer: NodeJS.Timeout) => {
      timers.push(timer);
    },
    
    addInterval: (interval: NodeJS.Timeout) => {
      intervals.push(interval);
    },
    
    cleanup: () => {
      // Clear all timers
      timers.forEach(timer => clearTimeout(timer));
      intervals.forEach(interval => clearInterval(interval));
      
      // Run cleanup functions
      cleanupFunctions.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
      
      // Clear arrays
      cleanupFunctions.length = 0;
      timers.length = 0;
      intervals.length = 0;
    }
  };
}

// Efficient array updates to minimize re-renders
export function optimizedArrayUpdate<T>(
  array: T[],
  predicate: (item: T) => boolean,
  updater: (item: T) => T
): T[] {
  let hasChanges = false;
  const newArray = array.map(item => {
    if (predicate(item)) {
      const updated = updater(item);
      if (updated !== item) {
        hasChanges = true;
        return updated;
      }
    }
    return item;
  });
  
  return hasChanges ? newArray : array;
}

