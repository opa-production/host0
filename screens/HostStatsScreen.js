import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

// Mock data - Replace with actual API data
const statsData = {
  totalCars: 5,
  totalRentals: 87,
  bestPerformingCar: {
    name: 'BMW M3',
    model: '2023 G80',
    totalBookings: 42,
    earnings: 630000,
  },
  averageRating: 4.86,
  totalReviews: 38,
  responseRate: 98,
  memberSince: 'Feb 2024',
};

export default function HostStatsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const formatCurrency = (amount) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header with Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Host Stats</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Stats Bar */}
        <View style={styles.topStatsBar}>
          <View style={styles.topStatItem}>
            <Text style={styles.topStatValue}>{statsData.totalCars}</Text>
            <Text style={styles.topStatLabel}>Total Cars</Text>
          </View>
          <View style={styles.topStatDivider} />
          <View style={styles.topStatItem}>
            <Text style={styles.topStatValue}>{statsData.totalRentals}</Text>
            <Text style={styles.topStatLabel}>Rentals</Text>
          </View>
          <View style={styles.topStatDivider} />
          <View style={styles.topStatItem}>
            <Text style={styles.topStatCarName} numberOfLines={1}>
              {statsData.bestPerformingCar.name}
            </Text>
            <Text style={styles.topStatLabel}>Best Performing</Text>
          </View>
        </View>

        {/* Best Performing Car Details */}
        <View style={styles.bestCarCard}>
          <View style={styles.bestCarHeader}>
            <View>
              <Text style={styles.bestCarTitle}>Best Performing Car</Text>
              <Text style={styles.bestCarSubtitle}>
                {statsData.bestPerformingCar.name} {statsData.bestPerformingCar.model}
              </Text>
            </View>
          </View>
          <View style={styles.bestCarStats}>
            <View style={styles.bestCarStatItem}>
              <Text style={styles.bestCarStatValue}>
                {statsData.bestPerformingCar.totalBookings}
              </Text>
              <Text style={styles.bestCarStatLabel}>Bookings</Text>
            </View>
            <View style={styles.bestCarStatItem}>
              <Text style={styles.bestCarStatValue}>
                {formatCurrency(statsData.bestPerformingCar.earnings)}
              </Text>
              <Text style={styles.bestCarStatLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Rating Card */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeader}>
            <Ionicons name="star" size={24} color="#FFD166" />
            <View style={styles.ratingContent}>
              <Text style={styles.ratingValue}>{statsData.averageRating}</Text>
              <Text style={styles.ratingLabel}>Average Rating</Text>
            </View>
          </View>
          <Text style={styles.ratingSubtext}>
            Based on {statsData.totalReviews} reviews
          </Text>
        </View>

        {/* Performance Metric */}
        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>Response Rate</Text>
            <Text style={styles.performanceValue}>{statsData.responseRate}%</Text>
          </View>
          <Text style={styles.performanceSubtext}>
            Percentage of messages answered within 24 hours
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${statsData.responseRate}%` }]} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.title,
    fontSize: 20,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.l,
    gap: SPACING.l,
  },
  topStatsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
  },
  topStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  topStatValue: {
    ...TYPE.title,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 4,
  },
  topStatCarName: {
    ...TYPE.title,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  topStatLabel: {
    ...TYPE.caption,
    color: COLORS.subtle,
    textAlign: 'center',
  },
  topStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.borderStrong,
    marginHorizontal: SPACING.m,
  },
  bestCarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  bestCarHeader: {
    marginBottom: SPACING.m,
  },
  bestCarTitle: {
    ...TYPE.section,
    color: COLORS.text,
    marginBottom: 4,
  },
  bestCarSubtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  bestCarStats: {
    flexDirection: 'row',
    gap: SPACING.l,
  },
  bestCarStatItem: {
    flex: 1,
  },
  bestCarStatValue: {
    ...TYPE.title,
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 4,
  },
  bestCarStatLabel: {
    ...TYPE.caption,
    color: COLORS.subtle,
  },
  ratingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.s,
  },
  ratingContent: {
    flex: 1,
  },
  ratingValue: {
    ...TYPE.largeTitle,
    fontSize: 32,
    color: COLORS.text,
    marginBottom: 2,
  },
  ratingLabel: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  ratingSubtext: {
    ...TYPE.caption,
    color: COLORS.subtle,
  },
  performanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  performanceTitle: {
    ...TYPE.section,
    color: COLORS.text,
  },
  performanceValue: {
    ...TYPE.title,
    fontSize: 24,
    color: COLORS.brand,
  },
  performanceSubtext: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginBottom: SPACING.m,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: 4,
  },
});
