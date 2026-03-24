import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, ActivityIndicator, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getPaymentMethods } from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';
import { createWithdrawal, getHostWithdrawals } from '../services/withdrawalService';
import StatusModal from '../ui/StatusModal';

export default function WithdrawScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const withdrawable = route?.params?.withdrawable ?? 0;
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onPrimary: null,
  });
  const scrollViewRef = useRef(null);
  const amountInputRef = useRef(null);
  const hasLoadedInitialDataRef = useRef(false);

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

  const openStatusModal = ({ type = 'info', title, message, onPrimary = null }) => {
    setStatusModal({
      visible: true,
      type,
      title,
      message,
      onPrimary,
    });
  };

  const closeStatusModal = () => {
    const callback = statusModal.onPrimary;
    setStatusModal((prev) => ({ ...prev, visible: false, onPrimary: null }));
    if (typeof callback === 'function') callback();
  };

  const loadRecentWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const result = await getHostWithdrawals({ limit: 100, skip: 0 });
      if (result.success) {
        setRecentWithdrawals(result.withdrawals || []);
      } else {
        setRecentWithdrawals([]);
      }
    } catch (_) {
      setRecentWithdrawals([]);
    } finally {
      setIsLoadingWithdrawals(false);
    }
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

  const displayedWithdrawals = recentWithdrawals.slice(0, 3);

  // Load payment methods when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const task = InteractionManager.runAfterInteractions(async () => {
        if (!isActive) return;

        if (!hasLoadedInitialDataRef.current) {
          await Promise.all([loadPaymentMethods(), loadRecentWithdrawals()]);
          hasLoadedInitialDataRef.current = true;
        } else {
          await loadRecentWithdrawals();
        }
      });

      return () => {
        isActive = false;
        if (task && typeof task.cancel === 'function') {
          task.cancel();
        }
      };
    }, [])
  );

  const handleAddPaymentMethod = () => {
    lightHaptic();
    navigation.navigate('AddPaymentMethod');
  };

  const handleSubmit = async () => {
    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      openStatusModal({
        type: 'error',
        title: 'Invalid amount',
        message: 'Please enter a valid amount.',
      });
      return;
    }
    if (numericAmount > withdrawable) {
      openStatusModal({
        type: 'error',
        title: 'Amount too high',
        message: 'Amount exceeds your withdrawable balance.',
      });
      return;
    }
    if (!selectedMethod) {
      openStatusModal({
        type: 'info',
        title: 'Select method',
        message: 'Please select a payment method.',
      });
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
          openStatusModal({
            type: 'error',
            title: 'Invalid number',
            message: 'Please use a valid M-Pesa number.',
          });
          setIsSubmitting(false);
          return;
        }
        payload.mpesa_number = digits.startsWith('254') ? digits : `254${digits.replace(/^0/, '')}`;
      } else {
        payload.bank_name = selectedMethod.bankName || selectedMethod.name || '';
        payload.account_number = String(selectedMethod.accountNumber || '').trim();
        payload.account_name = (selectedMethod.accountName || selectedMethod.name || '').trim();
        if (!payload.bank_name || !payload.account_number) {
          openStatusModal({
            type: 'error',
            title: 'Invalid method',
            message: 'This payment method is missing bank details.',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const result = await createWithdrawal(payload);
      if (result.success) {
        setAmount('');
        await loadRecentWithdrawals();
        openStatusModal({
          type: 'success',
          title: 'Withdrawal requested',
          message: 'Your withdrawal has been submitted and is pending processing.',
        });
      } else {
        openStatusModal({
          type: 'error',
          title: 'Withdrawal failed',
          message: result.error || 'Could not submit withdrawal. Please try again.',
        });
      }
    } catch (e) {
      openStatusModal({
        type: 'error',
        title: 'Error',
        message: e?.message || 'Something went wrong. Please try again.',
      });
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleNoMargin}>Select Payment Method</Text>
            </View>
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
                      <View style={[
                        styles.selectorCircle,
                        (selectedMethod?.id === method.id || selectedMethod === method) && styles.selectorCircleSelected,
                      ]}>
                        {(selectedMethod?.id === method.id || selectedMethod === method) ? (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        ) : null}
                      </View>
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

          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeaderRow}>
              <Text style={styles.sectionTitleNoMargin}>Recent Withdrawal Requests</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('WithdrawalTransactions');
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {isLoadingWithdrawals ? (
              <View style={styles.transactionCardEmpty}>
                <ActivityIndicator size="small" color={COLORS.text} />
                <Text style={styles.transactionEmptyText}>Loading recent requests...</Text>
              </View>
            ) : recentWithdrawals.length === 0 ? (
              <View style={styles.transactionCardEmpty}>
                <Ionicons name="time-outline" size={22} color={COLORS.subtle} />
                <Text style={styles.transactionEmptyText}>No withdrawal requests yet.</Text>
              </View>
            ) : (
              <View style={styles.transactionsCard}>
                {displayedWithdrawals.map((item, index) => {
                  const status = getStatusDisplay(item.status);
                  return (
                    <React.Fragment key={`${item.id || index}`}>
                      <View style={styles.transactionItem}>
                        <View style={styles.transactionLeft}>
                          <Text style={styles.transactionAmount}>
                            {formattedCurrency(Number(item.amount) || 0)}
                          </Text>
                          <Text style={styles.transactionMeta}>
                            {formatWithdrawalDate(item.created_at || item.updated_at)}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${status.color}1A` }]}>
                          <Text style={[styles.statusBadgeText, { color: status.color }]}>
                            {status.label}
                          </Text>
                        </View>
                      </View>
                      {index < displayedWithdrawals.length - 1 && (
                        <View style={styles.divider} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        primaryLabel="OK"
        onPrimary={closeStatusModal}
        onRequestClose={closeStatusModal}
      />
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  sectionTitleNoMargin: {
    ...TYPE.section,
    fontSize: 15,
    color: COLORS.text,
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
  selectorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.s,
  },
  selectorCircleSelected: {
    backgroundColor: '#000000',
  },
  amountSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.l,
  },
  transactionsSection: {
    marginTop: SPACING.s,
    marginBottom: SPACING.xl,
  },
  transactionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  seeAllButton: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  transactionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  transactionCardEmpty: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  transactionEmptyText: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.m,
  },
  transactionLeft: {
    flex: 1,
    marginRight: SPACING.s,
  },
  transactionAmount: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionMeta: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: {
    ...TYPE.caption,
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
});
