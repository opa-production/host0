import { clearUserData } from './userStorage';

// Global logout handler that can be called from anywhere
// This will be set by HostContext
let globalLogoutHandler = null;

/**
 * Set the global logout handler (called by HostContext)
 * @param {Function} handler - The logout function from HostContext
 */
export const setLogoutHandler = (handler) => {
  globalLogoutHandler = handler;
};

/**
 * Handle token expiration - clear data and trigger logout
 * This should be called whenever a 401 error is detected
 */
export const handleTokenExpiration = async () => {
  try {
    console.log('🔐 [Token Expiration] Handling token expiration...');
    
    // Clear all user data from storage
    await clearUserData();
    
    // Trigger logout in HostContext (which will update isAuthenticated state)
    if (globalLogoutHandler) {
      await globalLogoutHandler();
      console.log('🔐 [Token Expiration] Logout triggered successfully');
    } else {
      console.warn('🔐 [Token Expiration] No logout handler set - HostContext may not be initialized');
    }
  } catch (error) {
    console.error('🔐 [Token Expiration] Error during logout:', error);
  }
};
