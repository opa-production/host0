import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './navigation/AppNavigator';
import OfflineScreen from './screens/OfflineScreen';
import { HostProvider } from './utils/HostContext';
import ErrorBoundary from './utils/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const disconnectTimerRef = useRef(null);

  // Load Nunito fonts
  const [loaded, error] = useFonts({
    'Nunito-Regular': require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
  });

  // Network connectivity listener — debounce "offline" so brief blips when resuming the app do not unmount the whole navigator
  useEffect(() => {
    const DISCONNECT_DELAY_MS = 2000;

    const applyConnectivity = (connected) => {
      if (connected) {
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
        setIsConnected(true);
        return;
      }
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
      }
      disconnectTimerRef.current = setTimeout(() => {
        setIsConnected(false);
        disconnectTimerRef.current = null;
      }, DISCONNECT_DELAY_MS);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && (state.isInternetReachable !== false);
      applyConnectivity(connected);
    });

    NetInfo.fetch().then((state) => {
      const connected = state.isConnected && (state.isInternetReachable !== false);
      applyConnectivity(connected);
    });

    return () => {
      unsubscribe();
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (error) {
      console.log('Font loading error:', error);
    }
    
    if (loaded) {
      console.log('✅ Nunito fonts loaded successfully!');
      setFontsLoaded(true);
      SplashScreen.hideAsync();
    } else {
      console.log('⏳ Loading Nunito fonts...');
    }
  }, [loaded, error]);

  const handleRetry = () => {
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && (state.isInternetReachable !== false);
      setIsConnected(connected);
    });
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <HostProvider>
          {/* Show offline screen when not connected */}
          {!isConnected ? (
            <OfflineScreen onRetry={handleRetry} />
          ) : (
            <AppNavigator />
          )}
        </HostProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
