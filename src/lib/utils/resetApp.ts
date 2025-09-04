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
    console.log('Starting application reset...');
    
    // 1. Clear IndexedDB
    console.log('Clearing IndexedDB...');
    await taskDB.resetDatabase();
    
    // 2. Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      console.log('Clearing localStorage...');
      window.localStorage.clear();
    }
    
    // 3. Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      console.log('Clearing sessionStorage...');
      window.sessionStorage.clear();
    }
    
    // 4. Clear cookies
    if (typeof document !== 'undefined') {
      console.log('Clearing cookies...');
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
        console.log('Deleting IndexedDB database...');
        // Try to delete the main database completely and recreate it
        const deleteRequest = window.indexedDB.deleteDatabase('cascade-tasks');
        await new Promise<void>((resolve) => {
          deleteRequest.onsuccess = () => {
            console.log('IndexedDB database deleted successfully');
            resolve();
          };
          deleteRequest.onerror = () => {
            console.warn('Error deleting IndexedDB database:', deleteRequest.error);
            resolve(); // Continue anyway
          };
          deleteRequest.onblocked = () => {
            console.warn('Database deletion blocked, continuing anyway');
            // Database deletion is blocked, resolve anyway
            resolve();
          };
        });
      } catch (error) {
        console.warn('Could not delete IndexedDB database:', error);
      }
    }
    
    console.log('Reset complete, reloading page...');
    
    // 6. Use a more reliable page reload method
    if (typeof window !== 'undefined') {
      // Add a small delay to ensure all operations complete
      setTimeout(() => {
        // Try multiple reload methods for maximum compatibility
        try {
          window.location.href = window.location.origin + window.location.pathname;
        } catch {
          try {
            // Use forced reload approach - legacy method
            const location = window.location as Location & { reload(forcedReload?: boolean): void };
            location.reload(true);
          } catch {
            window.location.reload();
          }
        }
      }, 100);
    }
  } catch (error) {
    console.error('Failed to reset application:', error);
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