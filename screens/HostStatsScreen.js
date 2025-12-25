import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

// Mock data - Replace with actual API data
const statsData = {
  totalCars: 5,
  totalRentals: 87,
  bestPerformingCar: {
    name: 'BMW M3',
    model: '2023 G80',
  },
  averageRating: 4.86,
  responseRate: 98,
  hostAccountPlan: 'Premium',
  membershipPeriod: 'Feb 2024',
};

export default function HostStatsScreen({ navigation }) {
  const StatRow = ({ label, value, icon }) => (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        {icon && <Ionicons name={icon} size={20} color={COLORS.subtle} style={styles.statIcon} />}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Host Stats</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.statsContainer}>
          <StatRow 
            label="Total Cars" 
            value={statsData.totalCars.toString()} 
            icon="car-outline" 
          />
          <View style={styles.divider} />
          <StatRow 
            label="Rentals" 
            value={statsData.totalRentals.toString()} 
            icon="calendar-outline" 
          />
          <View style={styles.divider} />
          <StatRow 
            label="Best Performing" 
            value={`${statsData.bestPerformingCar.name} ${statsData.bestPerformingCar.model}`} 
            icon="trophy-outline" 
          />
          <View style={styles.divider} />
          <StatRow 
            label="Rating" 
            value={statsData.averageRating.toString()} 
            icon="star-outline" 
          />
          <View style={styles.divider} />
          <StatRow 
            label="Response Rate" 
            value={`${statsData.responseRate}%`} 
            icon="chatbubble-outline" 
          />
          <View style={styles.divider} />
          <StatRow 
            label="Host Account Plan" 
            value={statsData.hostAccountPlan} 
            icon="card-outline" 
          />
          <View style={styles.divider} />
          <StatRow 
            label="Membership Period" 
            value={statsData.membershipPeriod} 
            icon="wallet-outline" 
          />
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
  content: {
    padding: SPACING.l,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 20,
  },
  statsContainer: {
    backgroundColor: 'transparent',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.l,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginRight: SPACING.m,
  },
  statLabel: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  statValue: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.l,
  },
});
