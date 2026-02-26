import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function ArdenaForBusinessComingSoonScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ardena for Business</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={64} color={COLORS.subtle} />
        </View>
        <Text style={styles.title}>Coming soon</Text>
        <Text style={styles.message}>
          Ardena for Business will be available soon. We’re putting the finishing touches on fleet tools, reduced commission, and corporate branding.
        </Text>
        <Text style={styles.subtext}>Check back later or contact support to join the waitlist.</Text>

        <TouchableOpacity
          style={styles.backCta}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.backCtaText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 48,
    alignItems: 'center',
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  message: {
    ...TYPE.body,
    fontSize: 16,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.m,
  },
  subtext: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  backCta: {
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  backCtaText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
