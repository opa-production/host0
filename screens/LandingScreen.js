import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import LandingIllustration from '../assets/icons/landing.svg';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.hero}>
        <View style={styles.brandSection}>
          <Text style={styles.appName}>Ardena</Text>
          <Text style={styles.appSubtitle}>Host</Text>
        </View>
        
        <LandingIllustration width={280} height={220} />
        
        <View style={styles.textSection}>
          {/* <Text style={styles.tagline}>Idle cars don't pay bills</Text> */}
          <Text style={styles.subtitle}>Turn your parked car into a revenue stream. Start hosting today.</Text>
        </View>
      </View>

      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('SignUp')} activeOpacity={1}>
          <Text style={styles.primaryButtonText} numberOfLines={1}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')} activeOpacity={1}>
          <Text style={styles.secondaryButtonText} numberOfLines={1}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.l,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingTop: 60,
    paddingBottom: 20,
  },
  brandSection: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontFamily: 'Nunito-Bold',
    color: COLORS.brand,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
    letterSpacing: 4,
    marginTop: -4,
    opacity: 0.7,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tagline: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaSection: {
    paddingBottom: 40,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButtonText: {
    ...TYPE.section,
    color: '#ffffff',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButtonText: {
    ...TYPE.section,
    color: COLORS.text,
    textAlign: 'center',
  },
});
