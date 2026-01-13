import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function AllTransactionsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const transactions = route?.params?.transactions ?? [];
  
  const formatCurrency = (amount) => {
    const numericAmount = Number(amount) || 0;
    return numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getAmountStyle = (t) => {
    if (t?.title === 'Commission') return styles.amountCommission;
    if (t?.title === 'Withdrawal') return styles.amountWithdrawal;
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
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Your payouts, withdrawals, and fees will show here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {transactions.map((t, idx) => {
                const isNegative = t.amount < 0;
                const amountText = `${isNegative ? '-' : ''}KSh ${formatCurrency(Math.abs(t.amount))}`;
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
