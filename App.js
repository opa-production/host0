import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './navigation/AppNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load Nunito fonts
  const [loaded, error] = useFonts({
    'Nunito-Regular': require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
  });

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

  if (!fontsLoaded) {
    return null;
  }

  return <AppNavigator />;
}
