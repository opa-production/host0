import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostEarningsSummary, getHostEarningsTransactions } from '../services/earningsService';
import { getHostWithdrawals, withdrawalToTransactionItem } from '../services/withdrawalService';

export default function FinanceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);

  // Financial data from GET /api/v1/host/earnings/summary
  const [financialData, setFinancialData] = useState({
    netEarnings: 0,
    commission: 0,
    withdrawable: 0,
    total_gross: 0,
    paid_bookings_count: 0,
  });

  // Transactions from GET /api/v1/host/earnings/transactions
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  // Sum of amounts for withdrawals with status 'pending' (money not yet deducted)
  const [pendingWithdrawalTotal, setPendingWithdrawalTotal] = useState(0);

  const loadEarningsSummary = useCallback(async () => {
    setIsLoadingEarnings(true);
    try {
      const result = await getHostEarningsSummary();
      if (result.success && result.summary) {
        const s = result.summary;
        setFinancialData({
          netEarnings: s.net_earnings ?? 0,
          commission: s.commission_amount ?? 0,
          withdrawable: s.withdrawable ?? 0,
          total_gross: s.total_gross ?? 0,
          paid_bookings_count: s.paid_bookings_count ?? 0,
        });
        // Backend now returns pending_withdrawals_total directly in the summary —
        // no separate withdrawals fetch needed for the balance calculation.
        setPendingWithdrawalTotal(s.pending_withdrawals_total ?? 0);
      }
    } catch (error) {
      console.error('Error loading earnings summary:', error);
    } finally {
      setIsLoadingEarnings(false);
    }
  }, []);

  useEffect(() => {
    loadEarningsSummary();
  }, [loadEarningsSummary]);

  useFocusEffect(
    useCallback(() => {
      loadEarningsSummary();
    }, [loadEarningsSummary])
  );

  const loadTransactions = useCallback(async () => {
    setIsLoadingTransactions(true);
    try {
      const [txResult, wdResult] = await Promise.all([
        getHostEarningsTransactions({ limit: 50 }),
        getHostWithdrawals({ limit: 50 }),
      ]);
      const txList = (txResult.success && txResult.transactions) ? txResult.transactions : [];
      const withdrawals = (wdResult.success && wdResult.withdrawals) ? wdResult.withdrawals : [];
      const withdrawalItems = withdrawals.map(withdrawalToTransactionItem);
      const merged = [...txList, ...withdrawalItems].sort((a, b) => (b.sortDate || 0) - (a.sortDate || 0));
      setRecentTransactions(merged);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const { netEarnings, commission } = financialData;
  // Backend `withdrawable` equals net_earnings; subtract pending withdrawals client-side.
  const withdrawable = Math.max(0, (financialData.withdrawable ?? 0) - pendingWithdrawalTotal);

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleWithdraw = () => {
    lightHaptic();
    navigation.navigate('Withdraw', { withdrawable });
  };

  const handleViewMoreTransactions = () => {
    lightHaptic();
    navigation.navigate('AllTransactions');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
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
        <Text style={styles.headerTitle}>Finance</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <TouchableOpacity 
          style={styles.financeCard}
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
            {isLoadingEarnings ? (
              <View style={styles.balanceLoading}>
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                <Text style={styles.balanceLoadingText}>Loading…</Text>
              </View>
            ) : (
              <>
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
                    <Text style={styles.pendingWithdrawalLabel}>Held (pending withdrawal)</Text>
                    <Text style={styles.pendingWithdrawalValue}>
                      {isBalanceVisible ? `- KSh ${formatCurrency(pendingWithdrawalTotal)}` : '••••'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.withdrawButton, isLoadingEarnings && styles.withdrawButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              if (!isLoadingEarnings) handleWithdraw();
            }}
            activeOpacity={0.8}
            disabled={isLoadingEarnings}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Recent transactions</Text>
          </View>

          {isLoadingTransactions ? (
            <View style={styles.transactionsLoading}>
              <ActivityIndicator size="small" color={COLORS.subtle} />
              <Text style={styles.transactionsLoadingText}>Loading transactions…</Text>
            </View>
          ) : recentTransactions.length > 0 ? (
            <>
              <View style={styles.transactionsList}>
                {recentTransactions.slice(0, 4).map((t, idx) => {
                  const isNegative = t.amount < 0;
                  const amountText = `${isNegative ? '-' : ''}KSh ${formatCurrency(Math.abs(t.amount))}`;
                  const isRejected = t.withdrawalStatus === 'rejected';
                  const amountStyle =
                    isRejected
                      ? styles.transactionAmountRejected
                      : (t.title && t.title.toLowerCase().includes('commission'))
                        ? styles.transactionAmountCommission
                        : (t.title && t.title.toLowerCase().includes('withdrawal'))
                          ? styles.transactionAmountWithdrawal
                          : t.amount > 0
                            ? styles.transactionAmountIncoming
                            : styles.transactionAmount;

                  return (
                    <View key={`${t.id || 'tx'}-${idx}`}>
                      <View style={styles.transactionRow}>
                        <View style={styles.transactionLeft}>
                          <Text style={[styles.transactionTitle, isRejected && styles.rejectedText]}>{t.title}</Text>
                          <Text style={styles.transactionSubtitle}>{t.subtitle}</Text>
                        </View>
                        <Text style={amountStyle}>
                          {amountText}
                        </Text>
                      </View>
                      {idx !== 3 && <View style={styles.breakdownDivider} />}
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.viewMoreRow}
                onPress={handleViewMoreTransactions}
                activeOpacity={0.85}
              >
                <Text style={styles.viewMoreText}>View more</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>Your payouts, withdrawals, and fees will show here.</Text>
            </View>
          )}
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
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
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
  withdrawButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.m,
  },
  withdrawButtonDisabled: {
    opacity: 0.6,
  },
  balanceLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  balanceLoadingText: {
    ...TYPE.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  withdrawButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  transactionsCard: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
  },
  transactionsHeader: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
  },
  transactionsTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
  },
  transactionsList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  transactionLeft: {
    flex: 1,
    paddingRight: 12,
  },
  transactionTitle: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  transactionSubtitle: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  transactionAmount: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  transactionAmountIncoming: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#34C759',
  },
  transactionAmountCommission: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF3B30',
  },
  transactionAmountWithdrawal: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF9500',
  },
  transactionAmountRejected: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF3B30',
  },
  rejectedText: {
    color: '#FF3B30',
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  viewMoreText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#007AFF',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 280,
  },
  transactionsLoading: {
    padding: SPACING.l,
    alignItems: 'center',
    gap: 8,
  },
  transactionsLoadingText: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
});
