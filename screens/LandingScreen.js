import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function LandingScreen({ navigation }) {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container}>
      {!imageError ? (
        <ImageBackground 
          source={require('../assets/images/hostbackground.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
          onError={() => {
            console.log('Image failed to load, using fallback');
            setImageError(true);
          }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />
        </ImageBackground>
      ) : (
        <View style={[styles.backgroundImage, styles.fallbackBackground]}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.5, 1]}
            style={styles.gradientOverlay}
          />
        </View>
      )}
      
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('SignUp')} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText} numberOfLines={1}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')} activeOpacity={0.9}>
          <Text style={styles.secondaryButtonText} numberOfLines={1}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fallbackBackground: {
    backgroundColor: COLORS.bg,
  },
  ctaSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.l,
    paddingBottom: 40,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    ...TYPE.section,
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButtonText: {
    ...TYPE.section,
    color: COLORS.text,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
