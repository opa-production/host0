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

  const formattedCurrency = (value) =>
    `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const handleWithdraw = () => {
    alert('Withdrawals are coming soon.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.walletHeader}>
          <Text style={styles.balanceLabel}>Wallet</Text>
          <Text style={styles.balanceValue}>{formattedCurrency(earnings.net)}</Text>
        </View>

        <View style={styles.breakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Net earnings</Text>
            <Text style={styles.breakdownValue}>{formattedCurrency(earnings.net)}</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform commission</Text>
            <Text style={styles.breakdownValueMuted}>- {formattedCurrency(earnings.commission)}</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Withdrawable</Text>
            <Text style={styles.breakdownValueStrong}>{formattedCurrency(earnings.withdrawable)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleWithdraw} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Withdraw</Text>
        </TouchableOpacity>
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
  walletHeader: {
    paddingVertical: SPACING.l,
  },
  balanceLabel: {
    ...TYPE.micro,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    ...TYPE.largeTitle,
    fontSize: 28,
    color: '#1C1C1E',
    marginTop: 8,
  },
  breakdown: {
    marginTop: SPACING.m,
    marginBottom: SPACING.l,
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
