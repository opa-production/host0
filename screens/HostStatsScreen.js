import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

const hostStats = {
  rating: 4.86,
  responseRate: 98,
  acceptanceRate: 99,
  avgResponseTime: '5 min',
  totalTrips: 42,
  repeatGuests: 64,
  cancellations: 0.8,
  memberSince: 'Feb 2024',
};

const trendHighlights = [
  { label: 'Week', change: '+6%', detail: 'Booking requests' },
  { label: 'Month', change: '+12%', detail: 'Earned revenue' },
  { label: 'Quarter', change: '+3%', detail: '5-star reviews' },
];

const qualitySignals = [
  { icon: 'chatbubbles-outline', label: 'Response rate', value: `${hostStats.responseRate}%`, caption: 'Last 30 days' },
  { icon: 'thumbs-up-outline', label: 'Acceptance rate', value: `${hostStats.acceptanceRate}%`, caption: 'Trips accepted' },
  { icon: 'hourglass-outline', label: 'Avg response time', value: hostStats.avgResponseTime, caption: 'New inquiries' },
];

export default function HostStatsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1B1B1F', '#2E2E33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Host stats</Text>
              <Text style={styles.heroTitle}>4.86</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFD166" />
                <Text style={styles.ratingLabel}>Average rating</Text>
              </View>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeLabel}>Member since</Text>
              <Text style={styles.heroBadgeValue}>{hostStats.memberSince}</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            Guests consistently highlight your clean rides, punctuality, and quick responses.
          </Text>
        </LinearGradient>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quality signals</Text>
          <View style={styles.signalList}>
            {qualitySignals.map((signal) => (
              <View key={signal.label} style={styles.signalItem}>
                <View style={styles.signalIconWrapper}>
                  <Ionicons name={signal.icon} size={20} color="#1D1D1D" />
                </View>
                <View style={styles.signalText}>
                  <Text style={styles.signalLabel}>{signal.label}</Text>
                  <Text style={styles.signalValue}>{signal.value}</Text>
                  <Text style={styles.signalCaption}>{signal.caption}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Performance snapshots</Text>
          <View style={styles.snapshotsList}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Trips hosted</Text>
              <Text style={styles.snapshotValue}>{hostStats.totalTrips}</Text>
              <Text style={styles.snapshotCaption}>Completed rides</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Repeat guests</Text>
              <Text style={styles.snapshotValue}>{hostStats.repeatGuests}%</Text>
              <Text style={styles.snapshotCaption}>Returning riders</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Cancellations</Text>
              <Text style={styles.snapshotValue}>{hostStats.cancellations}%</Text>
              <Text style={styles.snapshotCaption}>Last quarter</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Momentum</Text>
          <View style={styles.momentumList}>
            {trendHighlights.map((trend) => (
              <View key={trend.label} style={styles.momentumItem}>
                <Text style={styles.momentumLabel}>{trend.label}</Text>
                <Text style={styles.momentumChange}>{trend.change}</Text>
                <Text style={styles.momentumCaption}>{trend.detail}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingTop: SPACING.xl * 2,
    paddingBottom: SPACING.xl * 2,
    gap: SPACING.l,
  },
  heroCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.m,
  },
  heroEyebrow: {
    ...TYPE.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  heroTitle: {
    ...TYPE.largeTitle,
    fontSize: 46,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingLabel: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    alignItems: 'flex-start',
  },
  heroBadgeLabel: {
    ...TYPE.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  heroBadgeValue: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },
  heroSubtitle: {
    ...TYPE.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    gap: SPACING.m,
  },
  sectionTitle: {
    ...TYPE.section,
    color: '#1D1D1D',
  },
  signalList: {
    gap: SPACING.m,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    paddingVertical: SPACING.s,
  },
  signalIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalText: {
    flex: 1,
  },
  signalLabel: {
    ...TYPE.caption,
    color: '#1D1D1D',
    opacity: 0.6,
    marginBottom: 2,
  },
  signalValue: {
    ...TYPE.bodyStrong,
    fontSize: 18,
    color: '#1D1D1D',
    marginBottom: 2,
  },
  signalCaption: {
    ...TYPE.micro,
    color: '#1D1D1D',
    opacity: 0.5,
  },
  snapshotsList: {
    gap: SPACING.m,
  },
  snapshotItem: {
    paddingVertical: SPACING.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  snapshotLabel: {
    ...TYPE.caption,
    color: '#1D1D1D',
    opacity: 0.6,
    marginBottom: 4,
  },
  snapshotValue: {
    ...TYPE.title,
    fontSize: 22,
    color: '#1D1D1D',
    marginBottom: 4,
  },
  snapshotCaption: {
    ...TYPE.micro,
    color: '#1D1D1D',
    opacity: 0.5,
  },
  momentumList: {
    gap: SPACING.m,
  },
  momentumItem: {
    paddingVertical: SPACING.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  momentumLabel: {
    ...TYPE.caption,
    color: '#1D1D1D',
    opacity: 0.6,
    marginBottom: 6,
  },
  momentumChange: {
    ...TYPE.title,
    fontSize: 24,
    color: '#1D1D1D',
    marginBottom: 2,
  },
  momentumCaption: {
    ...TYPE.micro,
    color: '#1D1D1D',
    opacity: 0.5,
  },
});