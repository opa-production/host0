import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostEarningsTransactions } from '../services/earningsService';
import { getHostWithdrawals, withdrawalToTransactionItem } from '../services/withdrawalService';
import AppLoader from "../ui/AppLoader";

export default function AllTransactionsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllWithdrawals = useCallback(async () => {
    const pageSize = 100;
    let skip = 0;
    let all = [];
    let keepGoing = true;

    while (keepGoing) {
      const result = await getHostWithdrawals({ limit: pageSize, skip });
      if (!result.success) break;

      const page = Array.isArray(result.withdrawals) ? result.withdrawals : [];
      all = all.concat(page);

      const total = Number(result.total) || all.length;
      const fetchedThisPage = page.length;
      if (fetchedThisPage < pageSize || all.length >= total) {
        keepGoing = false;
      } else {
        skip += pageSize;
      }
    }

    return all;
  }, []);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txResult, withdrawals] = await Promise.all([
        getHostEarningsTransactions(),
        fetchAllWithdrawals(),
      ]);
      const txList = (txResult.success && txResult.transactions) ? txResult.transactions : [];
      const withdrawalItems = withdrawals.map(withdrawalToTransactionItem);
      const merged = [...txList, ...withdrawalItems].sort((a, b) => (b.sortDate || 0) - (a.sortDate || 0));
      setTransactions(merged);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllWithdrawals]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );
  
  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const isRejectedWithdrawal = (t) => t?.withdrawalStatus === 'rejected';

  const getAmountStyle = (t) => {
    if (isRejectedWithdrawal(t)) return styles.amountRejected;
    if (t?.title && t.title.toLowerCase().includes('commission')) return styles.amountCommission;
    if (t?.title && t.title.toLowerCase().includes('withdrawal')) return styles.amountWithdrawal;
    if (t?.amount > 0) return styles.amountIncoming;
    return styles.amount;
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
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <AppLoader size="large" color={COLORS.brand} />
              <Text style={styles.emptySub}>Loading transactions…</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Your payouts, withdrawals, and fees will show here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {transactions.map((t, idx) => {
                const isNegative = t.amount < 0;
                const amountText = `${isNegative ? '-' : ''}KSh ${formatCurrency(Math.abs(t.amount))}`;
                const rejected = isRejectedWithdrawal(t);
                return (
                  <View key={`${t.id || 'tx'}-${idx}`}>
                    <View style={styles.row}>
                      <View style={styles.left}>
                        <Text style={[styles.rowTitle, rejected && styles.rejectedText]}>{t.title}</Text>
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
  amountRejected: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FF3B30',
  },
  rejectedText: {
    color: '#FF3B30',
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
