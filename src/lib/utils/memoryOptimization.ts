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

// WeakMap-based cache for component instances
export function createWeakCache<K extends object, V>() {
  const cache = new WeakMap<K, V>();
  
  return {
    get: (key: K): V | undefined => cache.get(key),
    set: (key: K, value: V): void => {
      cache.set(key, value);
    },
    has: (key: K): boolean => cache.has(key),
    delete: (key: K): boolean => cache.delete(key),
  };
}

// Memory usage monitoring (browser only)
export function getMemoryInfo() {
  if (typeof window === 'undefined') return null;
  
  const performance = window.performance as typeof window.performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };
  
  if (!performance?.memory) return null;
  
  return {
    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100,
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

// Batch DOM updates to prevent layout thrashing
export function batchDOMUpdates(callback: () => void): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 100 });
  } else {
    setTimeout(callback, 0);
  }
}

// Virtual scrolling helper for large lists
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 5
): { start: number; end: number; visibleStart: number; visibleEnd: number } {
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );
  
  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(totalItems - 1, visibleEnd + overscan);
  
  return { start, end, visibleStart, visibleEnd };
}