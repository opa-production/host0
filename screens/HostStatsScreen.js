import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const ANALYTICS_URL = 'https://analytics.ardena.co.ke';

export default function HostStatsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const openDashboard = async () => {
    lightHaptic();
    try {
      await Linking.openURL(ANALYTICS_URL);
    } catch {
      Alert.alert('Unable to open', 'Could not open the analytics dashboard. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { lightHaptic(); navigation.goBack(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Your analytics dashboard</Text>
        <Text style={styles.subtitle}>
          Detailed insights into your fleet performance, earnings, booking trends, and more are available on the Ardena analytics web dashboard.
        </Text>

        <View style={styles.featureList}>
          {[
            'Booking trends & occupancy rates',
            'Earnings breakdown by car',
            'Client ratings and reviews',
            'Fleet performance over time',
          ].map((item) => (
            <View style={styles.featureRow} key={item}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.brand} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={openDashboard} activeOpacity={0.9}>
          <Text style={styles.ctaText}>Proceed to dashboard</Text>
          <Ionicons name="open-outline" size={18} color="#FFFFFF" />
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
    paddingBottom: 8,
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
  body: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
    maxWidth: 320,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    paddingVertical: 8,
    paddingHorizontal: SPACING.m,
    marginBottom: 32,
    gap: 14,
    paddingTop: 16,
    paddingBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  ctaText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
