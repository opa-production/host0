import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FinanceScreen({ navigation }) {
  // Mock balances
  const earnings = {
    gross: 125000,
    commission: 18750,
    net: 106250,
    withdrawable: 95000,
  };

  const payoutAccounts = [
    { id: '1', type: 'M-Pesa', last4: '2547', label: 'Personal M-Pesa' },
    { id: '2', type: 'Bank', last4: '4321', label: 'Equity Bank - Savings' },
  ];

  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(payoutAccounts[0]?.id || null);
  const [note, setNote] = useState('');

  const formattedCurrency = (value) =>
    `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const summaryRows = useMemo(
    () => [
      { label: 'Gross earnings', value: formattedCurrency(earnings.gross) },
      { label: 'Platform commission', value: `- ${formattedCurrency(earnings.commission)}` },
      { label: 'Net earnings', value: formattedCurrency(earnings.net), bold: true },
      { label: 'Withdrawable now', value: formattedCurrency(earnings.withdrawable), accent: true },
    ],
    [earnings],
  );

  const handleAddMethod = () => navigation.navigate('AddPaymentMethod');

  const handleWithdraw = () => {
    // TODO: replace with API call
    if (!amount || Number(amount) <= 0) return;
    if (!selectedAccountId && payoutAccounts.length === 0) {
      handleAddMethod();
      return;
    }
    alert(`Withdrawing KSh ${amount} to ${payoutAccounts.find((m) => m.id === selectedAccountId)?.label || 'new method'}${note ? '\nNote: ' + note : ''}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.label}>Wallet balance</Text>
              <Text style={styles.balance}>{formattedCurrency(earnings.net)}</Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#222222" />
              <Text style={styles.pillText}>Secured</Text>
            </View>
          </View>

          <View style={styles.summaryRows}>
            {summaryRows.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text style={[styles.rowLabel, row.bold && styles.rowLabelBold]}>{row.label}</Text>
                <Text
                  style={[
                    styles.rowValue,
                    row.bold && styles.rowValueBold,
                    row.accent && styles.rowValueAccent,
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Withdraw Form */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Withdraw funds</Text>
            <View style={styles.pillMuted}>
              <Ionicons name="time-outline" size={14} color="#666666" />
              <Text style={styles.pillMutedText}>Instant - 2hrs</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount to withdraw</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currency}>KSh</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payout account</Text>
            {payoutAccounts.length === 0 ? (
              <TouchableOpacity style={styles.emptyAccount} onPress={handleAddMethod}>
                <Ionicons name="add-circle-outline" size={20} color="#222222" />
                <Text style={styles.emptyAccountText}>Add payment method</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.accountList}>
                {payoutAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountItem,
                      selectedAccountId === account.id && styles.accountItemActive,
                    ]}
                    onPress={() => setSelectedAccountId(account.id)}
                  >
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountLabel}>{account.label}</Text>
                      <Text style={styles.accountMeta}>
                        {account.type} •••• {account.last4}
                      </Text>
                    </View>
                    {selectedAccountId === account.id ? (
                      <Ionicons name="radio-button-on" size={20} color="#222222" />
                    ) : (
                      <Ionicons name="radio-button-off-outline" size={20} color="#999999" />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addAnother} onPress={handleAddMethod}>
                  <Ionicons name="add-outline" size={18} color="#FF1577" />
                  <Text style={styles.addAnotherText}>Add another method</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Payout reference"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!amount || Number(amount) <= 0) && styles.primaryButtonDisabled]}
            onPress={handleWithdraw}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  content: {
    padding: 20,
    paddingTop: 90,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efefef',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#777777',
  },
  balance: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#222222',
  },
  summaryRows: {
    marginTop: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  rowLabelBold: {
    fontFamily: 'Nunito-SemiBold',
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  rowValueBold: {
    fontSize: 16,
  },
  rowValueAccent: {
    color: '#111111',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  pillMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f6f6f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillMutedText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#666666',
  },
  inputGroup: {
    marginBottom: 16,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#444444',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  currency: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#999999',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
    paddingVertical: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
  },
  accountList: {
    gap: 12,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efefef',
    backgroundColor: '#fdfdfd',
  },
  accountItemActive: {
    borderColor: '#FF1577',
    backgroundColor: '#FFF4FA',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  accountMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  addAnother: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  addAnotherText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF1577',
  },
  emptyAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#f7f7f7',
  },
  emptyAccountText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#222222',
  },
  primaryButton: {
    backgroundColor: '#FF1577',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
