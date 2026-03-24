import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostWithdrawals } from '../services/withdrawalService';

export default function WithdrawalTransactionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [withdrawals, setWithdrawals] = useState([]);
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

  const loadWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await fetchAllWithdrawals();
      setWithdrawals(all);
    } catch (_) {
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllWithdrawals]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  useFocusEffect(
    useCallback(() => {
      loadWithdrawals();
    }, [loadWithdrawals])
  );

  const formattedCurrency = (value) => {
    const amount = Number(value) || 0;
    return `KSh ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const getStatusDisplay = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'pending') return { label: 'Pending', color: '#FF9500' };
    if (normalized === 'approved') return { label: 'Approved', color: '#007AFF' };
    if (normalized === 'processed' || normalized === 'paid' || normalized === 'completed') {
      return { label: 'Completed', color: '#34C759' };
    }
    if (normalized === 'rejected' || normalized === 'failed' || normalized === 'cancelled') {
      return { label: 'Failed', color: '#FF3B30' };
    }
    return { label: status || 'Unknown', color: COLORS.subtle };
  };

  const formatWithdrawalDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

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
        <Text style={styles.headerTitle}>All Withdrawal Requests</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color={COLORS.text} />
              <Text style={styles.emptySub}>Loading requests...</Text>
            </View>
          ) : withdrawals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={28} color={COLORS.subtle} />
              <Text style={styles.emptyTitle}>No withdrawal requests yet</Text>
              <Text style={styles.emptySub}>Your withdrawal history will appear here.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {withdrawals.map((item, index) => {
                const status = getStatusDisplay(item.status);
                return (
                  <View key={`${item.id || index}`}>
                    <View style={styles.row}>
                      <View style={styles.left}>
                        <Text style={styles.amountText}>{formattedCurrency(item.amount)}</Text>
                        <Text style={styles.metaText}>
                          {formatWithdrawalDate(item.created_at || item.updated_at)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${status.color}1A` }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                    {index < withdrawals.length - 1 && <View style={styles.divider} />}
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
    paddingHorizontal: SPACING.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  left: {
    flex: 1,
    marginRight: SPACING.s,
  },
  amountText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 2,
  },
  metaText: {
    ...TYPE.caption,
    color: COLORS.subtle,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    ...TYPE.caption,
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  emptyTitle: {
    ...TYPE.section,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptySub: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    textAlign: 'center',
  },
});
