import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function WithdrawScreen({ navigation, route }) {
  const withdrawable = route?.params?.withdrawable ?? 95000;
  const [amount, setAmount] = useState('');

  const formattedCurrency = useMemo(
    () => (value) => `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    []
  );

  const quickAmounts = useMemo(() => {
    const caps = [0.25, 0.5, 1];
    return caps
      .map((p) => Math.floor(withdrawable * p))
      .filter((v) => v > 0)
      .map((v) => ({ key: `${v}`, value: v, label: formattedCurrency(v) }));
  }, [formattedCurrency, withdrawable]);

  const handleSubmit = () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!numericAmount || Number.isNaN(numericAmount)) {
      alert('Enter a valid amount.');
      return;
    }
    if (numericAmount > withdrawable) {
      alert('Amount exceeds your withdrawable balance.');
      return;
    }
    alert('Withdrawal request sent (mock).');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Withdraw</Text>
            <Text style={styles.subtitle}>Move your earnings to your payout method.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Withdrawable</Text>
            <Text style={styles.balance}>{formattedCurrency(withdrawable)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Amount</Text>

            <View style={styles.inputRow}>
              <Text style={styles.currencyPrefix}>KSh</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.quickRow}>
              {quickAmounts.map((q) => (
                <TouchableOpacity
                  key={q.key}
                  style={styles.quickPill}
                  activeOpacity={0.9}
                  onPress={() => setAmount(`${q.value}`)}
                >
                  <Text style={styles.quickPillText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.methodRow} activeOpacity={0.85}>
              <View style={styles.methodLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="wallet-outline" size={18} color={COLORS.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>Payout method</Text>
                  <Text style={styles.methodSub}>M-Pesa • **** 123</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Withdraw</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            By withdrawing, you agree to processing times and payout policies.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: 20,
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
    padding: SPACING.m,
    marginTop: 12,
  },
  label: {
    ...TYPE.micro,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balance: {
    ...TYPE.largeTitle,
    fontSize: 30,
    color: '#1C1C1E',
    marginTop: 8,
  },
  sectionTitle: {
    ...TYPE.section,
    color: '#1C1C1E',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: 12,
    height: 54,
  },
  currencyPrefix: {
    ...TYPE.bodyStrong,
    color: '#1C1C1E',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    color: '#1C1C1E',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  quickPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  quickPillText: {
    ...TYPE.caption,
    color: '#1C1C1E',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderStrong,
    marginTop: 16,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  methodTitle: {
    ...TYPE.bodyStrong,
    color: '#1C1C1E',
  },
  methodSub: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#000000',
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPE.section,
    color: '#FFFFFF',
  },
  footerNote: {
    ...TYPE.caption,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 10,
  },
});
