import React, { useState, useRef } from 'react';
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
  const scrollViewRef = useRef(null);
  const amountInputRef = useRef(null);

  const formattedCurrency = (value) => `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  // Payment methods will be loaded from backend
  const paymentMethods = [];

  const handleAddPaymentMethod = () => {
    lightHaptic();
    navigation.navigate('AddPaymentMethod');
  };

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
    // TODO: Process withdrawal with backend
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
          ref={scrollViewRef}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 300 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            {paymentMethods.length > 0 ? (
              <View style={styles.methodsCard}>
                {paymentMethods.map((method, index) => (
                  <React.Fragment key={method.id}>
                    <TouchableOpacity
                      style={styles.methodItem}
                      onPress={() => {
                        lightHaptic();
                        setSelectedMethod(method.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Image source={method.icon} style={styles.methodIcon} resizeMode="contain" />
                      <View style={styles.methodInfo}>
                        <Text style={styles.methodName}>
                          {method.name}
                        </Text>
                        <Text style={styles.methodDetails}>{method.details}</Text>
                      </View>
                      {selectedMethod === method.id && (
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark-circle" size={20} color="#000000" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {index < paymentMethods.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateCard}>
                <Ionicons name="wallet-outline" size={48} color={COLORS.subtle} />
                <Text style={styles.emptyStateTitle}>No Payment Methods</Text>
                <Text style={styles.emptyStateSubtitle}>Add a payment method to withdraw your earnings</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddPaymentMethod}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Payment Method</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Amount Input and Withdraw Button */}
          {paymentMethods.length > 0 && (
            <View style={styles.amountSection}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <View style={styles.amountCard}>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencyPrefix}>KSh</Text>
                  <TextInput
                    ref={amountInputRef}
                    value={amount}
                    onChangeText={(text) => {
                      // Allow only numbers and commas
                      const cleaned = text.replace(/[^0-9,]/g, '');
                      setAmount(cleaned);
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 300);
                    }}
                    placeholder="0"
                    placeholderTextColor={COLORS.subtle}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.buttonContainer}>
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
                </View>
              </View>
            </View>
          )}
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
  methodsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: SPACING.m,
    minHeight: 68,
    position: 'relative',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.text,
    marginHorizontal: SPACING.m,
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
  methodDetails: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
  },
  checkmark: {
    position: 'absolute',
    right: SPACING.m,
  },
  amountSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.l,
  },
  amountSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.l,
  },
  amountCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
    paddingVertical: SPACING.m,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    height: 56,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.text,
    marginVertical: SPACING.m,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
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
  withdrawButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonDisabled: {
    backgroundColor: '#666666',
  },
  withdrawButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyStateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyStateTitle: {
    ...TYPE.section,
    fontSize: 18,
    color: COLORS.text,
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
  },
  emptyStateSubtitle: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.button,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  addButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
