import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { useHost } from '../utils/HostContext';
import { getHostBookings, isBookingCancelled } from '../services/bookingService';
import { getHostEarningsSummary } from '../services/earningsService';
import { getHostWithdrawals } from '../services/withdrawalService';
import { getHostSubscription } from '../services/subscriptionService';
import { getHidePremiumBadgePreference } from '../utils/userStorage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { host } = useHost();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  
  // Operations data - to be fetched from API
  const [operationsData, setOperationsData] = useState({
    activeRentals: 0,
    pickups: 0,
    returns: 0,
    pendingRequests: 0,
  });

  // Financial data from GET /api/v1/host/earnings/summary
  const [financialData, setFinancialData] = useState({
    total_gross: 0,
    commission_rate: 0.15,
    commission_amount: 0,
    net_earnings: 0,
    withdrawable: 0,
    paid_bookings_count: 0,
  });

  // Sum of amounts for withdrawals with status 'pending' (money not yet deducted)
  const [pendingWithdrawalTotal, setPendingWithdrawalTotal] = useState(0);

  const [showPremiumBadge, setShowPremiumBadge] = useState(false);

  // Get user name from host profile
  const userName = host?.name || host?.full_name || 'Host';

  const refreshSubscriptionBadge = useCallback(async () => {
    try {
      const sub = await getHostSubscription();
      const hideBadge = await getHidePremiumBadgePreference();
      if (sub.success && sub.subscription) {
        const plan = String(sub.subscription.plan || '').toLowerCase();
        const paid = sub.subscription.is_paid_active === true;
        setShowPremiumBadge(paid && plan === 'premium' && !hideBadge);
      } else {
        setShowPremiumBadge(false);
      }
    } catch {
      setShowPremiumBadge(false);
    }
  }, []);

  // Calculate today's actions from bookings
  const calculateTodayActions = (bookings) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let pickups = 0;
    let returns = 0;
    let activeRentals = 0;
    let pendingRequests = 0;

    bookings.forEach((booking) => {
      const status = booking.status?.toLowerCase() || '';
      if (isBookingCancelled(booking)) {
        return;
      }

      // Active Rentals: bookings with status = 'active'
      if (status === 'active') {
        activeRentals++;
      }

      // Pending Requests: bookings with status = 'pending'
      if (status === 'pending') {
        pendingRequests++;
      }

      // Today's Pickups: bookings with start_date = today and status = confirmed/pending/upcoming
      if (booking.start_date) {
        try {
          const startDate = new Date(booking.start_date);
          startDate.setHours(0, 0, 0, 0);
          
          if (startDate.getTime() === today.getTime()) {
            if (status === 'confirmed' || status === 'pending' || status === 'upcoming') {
              pickups++;
            }
          }
        } catch (e) {
          console.error('Error parsing start_date:', e);
        }
      }

      // Car Returns: bookings with end_date = today and status = active
      if (booking.end_date) {
        try {
          const endDate = new Date(booking.end_date);
          endDate.setHours(0, 0, 0, 0);
          
          if (endDate.getTime() === today.getTime() && status === 'active') {
            returns++;
          }
        } catch (e) {
          console.error('Error parsing end_date:', e);
        }
      }
    });

    return {
      pickups,
      returns,
      activeRentals,
      pendingRequests,
    };
  };

  const loadTodayActions = async () => {
    try {
      const result = await getHostBookings();
      if (result.success && result.bookings) {
        const actions = calculateTodayActions(result.bookings);
        setOperationsData(actions);
      } else {
        setOperationsData({
          activeRentals: 0,
          pickups: 0,
          returns: 0,
          pendingRequests: 0,
        });
      }
    } catch (error) {
      console.error('Error loading today\'s actions:', error);
      setOperationsData({
        activeRentals: 0,
        pickups: 0,
        returns: 0,
        pendingRequests: 0,
      });
    }
  };

  const loadEarningsSummary = async () => {
    try {
      const [summaryResult, withdrawalsResult] = await Promise.all([
        getHostEarningsSummary(),
        getHostWithdrawals({ limit: 100 }),
      ]);
      if (summaryResult.success && summaryResult.summary) {
        setFinancialData({
          total_gross: summaryResult.summary.total_gross,
          commission_rate: summaryResult.summary.commission_rate,
          commission_amount: summaryResult.summary.commission_amount,
          net_earnings: summaryResult.summary.net_earnings,
          withdrawable: summaryResult.summary.withdrawable,
          paid_bookings_count: summaryResult.summary.paid_bookings_count,
        });
      }
      if (withdrawalsResult.success && Array.isArray(withdrawalsResult.withdrawals)) {
        const pending = withdrawalsResult.withdrawals
          .filter((w) => (String(w.status || '').toLowerCase() === 'pending'))
          .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
        setPendingWithdrawalTotal(pending);
      } else {
        setPendingWithdrawalTotal(0);
      }
    } catch (error) {
      console.error('Error loading earnings summary:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([loadTodayActions(), loadEarningsSummary()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Refresh wallet/earnings when Home tab is focused (e.g. returning from Finance)
  useFocusEffect(
    useCallback(() => {
      loadEarningsSummary();
      refreshSubscriptionBadge();
    }, [refreshSubscriptionBadge])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 18) return 'Good afternoon 👋';
    return 'Good evening 👋';
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
          contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 20 }}>
            <SkeletonBox width={150} height={14} style={{ marginBottom: 10, borderRadius: 6 }} />
            <SkeletonBox width={200} height={34} style={{ marginBottom: 24, borderRadius: 10 }} />

            {/* Financial Performance Skeleton */}
            <View style={styles.skeletonFinanceCard}>
              <SkeletonBox width={180} height={16} style={{ marginBottom: 20, borderRadius: 8 }} />
              <SkeletonBox width={220} height={24} style={{ marginBottom: 20, borderRadius: 10 }} />
              <View style={styles.skelRow}>
                <SkeletonBox width={110} height={12} style={{ borderRadius: 8 }} />
                <SkeletonBox width={90} height={12} style={{ borderRadius: 8 }} />
              </View>
              <View style={styles.financeMetricsDivider} />
              <View style={styles.skelRow}>
                <SkeletonBox width={110} height={12} style={{ borderRadius: 8 }} />
                <SkeletonBox width={90} height={12} style={{ borderRadius: 8 }} />
              </View>
              <SkeletonBox width="100%" height={48} style={{ marginTop: 16, borderRadius: 16 }} />
            </View>

            {/* Today's Actions Skeleton */}
            <View style={styles.skeletonCard}>
              <SkeletonBox width={140} height={16} style={{ marginBottom: 20, borderRadius: 8 }} />
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
        </ScrollView>
      </View>
    );
  }

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Use same keys as loadEarningsSummary sets (from API: net_earnings, withdrawable, commission_amount)
  const withdrawable = financialData.withdrawable ?? 0;
  const netEarnings = financialData.net_earnings ?? 0;
  const commission = financialData.commission_amount ?? 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{userName}</Text>
              {showPremiumBadge ? (
                <Image
                  source={require('../assets/images/badge.png')}
                  style={styles.homePremiumBadge}
                  resizeMode="contain"
                  accessibilityLabel="Premium host"
                />
              ) : null}
            </View>
          </View>
        </View>

        {/* Financial Performance */}
        <TouchableOpacity 
          style={styles.financeCard}
          onPress={() => {
            lightHaptic();
            navigation.navigate('Finance');
          }}
          activeOpacity={0.95}
        >
          <View style={styles.financeCardHeader}>
            <Text style={styles.financeCardTitle}>Balance</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                lightHaptic();
                setIsBalanceVisible(!isBalanceVisible);
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="rgba(255, 255, 255, 0.8)" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContainer}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Net earnings</Text>
              <Text style={styles.balanceLabelValue}>
                {isBalanceVisible ? `KSh ${formatCurrency(netEarnings)}` : '••••'}
              </Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Commission</Text>
              <Text style={[styles.balanceLabelValue, styles.commissionText]}>
                {isBalanceVisible ? `- KSh ${formatCurrency(commission)}` : '••••'}
              </Text>
            </View>
            <View style={styles.withdrawableContainer}>
              <Text style={styles.withdrawableLabel}>Withdrawable</Text>
              <Text style={styles.withdrawableValue}>
                {isBalanceVisible ? `KSh ${formatCurrency(withdrawable)}` : '••••••'}
              </Text>
            </View>
            {pendingWithdrawalTotal > 0 && (
              <View style={styles.pendingWithdrawalRow}>
                <Text style={styles.pendingWithdrawalLabel}>Pending withdrawal</Text>
                <Text style={styles.pendingWithdrawalValue}>
                  {isBalanceVisible ? `KSh ${formatCurrency(pendingWithdrawalTotal)}` : '••••'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.withdrawButton}
            onPress={(e) => {
              e.stopPropagation();
              lightHaptic();
              navigation.navigate('Withdraw', { withdrawable: financialData.withdrawable });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Today's Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Actions</Text>
          
          <TouchableOpacity 
            style={styles.opsRow}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Bookings');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotBlue]} />
              <Text style={styles.opsLabel}>Today's Pickups</Text>
            </View>
            <View style={styles.opsRight}>
              <Text style={styles.opsValue}>{operationsData.pickups}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
            </View>
          </TouchableOpacity>

          <View style={styles.opsDivider} />

          <TouchableOpacity 
            style={styles.opsRow}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Bookings');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotGreen]} />
              <Text style={styles.opsLabel}>Car Returns</Text>
            </View>
            <View style={styles.opsRight}>
              <Text style={styles.opsValue}>{operationsData.returns}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
            </View>
          </TouchableOpacity>

          <View style={styles.opsDivider} />

          <TouchableOpacity 
            style={styles.opsRow}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Bookings');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotOrange]} />
              <Text style={styles.opsLabel}>Active Rentals</Text>
            </View>
            <View style={styles.opsRight}>
              <Text style={styles.opsValue}>{operationsData.activeRentals}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
            </View>
          </TouchableOpacity>

          <View style={styles.opsDivider} />

          <TouchableOpacity 
            style={styles.opsRow}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Bookings');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.opsLeft}>
              <View style={[styles.actionDot, styles.actionDotRed]} />
              <Text style={styles.opsLabel}>Pending Requests</Text>
            </View>
            <View style={styles.opsRight}>
              <Text style={styles.opsValue}>{operationsData.pendingRequests}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
            </View>
          </TouchableOpacity>
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
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userName: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    letterSpacing: 0.35,
    flexShrink: 1,
  },
  homePremiumBadge: {
    width: 28,
    height: 28,
  },
  headerIconButton: {
    padding: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 6,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  skeletonFinanceCard: {
    backgroundColor: COLORS.text,
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
  opsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  financeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  financeCardTitle: {
    ...TYPE.section,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  balanceContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceLabelValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FFFFFF',
  },
  commissionText: {
    color: '#FF3B30',
  },
  withdrawableContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  withdrawableLabel: {
    ...TYPE.micro,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  withdrawableValue: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  pendingWithdrawalRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 193, 7, 0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingWithdrawalLabel: {
    ...TYPE.micro,
    fontSize: 11,
    color: '#FFC107',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingWithdrawalValue: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFC107',
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
