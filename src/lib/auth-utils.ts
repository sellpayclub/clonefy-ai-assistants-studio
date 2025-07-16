/**
 * Utility functions for robust authentication state management
 * Prevents authentication limbo states and session conflicts
 */

/**
 * Comprehensive cleanup of all authentication-related data
 * Clears localStorage, sessionStorage, and any auth tokens
 */
export const cleanupAuthState = () => {
  try {
    // Remove standard auth tokens
    localStorage.removeItem('supabase.auth.token');
    
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if in use
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }

    console.log('Auth state cleaned up successfully');
  } catch (error) {
    console.warn('Error cleaning up auth state:', error);
  }
};

/**
 * Force a clean page reload to reset application state
 */
export const forceCleanReload = (path: string = '/auth') => {
  try {
    window.location.href = path;
  } catch (error) {
    console.warn('Error during force reload:', error);
    // Fallback to regular navigation
    window.location.pathname = path;
  }
};