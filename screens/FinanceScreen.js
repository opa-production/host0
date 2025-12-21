import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function FinanceScreen({ navigation }) {
  // Mock balances
  const earnings = {
    gross: 125000,
    commission: 18750,
    net: 106250,
    withdrawable: 95000,
  };

  const recentTransactions = [
    { id: 't1', title: 'Withdrawal', subtitle: 'M-Pesa', amount: -15000 },
    { id: 't2', title: 'Payout', subtitle: 'Booking earnings', amount: 32000 },
    { id: 't3', title: 'Commission', subtitle: 'Platform fee', amount: -4500 },
    { id: 't4', title: 'Payout', subtitle: 'Booking earnings', amount: 18500 },
    { id: 't5', title: 'Adjustment', subtitle: 'Support adjustment', amount: 1200 },
  ];

  const formattedCurrency = (value) =>
    `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const handleWithdraw = () => {
    navigation.navigate('Withdraw', { withdrawable: earnings.withdrawable });
  };

  const handleViewMoreTransactions = () => {
    navigation.navigate('AllTransactions', { transactions: recentTransactions });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.walletCard}>
          <Text style={styles.balanceLabel}>Withdrawable</Text>
          <Text style={styles.withdrawableValue}>{formattedCurrency(earnings.withdrawable)}</Text>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Net earnings</Text>
            <Text style={styles.breakdownValue}>{formattedCurrency(earnings.net)}</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform commission</Text>
            <Text style={styles.breakdownValueCommission}>- {formattedCurrency(earnings.commission)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleWithdraw} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Withdraw</Text>
        </TouchableOpacity>

        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Recent transactions</Text>
          </View>

          <View style={styles.transactionsList}>
            {recentTransactions.map((t, idx) => {
              const isNegative = t.amount < 0;
              const amountText = `${isNegative ? '-' : ''}${formattedCurrency(Math.abs(t.amount))}`;
              const amountStyle =
                t.title === 'Commission'
                  ? styles.transactionAmountCommission
                  : t.title === 'Withdrawal'
                    ? styles.transactionAmountWithdrawal
                    : t.amount > 0
                      ? styles.transactionAmountIncoming
                      : styles.transactionAmount;

              return (
                <View key={t.id}>
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionLeft}>
                      <Text style={styles.transactionTitle}>{t.title}</Text>
                      <Text style={styles.transactionSubtitle}>{t.subtitle}</Text>
                    </View>
                    <Text style={amountStyle}>
                      {amountText}
                    </Text>
                  </View>
                  {idx !== recentTransactions.length - 1 && <View style={styles.breakdownDivider} />}
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
    paddingTop: 90,
    paddingBottom: 100,
  },
  balanceLabel: {
    ...TYPE.micro,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.m,
    marginBottom: SPACING.l,
  },
  withdrawableValue: {
    ...TYPE.largeTitle,
    fontSize: 32,
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  breakdownLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  breakdownValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  breakdownValueMuted: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#8E8E93',
  },
  breakdownValueCommission: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF3B30',
  },
  breakdownValueStrong: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FFFFFF',
  },
  transactionsCard: {
    marginTop: SPACING.l,
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
});
