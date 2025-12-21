import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Mock Data - Replace with actual API data
  const userName = 'Deon';
  
  const operationsData = {
    activeRentals: 8,
    pickups: 3,
    returns: 2,
    pendingRequests: 4,
  };

  const financialData = {
    currentEarnings: 4250,
    previousEarnings: 3800,
    utilization: 82,
    nextPayout: { amount: 1250, date: 'Friday' }
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const SkeletonBox = ({ width, height, style }) => {
    const [pulseAnim] = useState(new Animated.Value(0.3));

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, []);

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            backgroundColor: '#E5E5EA',
            borderRadius: 8,
            opacity: pulseAnim,
          },
          style,
        ]}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 20 }}>
            <SkeletonBox width={150} height={20} style={{ marginBottom: 8 }} />
            <SkeletonBox width={250} height={40} style={{ marginBottom: 32 }} />
            <SkeletonBox width="100%" height={200} style={{ marginBottom: 24, borderRadius: 16 }} />
            <SkeletonBox width="100%" height={200} style={{ marginBottom: 24, borderRadius: 16 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Host')} // Assuming Host profile is here
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 1: Daily Operations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Operations</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridContainer}>
            {/* Active Rentals */}
            <View style={styles.gridItem}>
              <View style={styles.iconBadge}>
                <Ionicons name="car-outline" size={22} color={styles.iconMono.color} />
              </View>
              <Text style={styles.gridValue}>{operationsData.activeRentals}</Text>
              <Text style={styles.gridLabel}>Rentals</Text>
            </View>

            {/* Today's Pickups */}
            <View style={styles.gridItem}>
              <View style={styles.iconBadge}>
                <Ionicons name="key-outline" size={22} color={styles.iconMono.color} />
              </View>
              <Text style={styles.gridValue}>{operationsData.pickups}</Text>
              <Text style={styles.gridLabel}>Pickups</Text>
            </View>

            {/* Today's Returns */}
            <View style={styles.gridItem}>
              <View style={styles.iconBadge}>
                <Ionicons name="return-down-back-outline" size={22} color={styles.iconMono.color} />
              </View>
              <Text style={styles.gridValue}>{operationsData.returns}</Text>
              <Text style={styles.gridLabel}>Returns</Text>
            </View>

            {/* Pending Requests */}
            <View style={styles.gridItem}>
              <View style={styles.iconBadge}>
                <Ionicons name="time-outline" size={22} color={styles.iconMono.color} />
              </View>
              <Text style={styles.gridValue}>{operationsData.pendingRequests}</Text>
              <Text style={styles.gridLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Financial Performance */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Performance & Analytics</Text>
            <TouchableOpacity>
              <Ionicons name="arrow-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Earnings Summary */}
          <View style={styles.earningsSection}>
            <Text style={styles.sectionLabel}>Earnings Summary</Text>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsValue}>{formatCurrency(financialData.currentEarnings)}</Text>
              <View style={styles.trendBadge}>
                <Ionicons name="trending-up" size={14} color="#34C759" />
                <Text style={styles.trendText}>+12% vs last mo</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Utilization Rate */}
          <View style={styles.utilizationSection}>
            <View style={styles.utilizationHeader}>
              <Text style={styles.sectionLabel}>Utilization Rate</Text>
              <Text style={styles.utilizationValue}>{financialData.utilization}%</Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${financialData.utilization}%` }]} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Payout Status */}
          <View style={styles.payoutContainer}>
            <View style={styles.payoutIcon}>
              <Ionicons name="cash-outline" size={20} color="#007AFF" />
            </View>
            <Text style={styles.payoutText}>
              Next payout of <Text style={styles.payoutAmount}>{formatCurrency(financialData.nextPayout.amount)}</Text> scheduled for {financialData.nextPayout.date}.
            </Text>
          </View>
        </View>

      </ScrollView>
    </Animated.View>
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
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    letterSpacing: 0.35,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    ...TYPE.section,
  },
  // Grid Styles for Operations Card
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '23%',
    backgroundColor: '#F9F9F9', // Subtle background for items
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 0,
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#F2F2F7',
  },
  iconMono: {
    color: '#1C1C1E',
  },
  gridValue: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
    textAlign: 'center',
  },
  // Financial Card Styles
  earningsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsValue: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: '#34C759',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  utilizationSection: {
    marginBottom: 8,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationValue: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  payoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  payoutIcon: {
    marginRight: 12,
  },
  payoutText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
    lineHeight: 20,
  },
  payoutAmount: {
    fontFamily: 'Nunito-Bold',
    color: '#007AFF',
  },
});
