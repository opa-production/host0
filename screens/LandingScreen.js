import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import LandingIllustration from '../assets/icons/landing.svg';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.hero}>
        <LandingIllustration width={260} height={210} />
        <Text style={styles.title}>Opa Host</Text>
        <Text style={styles.tagline}>Keep your fleet safe and your schedule full</Text>
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
    justifyContent: 'center',
    paddingTop: 30,
  },
  title: {
    ...TYPE.largeTitle,
    marginTop: 18,
  },
  tagline: {
    ...TYPE.body,
    color: COLORS.subtle,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
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
