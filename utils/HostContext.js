import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentHost } from '../services/authService';
import { getUserToken, clearUserData, setUserProfile, getUserProfile } from './userStorage';

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

  // Initialize: Check for existing auth session and verify with backend
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a token
        const token = await getUserToken();
        
        if (!token) {
          // No token, user needs to login
          setHost(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verify token with backend by calling /api/v1/host/me
        const result = await getCurrentHost();
        
        if (result.success && result.host) {
          // Token is valid, set authenticated user
          setHost(result.host);
          setIsAuthenticated(true);
          // Update stored profile with latest data from backend
          await setUserProfile(result.host);
        } else {
          // Token is invalid or expired, clear local data
          console.log('Token verification failed, clearing local data');
          await clearUserData();
          setHost(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // On error, clear local data and require re-login
        await clearUserData();
        setHost(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (hostData) => {
    setHost(hostData);
    setIsAuthenticated(true);
    // Store profile locally
    await setUserProfile(hostData);
  };

  const logout = async () => {
    setHost(null);
    setIsAuthenticated(false);
    // Clear all storage
    await clearUserData();
  };

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
        setHost(result.host);
        // Update stored profile with latest data from backend
        await setUserProfile(result.host);
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
