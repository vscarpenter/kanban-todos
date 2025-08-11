import { taskDB } from './database';

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
    }
    
    // 3. Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
    
    // 4. Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
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
        await new Promise<void>((resolve, reject) => {
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onblocked = () => {
            // Database deletion is blocked, resolve anyway
            resolve();
          };
        });
      } catch (error) {
        console.warn('Could not delete IndexedDB database:', error);
      }
    }
    
    // 6. Reload the page to start fresh
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to reset application:', error);
    // Even if there's an error, try to reload the page
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}

/**
 * Shows a confirmation dialog before resetting the app
 */
export function confirmAndResetApplication(): void {
  const confirmed = window.confirm(
    'This will completely reset the application to its default state.\n\n' +
    'ALL DATA will be permanently deleted including:\n' +
    '• All boards and tasks\n' +
    '• All settings and preferences\n' +
    '• All stored data\n\n' +
    'This action cannot be undone. Are you sure you want to continue?'
  );
  
  if (confirmed) {
    // Show a second confirmation for safety
    const doubleConfirmed = window.confirm(
      'Are you absolutely sure? This will delete everything and cannot be undone.'
    );
    
    if (doubleConfirmed) {
      resetApplication();
    }
  }
}