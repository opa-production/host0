import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getPaymentMethods } from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';
import StatusModal from '../ui/StatusModal';

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

export default function BusinessPlanCheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const params = route.params || {};
  const planName = params.planName || 'Business plan';
  const price = typeof params.price === 'number' ? params.price : Number(params.price) || 0;

  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false });

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

      const transformed = transformPaymentMethods(methods);
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

  const handlePay = () => {
    if (!selectedMethodId || !selectedMethod) return;
    lightHaptic();
    setConfirmModal({ visible: true });
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.outlineCard}>
          <Text style={styles.summaryPlan}>{planName}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryPriceLabel}>Total</Text>
            <Text style={styles.summaryPrice}>{priceLabel}</Text>
          </View>
        </View>

        <View style={styles.outlineCard}>
          <Text style={styles.sectionLabel}>Payment</Text>

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
                          style={method.type === 'mpesa' ? styles.paymentLogoMpesa : styles.paymentLogo}
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
                  (!selectedMethodId || isLoadingMethods) && styles.checkoutButtonDisabled,
                ]}
                disabled={!selectedMethodId || isLoadingMethods}
                onPress={handlePay}
                activeOpacity={0.9}
              >
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={36} color={COLORS.subtle} />
              <Text style={styles.emptyStateText}>No payment method</Text>
              <TouchableOpacity
                style={styles.addMethodButton}
                onPress={() => navigation.navigate('AddPaymentMethod')}
                activeOpacity={0.85}
              >
                <Text style={styles.addMethodButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <StatusModal
        visible={confirmModal.visible}
        type="success"
        title="Confirm on your device"
        message={
          selectedMethod
            ? `${priceLabel} · ${planName}. Approve the prompt on your phone.`
            : ''
        }
        primaryLabel="Done"
        onPrimary={() => {
          setConfirmModal({ visible: false });
          navigation.goBack();
        }}
        onRequestClose={() => setConfirmModal({ visible: false })}
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
  /** Outlined blocks (plan vs payment) */
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
  paymentLogo: {
    width: 44,
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
});
