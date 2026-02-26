import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { getPaymentMethods } from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';

export default function GetBadgeScreen({ navigation }) {
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);

  // Load payment methods from API
  const loadPaymentMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const result = await getPaymentMethods();
      
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
        
        // Transform methods for display
        const transformedMethods = methods.map((method) => {
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
          } else if (methodType === 'visa' || methodType === 'mastercard' || method.card_type) {
            const cardType = method.card_type?.toLowerCase() || methodType || 'visa';
            const lastFour = method.card_last_four || '****';
            
            return {
              id: method.id?.toString(),
              name: method.name || 'Card',
              details: `•••• •••• •••• ${lastFour}`,
              icon: cardType === 'visa' 
                ? require('../assets/images/visa.png')
                : require('../assets/images/mastercard.png'),
              isDefault: method.is_default || false,
              type: 'card',
            };
          }
          
          return null;
        }).filter(Boolean); // Remove null entries
        
        setPaymentMethods(transformedMethods);
        
        // Auto-select default method if available
        const defaultMethod = transformedMethods.find(m => m.isDefault);
        if (defaultMethod && !selectedMethodId) {
          setSelectedMethodId(defaultMethod.id);
        } else if (transformedMethods.length > 0 && !selectedMethodId) {
          setSelectedMethodId(transformedMethods[0].id);
        }
      } else {
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ardena for Business</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* <Text style={styles.subtitle}>Elevate your listing and checkout securely.</Text> */}

        <View style={styles.paymentSection}>
          <Text style={styles.sectionLabel}>Payment method</Text>
          
          {isLoadingMethods ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.text} />
            </View>
          ) : paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.paymentMethodItem}
                activeOpacity={0.9}
                onPress={() => setSelectedMethodId(method.id)}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={styles.paymentLogoContainer}>
                    <Image source={method.icon} style={method.type === 'mpesa' ? styles.paymentLogoMpesa : styles.paymentLogo} resizeMode="contain" />
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
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No payment methods available</Text>
              <Text style={styles.emptyStateSubtext}>Add a payment method in Settings to continue</Text>
            </View>
          )}
        </View>

        <View style={styles.noteCard}>
          <TouchableOpacity 
            style={[styles.primaryButton, (!selectedMethodId || paymentMethods.length === 0) && styles.primaryButtonDisabled]} 
            activeOpacity={0.9}
            disabled={!selectedMethodId || paymentMethods.length === 0}
          >
            <Text style={styles.primaryButtonText}>initiate payment</Text>
          </TouchableOpacity>
          <Text style={styles.noteTitle}>Secure checkout</Text>
          <Text style={styles.noteText}>We support mobile money, card, and bank transfer.</Text>
        </View>
      </ScrollView>
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
    paddingTop: 60,
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
    padding: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: 120,
    gap: 16,
  },
  subtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginBottom: 4,
  },
  paymentSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.m,
    gap: 12,
  },
  sectionLabel: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.subtle,
    marginBottom: 4,
  },
  loadingContainer: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  emptyState: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  emptyStateText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
    textAlign: 'center',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  paymentLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
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
    fontSize: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkCircleActive: {
    backgroundColor: '#1D1D1D',
    borderColor: '#1D1D1D',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
    fontSize: 15,
  },
  noteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.m,
    gap: 12,
  },
  noteTitle: {
    ...TYPE.bodyStrong,
    fontSize: 13,
  },
  noteText: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
});
