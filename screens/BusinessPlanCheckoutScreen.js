import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getPaymentMethods } from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';
import StatusModal from '../ui/StatusModal';
import {
  startSubscriptionCheckout,
  pollSubscriptionPaymentStatus,
  startCardCheckout,
  getCardPaymentStatus,
  getHostSubscription,
} from '../services/subscriptionService';
import AppLoader from "../ui/AppLoader";

function transformMpesaMethods(methods) {
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
          mpesaRaw: method.mpesa_number || '',
        };
      }
      return null;
    })
    .filter(Boolean);
}

const PAYABLE_CODES = new Set(['starter', 'premium']);
const CARD_POLL_INTERVAL_MS = 5000;
const CARD_POLL_MAX_MS = 300000; // 5 min — no server timeout for card

export default function BusinessPlanCheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const params = route.params || {};
  const planCode = params.planCode === 'premium' ? 'premium' : 'starter';
  const planName = params.planName || (planCode === 'premium' ? 'Premium' : 'Starter');
  const price = typeof params.price === 'number' ? params.price : Number(params.price) || 0;

  const [paymentMethod, setPaymentMethod] = useState('mpesa'); // 'mpesa' | 'card'
  const [mpesaMethods, setMpesaMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingMode, setProcessingMode] = useState('mpesa'); // 'mpesa' | 'card'
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successTier, setSuccessTier] = useState(null);
  const mounted = useRef(true);
  const cardPollRef = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (cardPollRef.current) clearInterval(cardPollRef.current);
    };
  }, []);

  const loadPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const result = await getPaymentMethods();
      let methods = [];
      if (result.success) {
        if (Array.isArray(result.data)) {
          methods = result.data[0] && Array.isArray(result.data[0].payment_methods)
            ? result.data[0].payment_methods
            : result.data;
        } else if (result.data && Array.isArray(result.data.payment_methods)) {
          methods = result.data.payment_methods;
        }
      }
      const transformed = transformMpesaMethods(methods);
      setMpesaMethods(transformed);
      setSelectedMethodId((prev) => {
        if (prev && transformed.some((m) => m.id === prev)) return prev;
        const def = transformed.find((m) => m.isDefault);
        if (def) return def.id;
        if (transformed[0]) return transformed[0].id;
        return null;
      });
    } catch (e) {
      setMpesaMethods([]);
    } finally {
      setIsLoadingMethods(false);
    }
  };

  // Resume pending card checkout if backend says one is in progress
  const checkPendingCardCheckout = async () => {
    try {
      const sub = await getHostSubscription();
      if (sub.success && sub.subscription?.pending_paystack_reference) {
        setPaymentMethod('card');
        startCardPolling(sub.subscription.pending_paystack_reference);
      }
    } catch {
      // silent
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPaymentMethods();
      checkPendingCardCheckout();
    }, [])
  );

  const selectedMpesa = mpesaMethods.find((m) => m.id === selectedMethodId);
  const priceLabel = `KSh ${price.toLocaleString()}`;

  // --- M-Pesa flow ---
  const handleMpesaCheckout = async () => {
    if (!PAYABLE_CODES.has(planCode)) {
      setErrorModal({ visible: true, message: 'Invalid plan.' });
      return;
    }
    if (!selectedMpesa) {
      setErrorModal({ visible: true, message: 'Add an M-Pesa number to subscribe.' });
      return;
    }
    if (String(selectedMpesa.mpesaRaw).replace(/\D/g, '').length < 9) {
      setErrorModal({ visible: true, message: 'Invalid M-Pesa number on file.' });
      return;
    }
    lightHaptic();
    setProcessingMode('mpesa');
    setProcessing(true);
    try {
      const start = await startSubscriptionCheckout({
        plan: planCode,
        phone_number: selectedMpesa.mpesaRaw,
      });
      if (!mounted.current) return;
      if (!start.success) {
        setProcessing(false);
        setErrorModal({ visible: true, message: start.error || 'Could not start checkout.' });
        return;
      }
      if (!start.checkout_request_id) {
        setProcessing(false);
        setErrorModal({ visible: true, message: 'Server did not return a checkout reference.' });
        return;
      }
      const pollResult = await pollSubscriptionPaymentStatus(start.checkout_request_id);
      if (!mounted.current) return;
      setProcessing(false);
      if (pollResult.outcome === 'completed') {
        await getHostSubscription();
        setSuccessTier(planCode);
      } else if (pollResult.outcome === 'failed') {
        setErrorModal({ visible: true, message: pollResult.message || 'M-Pesa payment failed.' });
      } else if (pollResult.outcome === 'cancelled') {
        setErrorModal({ visible: true, message: pollResult.message || 'Payment was cancelled.' });
      } else if (pollResult.outcome === 'timeout') {
        setErrorModal({
          visible: true,
          message: 'No confirmation yet. If you paid, your plan will update shortly. Otherwise try again.',
        });
      } else {
        setErrorModal({ visible: true, message: pollResult.message || 'Could not confirm payment status.' });
      }
    } catch (e) {
      if (mounted.current) {
        setProcessing(false);
        setErrorModal({ visible: true, message: e?.message || 'Something went wrong.' });
      }
    }
  };

  // --- Card / Paystack flow ---
  const startCardPolling = (paystackReference) => {
    if (cardPollRef.current) clearInterval(cardPollRef.current);
    setProcessingMode('card');
    setProcessing(true);
    const start = Date.now();

    cardPollRef.current = setInterval(async () => {
      if (!mounted.current) {
        clearInterval(cardPollRef.current);
        return;
      }
      if (Date.now() - start > CARD_POLL_MAX_MS) {
        clearInterval(cardPollRef.current);
        if (mounted.current) {
          setProcessing(false);
          setErrorModal({
            visible: true,
            message: 'Payment not confirmed yet. If you completed payment, your plan will update shortly.',
          });
        }
        return;
      }
      const res = await getCardPaymentStatus(paystackReference);
      if (!mounted.current) return;
      if (!res.success) {
        clearInterval(cardPollRef.current);
        setProcessing(false);
        setErrorModal({ visible: true, message: res.error || 'Could not check payment status.' });
        return;
      }
      if (res.status === 'completed') {
        clearInterval(cardPollRef.current);
        await getHostSubscription();
        if (mounted.current) {
          setProcessing(false);
          setSuccessTier(planCode);
        }
      } else if (res.status === 'failed') {
        clearInterval(cardPollRef.current);
        setProcessing(false);
        setErrorModal({
          visible: true,
          message: res.message || 'Card payment failed or was cancelled.',
        });
      }
      // status === 'pending' → keep polling
    }, CARD_POLL_INTERVAL_MS);
  };

  const handleCardCheckout = async () => {
    if (!PAYABLE_CODES.has(planCode)) {
      setErrorModal({ visible: true, message: 'Invalid plan.' });
      return;
    }
    lightHaptic();
    try {
      const checkout = await startCardCheckout(planCode);
      if (!mounted.current) return;
      if (!checkout.success || !checkout.authorization_url) {
        setErrorModal({
          visible: true,
          message: checkout.error || 'Could not start card checkout.',
        });
        return;
      }
      // openAuthSessionAsync opens the system browser (not a WebView) and
      // automatically intercepts the ardenahost:// deep-link redirect from Paystack.
      const result = await WebBrowser.openAuthSessionAsync(
        checkout.authorization_url,
        'ardenahost://subscription/result'
      );

      if (!mounted.current) return;

      if (result.type === 'success' && result.url) {
        // Paystack redirected back — extract reference from the URL if present,
        // otherwise fall back to the reference we already have from checkout.
        let ref = checkout.paystack_reference;
        try {
          const parsed = new URL(result.url);
          ref = parsed.searchParams.get('paystack_reference') || ref;
        } catch (_) {}
        startCardPolling(ref);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed the browser without completing — start polling anyway in
        // case payment went through before they dismissed.
        startCardPolling(checkout.paystack_reference);
      }
    } catch (e) {
      if (mounted.current) {
        setErrorModal({ visible: true, message: e?.message || 'Something went wrong.' });
      }
    }
  };

  const premiumSuccessMessage =
    "Your Premium plan is active. You'll see the badge next to your name on Home, and lower commission benefits apply.\n\nManage or change your plan anytime from Profile > Ardena for Business.";

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
        {/* Order summary */}
        <View style={styles.outlineCard}>
          <Text style={styles.summaryPlan}>{planName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryPriceLabel}>Total</Text>
            <Text style={styles.summaryPrice}>{priceLabel}</Text>
          </View>
        </View>

        {/* Payment method toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, paymentMethod === 'mpesa' && styles.toggleBtnActive]}
            onPress={() => { lightHaptic(); setPaymentMethod('mpesa'); }}
            activeOpacity={0.8}
          >
            <Image source={require('../assets/images/mpesa.png')} style={styles.toggleMpesaLogo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, paymentMethod === 'card' && styles.toggleBtnActive]}
            onPress={() => { lightHaptic(); setPaymentMethod('card'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={20} color={paymentMethod === 'card' ? COLORS.text : COLORS.subtle} />
            <Text style={[styles.toggleBtnLabel, paymentMethod === 'card' && styles.toggleBtnLabelActive]}>
              Card
            </Text>
          </TouchableOpacity>
        </View>

        {/* M-Pesa section */}
        {paymentMethod === 'mpesa' && (
          <View style={styles.outlineCard}>
            <Text style={styles.sectionLabel}>M-Pesa</Text>
            <Text style={styles.sectionHint}>An STK push will be sent to your saved number.</Text>

            {isLoadingMethods ? (
              <View style={styles.loadingContainer}>
                <AppLoader size="small" color={COLORS.text} />
              </View>
            ) : mpesaMethods.length > 0 ? (
              <>
                <View style={styles.methodsList}>
                  {mpesaMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={styles.paymentMethodItem}
                      activeOpacity={0.9}
                      onPress={() => setSelectedMethodId(method.id)}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <View style={styles.paymentLogoContainer}>
                          <Image source={method.icon} style={styles.paymentLogoMpesa} resizeMode="contain" />
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
                  onPress={handleMpesaCheckout}
                  activeOpacity={0.9}
                >
                  <Text style={styles.checkoutButtonText}>Pay with M-Pesa</Text>
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
        )}

        {/* Card / Paystack section */}
        {paymentMethod === 'card' && (
          <View style={styles.outlineCard}>
            <Text style={styles.sectionLabel}>Card</Text>
            <Text style={styles.sectionHint}>
              You'll be taken to a secure Paystack page to enter your card. No card details are stored by us.
            </Text>
            <View style={styles.cardBrands}>
              <Image source={require('../assets/images/visa.png')} style={styles.brandLogo} resizeMode="contain" />
              <Image source={require('../assets/images/mastercard.png')} style={styles.brandLogoMc} resizeMode="contain" />
            </View>
            <TouchableOpacity
              style={[styles.checkoutButton, styles.cardButton, processing && styles.checkoutButtonDisabled]}
              disabled={processing}
              onPress={handleCardCheckout}
              activeOpacity={0.9}
            >
              <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.checkoutButtonText}>Pay with Card</Text>
            </TouchableOpacity>
          </View>
        )}


      </ScrollView>

      {/* Processing overlay */}
      <Modal visible={processing} transparent animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <AppLoader size="large" color={COLORS.text} />
            <Text style={styles.processingTitle}>
              {processingMode === 'card' ? 'Waiting for payment…' : 'Check your phone'}
            </Text>
            <Text style={styles.processingSub}>
              {processingMode === 'card'
                ? 'Complete payment on the Paystack page, then come back here.'
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
        message={premiumSuccessMessage}
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
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    backgroundColor: 'transparent',
  },
  toggleBtnActive: {
    borderColor: COLORS.text,
    backgroundColor: COLORS.surface,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  toggleMpesaLogo: {
    width: 62,
    height: 20,
  },
  toggleBtnLabel: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.subtle,
  },
  toggleBtnLabelActive: {
    color: COLORS.text,
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
  methodsList: {
    gap: 10,
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
  },
  checkCircleActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  cardBrands: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogo: {
    width: 48,
    height: 16,
  },
  brandLogoMc: {
    width: 36,
    height: 24,
  },
  checkoutButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cardButton: {
    backgroundColor: COLORS.brand,
  },
  checkoutButtonDisabled: {
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
  premiumSuccessBadgeWrap: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  premiumSuccessBadge: {
    width: 80,
    height: 80,
  },
});
