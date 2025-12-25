import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

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

  const SkeletonBox = ({ width, height, style }) => (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#E5E5EA',
          borderRadius: 8,
        },
        style,
      ]}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 20 }}>
            <SkeletonBox width={150} height={14} style={{ marginBottom: 10, borderRadius: 6 }} />
            <SkeletonBox width={200} height={34} style={{ marginBottom: 24, borderRadius: 10 }} />

            <View style={[styles.skeletonCard, { paddingBottom: 12 }]}>
              <View style={styles.cardHeader}>
                <SkeletonBox width={160} height={16} style={{ borderRadius: 8 }} />
                <SkeletonBox width={26} height={16} style={{ borderRadius: 8 }} />
              </View>
              <View style={{ paddingTop: 8 }}>
                <View style={styles.skelRow}>
                  <SkeletonBox width={120} height={12} style={{ borderRadius: 8 }} />
                  <SkeletonBox width={36} height={12} style={{ borderRadius: 8 }} />
                </View>
                <View style={styles.opsDivider} />
                <View style={styles.skelRow}>
                  <SkeletonBox width={120} height={12} style={{ borderRadius: 8 }} />
                  <SkeletonBox width={36} height={12} style={{ borderRadius: 8 }} />
                </View>
                <View style={styles.opsDivider} />
                <View style={styles.skelRow}>
                  <SkeletonBox width={120} height={12} style={{ borderRadius: 8 }} />
                  <SkeletonBox width={36} height={12} style={{ borderRadius: 8 }} />
                </View>
                <View style={styles.opsDivider} />
                <View style={styles.skelRow}>
                  <SkeletonBox width={120} height={12} style={{ borderRadius: 8 }} />
                  <SkeletonBox width={36} height={12} style={{ borderRadius: 8 }} />
                </View>
              </View>
            </View>

            <View style={[styles.skeletonCard, { marginTop: 24 }]}>
              <View style={styles.cardHeader}>
                <SkeletonBox width={180} height={16} style={{ borderRadius: 8 }} />
                <SkeletonBox width={22} height={16} style={{ borderRadius: 8 }} />
              </View>
              <View style={{ marginTop: 8 }}>
                <View style={styles.skelRow}>
                  <SkeletonBox width={110} height={12} style={{ borderRadius: 8 }} />
                  <SkeletonBox width={90} height={12} style={{ borderRadius: 8 }} />
                </View>
                <View style={styles.metricsDivider} />
                <View style={styles.skelRow}>
                  <SkeletonBox width={110} height={12} style={{ borderRadius: 8 }} />
                  <SkeletonBox width={90} height={12} style={{ borderRadius: 8 }} />
                </View>
              </View>
            </View>

            <View style={[styles.skeletonCard, { marginTop: 24 }]}
            >
              <View style={styles.cardHeader}>
                <SkeletonBox width={150} height={16} style={{ borderRadius: 8 }} />
                <SkeletonBox width={22} height={16} style={{ borderRadius: 8 }} />
              </View>
              <View style={{ marginTop: 10 }}>
                <SkeletonBox width={220} height={12} style={{ borderRadius: 8 }} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return `KSh ${numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const pendingAmount = Math.max(0, (Number(financialData.currentEarnings) || 0) - (Number(financialData.nextPayout.amount) || 0));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <Animated.View style={{ opacity: fadeAnim }}>
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
              style={styles.headerIconButton}
              onPress={() => {
                lightHaptic();
                navigation.navigate('SmartCalendar');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-number-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Performance */}
        <View style={styles.financeCard}>
          <Text style={styles.financeCardTitle}>Financial Performance</Text>

          <Text style={styles.finHeadline}>
            This month {formatCurrency(financialData.currentEarnings)} earned
          </Text>

          <View style={styles.metricsRow}>
            <Text style={styles.financeMetricsLabel}>Withdrawable</Text>
            <Text style={styles.financeMetricsValue}>{formatCurrency(financialData.nextPayout.amount)}</Text>
          </View>

          <View style={styles.financeMetricsDivider} />

          <View style={styles.metricsRow}>
            <Text style={styles.financeMetricsLabel}>Pending</Text>
            <Text style={styles.financeMetricsValue}>{formatCurrency(pendingAmount)}</Text>
          </View>

          <TouchableOpacity 
            style={styles.withdrawButton}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Withdraw', { withdrawable: financialData.nextPayout.amount });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Actions</Text>
          
          <View style={styles.opsRow}>
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotBlue]} />
              <Text style={styles.opsLabel}>Today's Pickups</Text>
            </View>
            <Text style={styles.opsValue}>{operationsData.pickups}</Text>
          </View>

          <View style={styles.opsDivider} />

          <View style={styles.opsRow}>
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotGreen]} />
              <Text style={styles.opsLabel}>Car Returns</Text>
            </View>
            <Text style={styles.opsValue}>{operationsData.returns}</Text>
          </View>

          <View style={styles.opsDivider} />

          <View style={styles.opsRow}>
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotOrange]} />
              <Text style={styles.opsLabel}>Active Rentals</Text>
            </View>
            <Text style={styles.opsValue}>{operationsData.activeRentals}</Text>
          </View>

          <View style={styles.opsDivider} />

          <View style={styles.opsRow}>
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotRed]} />
              <Text style={styles.opsLabel}>Pending Requests</Text>
            </View>
            <Text style={styles.opsValue}>{operationsData.pendingRequests}</Text>
          </View>
        </View>

        </ScrollView>
      </Animated.View>
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
  headerIconButton: {
    padding: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: 24,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: 24,
  },
  cardTitle: {
    ...TYPE.section,
    marginBottom: 20,
  },
  // Daily Operations
  opsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  opsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionDotBlue: {
    backgroundColor: COLORS.brand,
  },
  actionDotGreen: {
    backgroundColor: '#34C759',
  },
  actionDotOrange: {
    backgroundColor: '#FF9500',
  },
  actionDotRed: {
    backgroundColor: '#FF3B30',
  },
  opsLabel: {
    ...TYPE.bodyStrong,
    fontSize: 13,
  },
  opsValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
  },
  opsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  iconMono: {
    color: '#1C1C1E',
  },
  // Financial Card Styles
  financeCard: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: 24,
  },
  financeCardTitle: {
    ...TYPE.section,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  metricsLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  metricsValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
  },
  metricsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  financeMetricsLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  financeMetricsValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FFFFFF',
  },
  financeMetricsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  finHeadline: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  withdrawButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.m,
  },
  withdrawButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
  },
  skelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
