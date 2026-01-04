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

  // Initialize: Check for existing auth session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getUserToken();
        
        if (token) {
          // Verify token is still valid by fetching current profile
          const result = await getCurrentHost();
          
          if (result.success) {
            setHost(result.host);
            setIsAuthenticated(true);
            // Store profile locally
            await setUserProfile(result.host);
          } else {
            // Token expired or invalid
            await clearUserData();
            setHost(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
      const result = await getCurrentHost();
      
      if (result.success) {
        setHost(result.host);
        await setUserProfile(result.host);
        return { success: true };
      } else {
        return { success: false, error: result.error };
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
