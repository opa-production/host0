import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function AllTransactionsScreen({ navigation, route }) {
  const transactions = route?.params?.transactions ?? [];

  const formattedCurrency = useMemo(
    () => (value) => `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    []
  );

  const getAmountStyle = (t) => {
    if (t?.title === 'Commission') return styles.amountCommission;
    if (t?.title === 'Withdrawal') return styles.amountWithdrawal;
    if (t?.amount > 0) return styles.amountIncoming;
    return styles.amount;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>All activity in your wallet</Text>
        </View>

        <View style={styles.card}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Your payouts, withdrawals, and fees will show here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {transactions.map((t, idx) => {
                const isNegative = t.amount < 0;
                const amountText = `${isNegative ? '-' : ''}${formattedCurrency(Math.abs(t.amount))}`;
                return (
                  <View key={t.id ?? `${idx}`}>
                    <View style={styles.row}>
                      <View style={styles.left}>
                        <Text style={styles.rowTitle}>{t.title}</Text>
                        <Text style={styles.rowSub}>{t.subtitle}</Text>
                      </View>
                      <Text style={getAmountStyle(t)}>{amountText}</Text>
                    </View>
                    {idx !== transactions.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
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
  content: {
    padding: SPACING.l,
    paddingTop: 90,
    paddingBottom: 120,
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
  header: {
    marginBottom: 16,
  },
  title: {
    ...TYPE.largeTitle,
  },
  subtitle: {
    ...TYPE.body,
    color: '#8E8E93',
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  rowSub: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
  },
  amount: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  amountIncoming: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#34C759',
  },
  amountCommission: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF3B30',
  },
  amountWithdrawal: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF9500',
  },
  emptyState: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPE.section,
    color: COLORS.text,
  },
  emptySub: {
    ...TYPE.body,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
});
