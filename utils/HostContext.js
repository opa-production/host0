import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentHost } from '../services/authService';
import { getUserToken, clearUserData, setUserProfile, getUserProfile, getUserId } from './userStorage';
import { markNewSession, resetScreenDataCaches } from './screenDataCache';
import { registerPushToken, unregisterPushToken } from './pushNotifications';
import { fetchHostAvatarFromSupabase } from '../services/mediaService';
import { setLogoutHandler } from './logoutHandler';

const HostContext = createContext();

export const useHost = () => {
  const context = useContext(HostContext);
  if (!context) {
    throw new Error('useHost must be used within a HostProvider');
  }
  return context;
};

export const HostProvider = ({ children }) => {
  const [host, setHost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State Watchdog: Monitor and correct stuck states
  const loadingStartTimeRef = useRef(null);
  
  useEffect(() => {
    let watchdogInterval = null;
    const MAX_LOADING_TIME = 15000; // 15 seconds - force stop loading after this

    const startWatchdog = () => {
      // Track loading start time
      if (isLoading && !loadingStartTimeRef.current) {
        loadingStartTimeRef.current = Date.now();
      } else if (!isLoading) {
        loadingStartTimeRef.current = null;
      }

      // If loading for too long, force stop (prevents infinite loading)
      if (isLoading && loadingStartTimeRef.current) {
        const loadingDuration = Date.now() - loadingStartTimeRef.current;
        if (loadingDuration > MAX_LOADING_TIME) {
          console.warn('🛡️ [StateWatchdog] Loading state stuck for', loadingDuration, 'ms - forcing stop');
          setIsLoading(false);
          loadingStartTimeRef.current = null;
        }
      }
    };

    // Run watchdog every 3 seconds
    watchdogInterval = setInterval(startWatchdog, 3000);
    startWatchdog(); // Run immediately

    return () => {
      if (watchdogInterval) {
        clearInterval(watchdogInterval);
      }
    };
  }, [isLoading]);

  // Initialize: Check for existing auth session and verify with backend
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const initializeAuth = async () => {
      try {
        // Check if we have a token
        const token = await getUserToken();
        
        if (!token) {
          // No token, user needs to login
          if (isMounted) {
            setHost(null);
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        // Verify token with backend by calling /api/v1/host/me
        // Add timeout to prevent hanging if API is slow/unreachable
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
        });

        const result = await Promise.race([
          getCurrentHost(),
          timeoutPromise,
        ]);

        // Clear timeout since promise resolved
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        if (result.success && result.host) {
          // Token is valid, set authenticated user
          // Fetch avatar from Supabase Storage (backend doesn't store avatar_url)
          const userId = await getUserId();
          const avatarUrl = userId ? await fetchHostAvatarFromSupabase(userId) : null;
          
          if (!isMounted) return; // Component unmounted, don't update state
          
          const hostWithAvatar = {
            ...result.host,
            avatar_url: avatarUrl,
          };
          
          setHost(hostWithAvatar);
          setIsAuthenticated(true);
          // Update stored profile with latest data from backend (including avatar from Supabase)
          await setUserProfile(hostWithAvatar);
        } else {
          // Token is invalid or expired, clear local data
          console.log('Token verification failed, clearing local data');
          await clearUserData();
          setHost(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Clear timeout if it's still pending
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!isMounted) return; // Component unmounted, don't update state

        // On timeout or network error, handle gracefully (server may not be ready)
        // Don't show error to users - these are expected scenarios
        if (error.message === 'Request timeout' || error.message.includes('Network request failed')) {
          // Silently handle timeout/network errors - try to use cached profile
          const cachedProfile = await getUserProfile();
          if (!isMounted) return; // Component unmounted, don't update state
          if (cachedProfile) {
            setHost(cachedProfile);
            setIsAuthenticated(true);
          } else {
            setHost(null);
            setIsAuthenticated(false);
          }
        } else {
          // For other unexpected errors, log in development only
          if (__DEV__) {
            console.warn('Auth initialization error:', error.message);
          }
          // Clear local data for unexpected errors
          await clearUserData();
          setHost(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const login = async (hostData) => {
    /**
     * Mark a new session: wipes all in-memory caches and arms the 60-second
     * fresh-login window so subsequent sensitive API calls add Cache-Control:
     * no-cache, bypassing backend Redis for the first round of requests.
     */
    markNewSession();
    setHost(hostData);
    setIsAuthenticated(true);
    // Store profile locally
    await setUserProfile(hostData);
    // Register push token with backend (non-blocking, errors are swallowed)
    registerPushToken();
  };

  const logout = async () => {
    // Grab the token before clearing storage so the DELETE request can auth.
    const authToken = await getUserToken();
    // Unregister push token from backend (non-blocking, errors are swallowed)
    unregisterPushToken(authToken);
    setHost(null);
    setIsAuthenticated(false);
    resetScreenDataCaches();
    // Clear all storage
    await clearUserData();
  };

  // Register logout handler so it can be called from services
  useEffect(() => {
    setLogoutHandler(logout);
    return () => {
      setLogoutHandler(null);
    };
  }, []);

  const updateHost = async (updates) => {
    const updatedHost = { ...host, ...updates };
    setHost(updatedHost);
    // Update stored profile
    await setUserProfile(updatedHost);
  };

  const refreshProfile = async () => {
    try {
      // Call backend API to get current host profile
      const result = await getCurrentHost();
      
      if (result.success && result.host) {
        // Fetch avatar from Supabase Storage (backend doesn't store avatar_url)
        const userId = await getUserId();
        const avatarUrl = userId ? await fetchHostAvatarFromSupabase(userId) : null;
        
        const updatedHost = {
          ...result.host,
          avatar_url: avatarUrl,
        };
        
        setHost(updatedHost);
        // Update stored profile with latest data from backend (including avatar from Supabase)
        await setUserProfile(updatedHost);
        return { success: true };
      } else {
        // If API call fails, check if it's an auth error
        if (result.error && result.error.includes('Session expired')) {
          // Token expired, clear local data and logout
          await clearUserData();
          setHost(null);
          setIsAuthenticated(false);
        }
        return { success: false, error: result.error || 'Failed to refresh profile' };
      }
    } catch (error) {
      console.error('Refresh profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    host,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateHost,
    refreshProfile,
  };

  return (
    <HostContext.Provider value={value}>
      {children}
    </HostContext.Provider>
  );
};
