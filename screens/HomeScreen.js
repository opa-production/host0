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
          
          <View style={styles.opsList}>
            <TouchableOpacity style={styles.opsRow} activeOpacity={0.75}>
              <View style={styles.opsLeft}>
                <Ionicons name="car-sport-outline" size={20} color={styles.iconMono.color} />
                <Text style={styles.opsLabel}>Rentals</Text>
              </View>
              <View style={styles.opsRight}>
                <Text style={styles.opsValue}>{operationsData.activeRentals}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>

            <View style={styles.opsDivider} />

            <TouchableOpacity style={styles.opsRow} activeOpacity={0.75}>
              <View style={styles.opsLeft}>
                <Ionicons name="enter-outline" size={20} color={styles.iconMono.color} />
                <Text style={styles.opsLabel}>Pickups</Text>
              </View>
              <View style={styles.opsRight}>
                <Text style={styles.opsValue}>{operationsData.pickups}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>

            <View style={styles.opsDivider} />

            <TouchableOpacity style={styles.opsRow} activeOpacity={0.75}>
              <View style={styles.opsLeft}>
                <Ionicons name="exit-outline" size={20} color={styles.iconMono.color} />
                <Text style={styles.opsLabel}>Returns</Text>
              </View>
              <View style={styles.opsRight}>
                <Text style={styles.opsValue}>{operationsData.returns}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>

            <View style={styles.opsDivider} />

            <TouchableOpacity style={styles.opsRow} activeOpacity={0.75}>
              <View style={styles.opsLeft}>
                <Ionicons name="hourglass-outline" size={20} color={styles.iconMono.color} />
                <Text style={styles.opsLabel}>Pending</Text>
              </View>
              <View style={styles.opsRight}>
                <Text style={styles.opsValue}>{operationsData.pendingRequests}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
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

          <View style={styles.metricsList}>
            <View style={styles.metricsRow}>
              <Text style={styles.metricsLabel}>Gross income</Text>
              <Text style={styles.metricsValue}>{formatCurrency(financialData.currentEarnings)}</Text>
            </View>

            <View style={styles.metricsDivider} />

            <View style={styles.metricsRow}>
              <Text style={styles.metricsLabel}>Withdrawable</Text>
              <Text style={styles.metricsValue}>{formatCurrency(financialData.nextPayout.amount)}</Text>
            </View>
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
  // Daily Operations (list links)
  opsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  opsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  opsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  opsLabel: {
    ...TYPE.bodyStrong,
    fontSize: 13,
  },
  opsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opsValue: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#1C1C1E',
  },
  opsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 42,
  },
  iconMono: {
    color: '#1C1C1E',
  },
  // Financial Card Styles
  metricsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  metricsLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  metricsValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  metricsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 12,
  },
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
