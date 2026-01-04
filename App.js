import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './navigation/AppNavigator';
import OfflineScreen from './screens/OfflineScreen';
import { HostProvider } from './utils/HostContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Load Nunito fonts
  const [loaded, error] = useFonts({
    'Nunito-Regular': require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
  });

  // Network connectivity listener
  useEffect(() => {
    // Check initial network state
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && (state.isInternetReachable !== false);
      setIsConnected(connected);
    });

    // Also check immediately
    NetInfo.fetch().then(state => {
      const connected = state.isConnected && (state.isInternetReachable !== false);
      setIsConnected(connected);
    });

    return () => {
      unsubscribe();
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
  );
}
