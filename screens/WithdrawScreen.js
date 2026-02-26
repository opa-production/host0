import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getPaymentMethods } from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';
import { createWithdrawal } from '../services/withdrawalService';

export default function WithdrawScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const withdrawable = route?.params?.withdrawable ?? 0;
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef(null);
  const amountInputRef = useRef(null);

  const formattedCurrency = (value) => `KSh ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  // Load payment methods from API
  const loadPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const result = await getPaymentMethods();
      console.log('WithdrawScreen - Payment methods API result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        // Handle API response structure: [{ payment_methods: [...] }] or { payment_methods: [...] }
        let methods = [];
        
        if (Array.isArray(result.data)) {
          if (result.data[0] && Array.isArray(result.data[0].payment_methods)) {
            methods = result.data[0].payment_methods;
          } else {
            methods = result.data;
          }
        } else if (result.data && Array.isArray(result.data.payment_methods)) {
          methods = result.data.payment_methods;
        }
        
        console.log('WithdrawScreen - Extracted methods:', JSON.stringify(methods, null, 2));
        
        // Transform methods for display and for withdrawal API (payment_method_type, mpesa_number or bank)
        const transformedMethods = methods.map((method) => {
          const methodType = (method.method_type || method.method_type_name || '').toLowerCase();
          
          if (methodType === 'mpesa' || method.mpesa_number) {
            const mpesaNumber = (method.mpesa_number || '').replace(/\D/g, '');
            return {
              id: method.id?.toString(),
              name: method.name || '',
              details: method.mpesa_number ? formatPhoneNumber(method.mpesa_number) : 'M-Pesa',
              icon: require('../assets/images/mpesa.png'),
              isDefault: method.is_default || false,
              paymentMethodType: 'mpesa',
              mpesaNumber: mpesaNumber || undefined,
            };
          } else if (methodType === 'visa' || methodType === 'mastercard' || method.card_type || method.card_last_four) {
            const cardType = (method.card_type || methodType || 'visa').toLowerCase();
            const lastFour = method.card_last_four || '****';
            const expiry = method.expiry_date || '';
            const bankName = method.name || (cardType === 'visa' ? 'Visa' : 'Mastercard');
            return {
              id: method.id?.toString(),
              name: method.name || method.account_name || (cardType === 'visa' ? 'Visa' : 'Mastercard'),
              details: `•••• •••• •••• ${lastFour}${expiry ? ` | Expires ${expiry}` : ''}`,
              icon: cardType === 'visa'
                ? require('../assets/images/visa.png')
                : require('../assets/images/mastercard.png'),
              isDefault: method.is_default || false,
              paymentMethodType: 'bank',
              bankName: method.bank_name || bankName,
              accountNumber: method.account_number || (lastFour !== '****' ? lastFour : method.id?.toString() || ''),
              accountName: method.account_name || method.name || '',
            };
          }
          
          return null;
        }).filter(Boolean); // Remove null entries
        
        console.log('WithdrawScreen - Transformed methods:', JSON.stringify(transformedMethods, null, 2));
        setPaymentMethods(transformedMethods);
      } else {
        console.error('Failed to load payment methods:', result.error);
        // If it's an authentication error, clear methods and show empty state
        // But don't clear user data - let HostContext handle token validation
        if (result.error && (result.error.includes('Session expired') || result.error.includes('authentication') || result.error.includes('No authentication token'))) {
          console.warn('WithdrawScreen: Authentication error detected:', result.error);
          setPaymentMethods([]);
        } else {
          // For other errors, keep existing methods if any (don't clear them)
          console.warn('WithdrawScreen: Non-auth error, keeping existing methods:', result.error);
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      // On unexpected errors, keep existing methods
    } finally {
      setIsLoadingMethods(false);
    }
  };

  // Load payment methods when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadPaymentMethods();
    }, [])
  );

  const handleAddPaymentMethod = () => {
    lightHaptic();
    navigation.navigate('AddPaymentMethod');
  };

  const handleSubmit = async () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (numericAmount > withdrawable) {
      Alert.alert('Amount too high', 'Amount exceeds your withdrawable balance.');
      return;
    }
    if (!selectedMethod) {
      Alert.alert('Select method', 'Please select a payment method.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: numericAmount,
        payment_method_type: selectedMethod.paymentMethodType,
      };
      if (selectedMethod.paymentMethodType === 'mpesa') {
        const digits = (selectedMethod.mpesaNumber || amount).replace(/\D/g, '');
        if (!digits || digits.length < 9) {
          Alert.alert('Invalid number', 'Please use a valid M-Pesa number.');
          setIsSubmitting(false);
          return;
        }
        payload.mpesa_number = digits.startsWith('254') ? digits : `254${digits.replace(/^0/, '')}`;
      } else {
        payload.bank_name = selectedMethod.bankName || selectedMethod.name || '';
        payload.account_number = String(selectedMethod.accountNumber || '').trim();
        payload.account_name = (selectedMethod.accountName || selectedMethod.name || '').trim();
        if (!payload.bank_name || !payload.account_number) {
          Alert.alert('Invalid method', 'This payment method is missing bank details.');
          setIsSubmitting(false);
          return;
        }
      }

      const result = await createWithdrawal(payload);
      if (result.success) {
        Alert.alert('Withdrawal requested', 'Your withdrawal has been submitted and is pending processing.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Withdrawal failed', result.error || 'Could not submit withdrawal. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            {isLoadingMethods ? (
              <View style={styles.emptyStateCard}>
                <ActivityIndicator size="small" color={COLORS.text} />
                <Text style={styles.emptyStateSubtitle}>Loading payment methods...</Text>
              </View>
            ) : paymentMethods.length > 0 ? (
              <View style={styles.methodsCard}>
                {paymentMethods.map((method, index) => (
                  <React.Fragment key={method.id}>
                    <TouchableOpacity
                      style={styles.methodItem}
                      onPress={() => {
                        lightHaptic();
                        setSelectedMethod(method);
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
                      {(selectedMethod?.id === method.id || selectedMethod === method) && (
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
                      (!amount || !selectedMethod || isSubmitting) && styles.withdrawButtonDisabled
                    ]} 
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={!amount || !selectedMethod || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.withdrawButtonText}>Withdraw</Text>
                    )}
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
