import { taskDB } from './database';
import { logger } from './logger';
import { VISITED_KEY } from '@/components/about/visitedKey';

/**
 * Completely resets the application to its default state by:
 * - Clearing all IndexedDB databases
 * - Clearing localStorage
 * - Clearing sessionStorage
 * - Clearing cookies
 * - Reloading the page
 */
export async function resetApplication(): Promise<void> {
  try {
    // 1. Clear IndexedDB
    await taskDB.resetDatabase();

    // 2. Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
      window.localStorage.setItem(VISITED_KEY, 'true');
    }

    // 3. Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }

    // 4. Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
        // Delete cookie by setting it to expire in the past
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      });
    }

    // 5. Clear any other IndexedDB databases that might exist
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        // Try to delete the main database completely and recreate it
        const deleteRequest = window.indexedDB.deleteDatabase('cascade-tasks');
        await new Promise<void>((resolve) => {
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => {
            logger.warn('Error deleting IndexedDB database:', deleteRequest.error);
            resolve(); // Continue anyway
          };
          deleteRequest.onblocked = () => {
            logger.warn('Database deletion blocked, continuing anyway');
            // Database deletion is blocked, resolve anyway
            resolve();
          };
        });
      } catch (error) {
        logger.warn('Could not delete IndexedDB database:', error);
      }
    }

    // 6. Use a direct navigation so any open dialogs and in-memory stores are
    // discarded after the destructive reset completes.
    if (typeof window !== 'undefined') {
      try {
        window.location.assign(`${window.location.origin}/`);
      } catch {
        window.location.reload();
      }
    }
  } catch (error) {
    logger.error('Failed to reset application:', error);
    // Even if there's an error, try to reload the page
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          window.location.href = window.location.origin + window.location.pathname;
        } catch {
          window.location.reload();
        }
      }, 100);
    }
  }
}
