import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getPaymentMethods } from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';
import StatusModal from '../ui/StatusModal';
import {
  startSubscriptionCheckout,
  pollSubscriptionPaymentStatus,
  getHostSubscription,
  setMockSubscriptionPlan,
  clearMockSubscriptionPlan,
} from '../services/subscriptionService';

function transformPaymentMethods(methods) {
  return methods
    .map((method) => {
      const methodType = method.method_type?.toLowerCase();

      if (methodType === 'mpesa' || method.mpesa_number) {
        return {
          id: method.id?.toString(),
          name: method.name || 'M-Pesa',
          details: method.mpesa_number ? formatPhoneNumber(method.mpesa_number) : 'M-Pesa',
          icon: require('../assets/images/mpesa.png'),
          isDefault: method.is_default || false,
          type: 'mpesa',
          mpesaRaw: method.mpesa_number || '',
        };
      }
      if (methodType === 'visa' || methodType === 'mastercard' || method.card_type) {
        const cardType = method.card_type?.toLowerCase() || methodType || 'visa';
        const lastFour = method.card_last_four || '****';
        return {
          id: method.id?.toString(),
          name: method.name || 'Card',
          details: `•••• •••• •••• ${lastFour}`,
          icon:
            cardType === 'visa'
              ? require('../assets/images/visa.png')
              : require('../assets/images/mastercard.png'),
          isDefault: method.is_default || false,
          type: 'card',
        };
      }
      return null;
    })
    .filter(Boolean);
}

const PAYABLE_CODES = new Set(['starter', 'premium']);

export default function BusinessPlanCheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const params = route.params || {};
  const planCode = params.planCode === 'premium' ? 'premium' : 'starter';
  const planName = params.planName || (planCode === 'premium' ? 'Premium' : 'Starter');
  const price = typeof params.price === 'number' ? params.price : Number(params.price) || 0;

  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingMode, setProcessingMode] = useState('mpesa'); // 'mpesa' | 'mock'
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  /** null = closed; starter | premium = which success copy to show */
  const [successTier, setSuccessTier] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const result = await getPaymentMethods();
      let methods = [];

      if (result.success) {
        if (Array.isArray(result.data)) {
          if (result.data[0] && Array.isArray(result.data[0].payment_methods)) {
            methods = result.data[0].payment_methods;
          } else {
            methods = result.data;
          }
        } else if (result.data && Array.isArray(result.data.payment_methods)) {
          methods = result.data.payment_methods;
        }
      }

      const transformed = transformPaymentMethods(methods).filter((m) => m.type === 'mpesa');
      setPaymentMethods(transformed);

      const defaultMethod = transformed.find((m) => m.isDefault);
      setSelectedMethodId((prev) => {
        if (prev && transformed.some((m) => m.id === prev)) return prev;
        if (defaultMethod) return defaultMethod.id;
        if (transformed[0]) return transformed[0].id;
        return null;
      });
    } catch (e) {
      console.error('Business checkout: load payment methods', e);
      setPaymentMethods([]);
    } finally {
      setIsLoadingMethods(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPaymentMethods();
    }, [])
  );

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);
  const priceLabel = `KSh ${price.toLocaleString()}`;

  const handleCheckout = async () => {
    if (!PAYABLE_CODES.has(planCode)) {
      setErrorModal({ visible: true, message: 'Invalid plan.' });
      return;
    }
    if (!selectedMethod || selectedMethod.type !== 'mpesa') {
      setErrorModal({ visible: true, message: 'Add an M-Pesa number to subscribe.' });
      return;
    }
    if (!selectedMethod.mpesaRaw || String(selectedMethod.mpesaRaw).replace(/\D/g, '').length < 9) {
      setErrorModal({ visible: true, message: 'Invalid M-Pesa number on file.' });
      return;
    }

    lightHaptic();
    setProcessingMode('mpesa');
    setProcessing(true);

    try {
      const start = await startSubscriptionCheckout({
        plan: planCode,
        phone_number: selectedMethod.mpesaRaw,
      });

      if (!mounted.current) return;

      if (!start.success) {
        setProcessing(false);
        setErrorModal({ visible: true, message: start.error || 'Could not start checkout.' });
        return;
      }

      const checkoutRequestId = start.checkout_request_id;
      if (!checkoutRequestId) {
        setProcessing(false);
        setErrorModal({ visible: true, message: 'Server did not return a checkout reference.' });
        return;
      }

      const pollResult = await pollSubscriptionPaymentStatus(checkoutRequestId);

      if (!mounted.current) return;
      setProcessing(false);

      if (pollResult.outcome === 'completed') {
        await getHostSubscription();
        setSuccessTier(planCode === 'premium' ? 'premium' : 'starter');
        return;
      }
      if (pollResult.outcome === 'failed') {
        setErrorModal({
          visible: true,
          message: pollResult.message || 'M-Pesa payment failed.',
        });
        return;
      }
      if (pollResult.outcome === 'cancelled') {
        setErrorModal({
          visible: true,
          message: pollResult.message || 'Payment was cancelled.',
        });
        return;
      }
      if (pollResult.outcome === 'timeout') {
        setErrorModal({
          visible: true,
          message: 'No confirmation yet. If you paid, your plan will update shortly. Otherwise try again.',
        });
        return;
      }
      if (pollResult.outcome === 'error') {
        setErrorModal({
          visible: true,
          message: pollResult.message || 'Could not check payment status.',
        });
        return;
      }
      setErrorModal({ visible: true, message: 'Could not confirm payment status.' });
    } catch (e) {
      if (mounted.current) {
        setProcessing(false);
        setErrorModal({ visible: true, message: e?.message || 'Something went wrong.' });
      }
    }
  };

  const handleMockCardPay = async () => {
    if (!PAYABLE_CODES.has(planCode)) {
      setErrorModal({ visible: true, message: 'Invalid plan.' });
      return;
    }
    lightHaptic();
    setProcessingMode('mock');
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      if (!mounted.current) return;
      await setMockSubscriptionPlan(planCode);
      await getHostSubscription();
      if (!mounted.current) return;
      setProcessing(false);
      setSuccessTier(planCode === 'premium' ? 'premium' : 'starter');
    } catch (e) {
      if (mounted.current) {
        setProcessing(false);
        setErrorModal({ visible: true, message: e?.message || 'Mock payment failed.' });
      }
    }
  };

  const closeSuccess = () => {
    setSuccessTier(null);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (processing) return;
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.outlineCard}>
          <Text style={styles.summaryPlan}>{planName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryPriceLabel}>Total</Text>
            <Text style={styles.summaryPrice}>{priceLabel}</Text>
          </View>
        </View>

        <View style={styles.outlineCard}>
          <Text style={styles.sectionLabel}>M-Pesa</Text>
          <Text style={styles.sectionHint}>Subscription is charged via STK push to your saved number.</Text>

          {isLoadingMethods ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.text} />
            </View>
          ) : paymentMethods.length > 0 ? (
            <>
              <View style={styles.methodsList}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={styles.paymentMethodItem}
                    activeOpacity={0.9}
                    onPress={() => setSelectedMethodId(method.id)}
                  >
                    <View style={styles.paymentMethodLeft}>
                      <View style={styles.paymentLogoContainer}>
                        <Image
                          source={method.icon}
                          style={styles.paymentLogoMpesa}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodTitle}>{method.name}</Text>
                        <Text style={styles.paymentMethodSub}>{method.details}</Text>
                      </View>
                    </View>
                    <View style={[styles.checkCircle, selectedMethodId === method.id && styles.checkCircleActive]}>
                      {selectedMethodId === method.id && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  (!selectedMethodId || isLoadingMethods || processing) && styles.checkoutButtonDisabled,
                ]}
                disabled={!selectedMethodId || isLoadingMethods || processing}
                onPress={handleCheckout}
                activeOpacity={0.9}
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="phone-portrait-outline" size={36} color={COLORS.subtle} />
              <Text style={styles.emptyStateText}>No M-Pesa number saved</Text>
              <TouchableOpacity
                style={styles.addMethodButton}
                onPress={() => navigation.navigate('AddPaymentMethod')}
                activeOpacity={0.85}
              >
                <Text style={styles.addMethodButtonText}>Add M-Pesa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {__DEV__ ? (
          <View style={styles.outlineCard}>
            <Text style={styles.devBanner}>Development only</Text>
            <Text style={styles.sectionLabel}>Mock card payment</Text>
            <Text style={styles.sectionHint}>
              Skips M-Pesa so you can preview the success screen and the Premium badge on Home. Not in release builds.
            </Text>
            <View style={styles.mockCardRow}>
              <View style={styles.mockCardIconWrap}>
                <Image
                  source={require('../assets/images/visa.png')}
                  style={styles.mockCardBrand}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodTitle}>Test card</Text>
                <Text style={styles.paymentMethodSub}>Visa ·••• 4242</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                styles.mockPayButton,
                processing && styles.checkoutButtonDisabled,
              ]}
              disabled={processing}
              onPress={handleMockCardPay}
              activeOpacity={0.9}
            >
              <Text style={styles.checkoutButtonText}>Pay with mock card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearMockLink}
              onPress={async () => {
                lightHaptic();
                await clearMockSubscriptionPlan();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearMockLinkText}>Clear mock subscription</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={processing} transparent animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={COLORS.text} />
            <Text style={styles.processingTitle}>
              {processingMode === 'mock' ? 'Processing test payment…' : 'Check your phone'}
            </Text>
            <Text style={styles.processingSub}>
              {processingMode === 'mock'
                ? 'Simulating a successful card charge for this checkout.'
                : 'Approve the M-Pesa prompt to complete payment.'}
            </Text>
          </View>
        </View>
      </Modal>

      <StatusModal
        visible={successTier === 'premium'}
        type="success"
        title="Welcome to Premium"
        children={
          <View style={styles.premiumSuccessBadgeWrap}>
            <Image
              source={require('../assets/images/badge.png')}
              style={styles.premiumSuccessBadge}
              resizeMode="contain"
            />
          </View>
        }
        message={
          'Your Premium plan is active. You’ll see the badge next to your name on Home, and lower commission benefits apply.\n\nManage or change your plan anytime from Profile → Ardena for Business.'
        }
        primaryLabel="Done"
        onPrimary={closeSuccess}
        onRequestClose={closeSuccess}
      />

      <StatusModal
        visible={successTier === 'starter'}
        type="success"
        title={"You're subscribed"}
        message="Your Starter plan is active. You can review it anytime from your profile."
        primaryLabel="Done"
        onPrimary={closeSuccess}
        onRequestClose={closeSuccess}
      />

      <StatusModal
        visible={errorModal.visible}
        type="error"
        title="Payment"
        message={errorModal.message}
        primaryLabel="OK"
        onPrimary={() => setErrorModal({ visible: false, message: '' })}
        onRequestClose={() => setErrorModal({ visible: false, message: '' })}
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
  content: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    gap: 14,
  },
  outlineCard: {
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    backgroundColor: 'transparent',
    gap: 12,
  },
  summaryPlan: {
    ...TYPE.section,
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summaryPriceLabel: {
    ...TYPE.body,
    fontSize: 15,
    color: COLORS.subtle,
  },
  summaryPrice: {
    ...TYPE.section,
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  methodsList: {
    gap: 10,
  },
  sectionLabel: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  sectionHint: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
    lineHeight: 17,
    marginBottom: 4,
  },
  loadingContainer: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: SPACING.s,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
  },
  addMethodButton: {
    marginTop: 0,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
  },
  addMethodButtonText: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
    fontSize: 15,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  paymentLogoContainer: {
    minWidth: 80,
    alignItems: 'flex-start',
  },
  paymentLogoMpesa: {
    width: 70,
    height: 22,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 2,
  },
  paymentMethodSub: {
    ...TYPE.caption,
    color: COLORS.subtle,
    fontSize: 13,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderVisible,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkCircleActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  checkoutButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: COLORS.text,
    opacity: 0.35,
  },
  checkoutButtonText: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  processingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 12,
    maxWidth: 300,
  },
  processingTitle: {
    ...TYPE.section,
    fontSize: 17,
    color: COLORS.text,
    textAlign: 'center',
  },
  processingSub: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 20,
  },
  devBanner: {
    alignSelf: 'flex-start',
    ...TYPE.caption,
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  mockCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    backgroundColor: 'transparent',
  },
  mockCardIconWrap: {
    width: 80,
    alignItems: 'flex-start',
  },
  mockCardBrand: {
    width: 52,
    height: 18,
  },
  mockPayButton: {
    backgroundColor: '#1D4ED8',
  },
  clearMockLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  clearMockLinkText: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    textDecorationLine: 'underline',
  },
  premiumSuccessBadgeWrap: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  premiumSuccessBadge: {
    width: 80,
    height: 80,
  },
});
