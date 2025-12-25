import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function WithdrawScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const withdrawable = route?.params?.withdrawable ?? 95000;
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);

  const formattedCurrency = (value) => `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  const paymentMethods = [
    { id: 'mpesa', name: 'M-Pesa', icon: require('../assets/images/mpesa.png'), details: '254 712 345 678' },
    { id: 'visa', name: 'Visa', icon: require('../assets/images/visa.png'), details: '•••• •••• •••• 4532' },
    { id: 'mastercard', name: 'Mastercard', icon: require('../assets/images/mastercard.png'), details: '•••• •••• •••• 7890' },
  ];

  const handleSubmit = () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (numericAmount > withdrawable) {
      alert('Amount exceeds your withdrawable balance.');
      return;
    }
    if (!selectedMethod) {
      alert('Please select a payment method.');
      return;
    }
    // TODO: Process withdrawal
    alert(`Withdrawal request of ${formattedCurrency(numericAmount)} to ${paymentMethods.find(m => m.id === selectedMethod)?.name} sent.`);
    navigation.goBack();
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
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <View style={styles.methodsContainer}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.methodCardSelected
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setSelectedMethod(method.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Image source={method.icon} style={styles.methodIcon} resizeMode="contain" />
                  <View style={styles.methodInfo}>
                    <Text style={[
                      styles.methodName,
                      selectedMethod === method.id && styles.methodNameSelected
                    ]}>
                      {method.name}
                    </Text>
                    <Text style={styles.methodDetails}>{method.details}</Text>
                  </View>
                  {selectedMethod === method.id && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>KSh</Text>
              <TextInput
                value={amount}
                onChangeText={(text) => {
                  // Allow only numbers and commas
                  const cleaned = text.replace(/[^0-9,]/g, '');
                  setAmount(cleaned);
                }}
                placeholder="0"
                placeholderTextColor={COLORS.subtle}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <Text style={styles.inputHint}>
              Enter the amount you want to withdraw
            </Text>
          </View>

          {/* Withdraw Button */}
          <TouchableOpacity 
            style={[
              styles.withdrawButton,
              (!amount || !selectedMethod) && styles.withdrawButtonDisabled
            ]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!amount || !selectedMethod}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            Processing time: 1-3 business days. By withdrawing, you agree to our payout policies.
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
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  section: {
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  methodsContainer: {
    gap: SPACING.s,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    minHeight: 68,
    position: 'relative',
  },
  methodCardSelected: {
    borderColor: COLORS.text,
  },
  methodIcon: {
    width: 48,
    height: 20,
  },
  methodInfo: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  methodName: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 2,
  },
  methodNameSelected: {
    color: COLORS.text,
  },
  methodDetails: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
  },
  checkmark: {
    position: 'absolute',
    right: SPACING.m,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.m,
    height: 56,
  },
  currencyPrefix: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: COLORS.text,
    marginRight: SPACING.s,
  },
  input: {
    flex: 1,
    ...TYPE.largeTitle,
    fontSize: 24,
    color: COLORS.text,
  },
  inputHint: {
    ...TYPE.caption,
    color: COLORS.subtle,
    marginTop: SPACING.s,
  },
  withdrawButton: {
    backgroundColor: '#000000',
    borderRadius: RADIUS.card,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.m,
    marginBottom: SPACING.m,
  },
  withdrawButtonDisabled: {
    backgroundColor: '#666666',
  },
  withdrawButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
  },
  footerNote: {
    ...TYPE.caption,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 16,
  },
});
