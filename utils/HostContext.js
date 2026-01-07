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

  // Initialize: Check for existing auth session (bypassed for development)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Bypass authentication - check for locally stored profile only
        const storedProfile = await getUserProfile();
        
        if (storedProfile) {
          setHost(storedProfile);
          setIsAuthenticated(true);
        } else {
          // No stored profile, user needs to login
          setHost(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
      // Bypass API call - just return stored profile
      const storedProfile = await getUserProfile();
      
      if (storedProfile) {
        setHost(storedProfile);
        return { success: true };
      } else {
        return { success: false, error: 'No profile found' };
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
