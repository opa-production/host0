import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import {
  addMpesaPaymentMethod,
  addCardPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
} from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';
import StatusModal from '../ui/StatusModal';
import { addPaymentMethodScreenCache } from '../utils/screenDataCache';

export default function AddPaymentMethodScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState(null); // 'mpesa', 'visa', or 'mastercard'
  const [savedMethods, setSavedMethods] = useState(() =>
    addPaymentMethodScreenCache.savedMethods.length > 0
      ? addPaymentMethodScreenCache.savedMethods.map((m) => ({ ...m }))
      : []
  );

  // M-Pesa form state
  const [mpesaForm, setMpesaForm] = useState({
    name: '',
    mobileNumber: '',
    isDefault: false,
  });
  const [mpesaErrors, setMpesaErrors] = useState({});
  const [isSubmittingMpesa, setIsSubmittingMpesa] = useState(false);

  // Card form state
  const [cardForm, setCardForm] = useState({
    name: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    isDefault: false,
  });
  const [cardErrors, setCardErrors] = useState({});
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(
    () =>
      !addPaymentMethodScreenCache.loadedOnce && addPaymentMethodScreenCache.savedMethods.length === 0
  );
  const fetchGenRef = useRef(0);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const selectMpesa = () => {
    setSelectedType('mpesa');
    setCardForm({ name: '', cardNumber: '', expiry: '', cvv: '' });
    setCardErrors({});
  };

  const selectVisa = () => {
    setSelectedType('visa');
    setMpesaForm({ name: '', mobileNumber: '' });
    setMpesaErrors({});
    setCardForm({ name: '', cardNumber: '', expiry: '', cvv: '' });
    setCardErrors({});
  };

  const selectMastercard = () => {
    setSelectedType('mastercard');
    setMpesaForm({ name: '', mobileNumber: '' });
    setMpesaErrors({});
    setCardForm({ name: '', cardNumber: '', expiry: '', cvv: '' });
    setCardErrors({});
  };

  // Format card number as XXXX XXXX XXXX XXXX
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Validate card number matches selected type
  const validateCardType = (cardNumber) => {
    const firstDigit = cardNumber.replace(/\s/g, '')[0];
    if (selectedType === 'visa' && firstDigit !== '4') {
      return false;
    }
    if (selectedType === 'mastercard' && firstDigit !== '5') {
      return false;
    }
    return true;
  };

  // Format expiry as MM/YY
  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  // Validate M-Pesa form
  const validateMpesaForm = () => {
    const errors = {};
    
    if (!mpesaForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (mpesaForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!mpesaForm.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else {
      const cleaned = mpesaForm.mobileNumber.replace(/\D/g, '');
      // API requires 9-15 digits
      if (cleaned.length < 9 || cleaned.length > 15) {
        errors.mobileNumber = 'M-Pesa number must be between 9 and 15 digits';
      }
    }

    setMpesaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate card form
  const validateCardForm = () => {
    const errors = {};
    
    if (!cardForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (cardForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    const cleanedCardNumber = cardForm.cardNumber.replace(/\s/g, '');
    if (!cleanedCardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 16) {
      errors.cardNumber = 'Card number must be 13-16 digits';
    } else if (!/^\d+$/.test(cleanedCardNumber)) {
      errors.cardNumber = 'Card number must contain only digits';
    } else {
      if (!validateCardType(cleanedCardNumber)) {
        errors.cardNumber = selectedType === 'visa' 
          ? 'Visa cards must start with 4'
          : 'Mastercard must start with 5';
      }
    }

    if (!cardForm.expiry) {
      errors.expiry = 'Expiry date is required';
    } else {
      const [month, year] = cardForm.expiry.split('/');
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        errors.expiry = 'Please enter a valid expiry date (MM/YY)';
      } else {
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt('20' + year, 10);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (monthNum < 1 || monthNum > 12) {
          errors.expiry = 'Month must be between 01 and 12';
        } else if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
          errors.expiry = 'Card has expired';
        }
      }
    }

    const cvvLabel = selectedType === 'visa' ? 'CVC' : 'CVV';
    if (!cardForm.cvv) {
      errors.cvv = `${cvvLabel} is required`;
    } else if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      errors.cvv = `${cvvLabel} must be 3-4 digits`;
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle card number input
  const handleCardNumberChange = (text) => {
    const formatted = formatCardNumber(text);
    setCardForm({ ...cardForm, cardNumber: formatted });
  };

  // Handle expiry input
  const handleExpiryChange = (text) => {
    const formatted = formatExpiry(text);
    setCardForm({ ...cardForm, expiry: formatted });
  };

  // Format mobile number (allow 9-15 digits as per API)
  const formatMobileNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    // Allow up to 15 digits (API requirement)
    return cleaned.slice(0, 15);
  };

  // Handle M-Pesa submission
  const handleMpesaSubmit = async () => {
    if (!validateMpesaForm()) {
      return;
    }

    setIsSubmittingMpesa(true);
    lightHaptic();

    try {
      // Clean the mobile number (remove all non-digits)
      const cleanedNumber = mpesaForm.mobileNumber.replace(/\D/g, '');

      const result = await addMpesaPaymentMethod(
        mpesaForm.name.trim(),
        cleanedNumber,
        mpesaForm.isDefault
      );

      if (result.success) {
        // Reset form first
        setMpesaForm({ name: '', mobileNumber: '', isDefault: false });
        setMpesaErrors({});
        setSelectedType(null);
        
        // Reload payment methods before showing success
        await loadPaymentMethods({ silent: true });
        
        // Success modal
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Payment method added',
          message: 'M-Pesa payment method added successfully.',
          onClose: () => navigation.goBack(),
        });
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Failed to add',
          message: result.error || 'Failed to add M-Pesa payment method. Please try again.',
        });
      }
    } catch (error) {
      console.error('M-Pesa submission error:', error);
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmittingMpesa(false);
    }
  };

  // Load payment methods from API (silent = background refresh; keeps last list visible)
  const loadPaymentMethods = useCallback(async ({ silent = false } = {}) => {
    const gen = ++fetchGenRef.current;
    const hadCache = addPaymentMethodScreenCache.savedMethods.length > 0;
    const showLoader =
      !silent && !addPaymentMethodScreenCache.loadedOnce && !hadCache;

    if (showLoader) {
      setIsLoadingMethods(true);
    }

    try {
      const result = await getPaymentMethods();

      if (gen !== fetchGenRef.current) {
        return;
      }

      if (result.success) {
        let methods = [];

        if (Array.isArray(result.data)) {
          if (result.data[0] && Array.isArray(result.data[0].payment_methods)) {
            methods = result.data[0].payment_methods;
          } else {
            methods = result.data;
          }
        } else if (result.data && Array.isArray(result.data.payment_methods)) {
          methods = result.data.payment_methods;
        } else if (result.data && Array.isArray(result.data.items)) {
          methods = result.data.items;
        } else if (result.data && typeof result.data === 'object') {
          const keys = Object.keys(result.data);
          const arrayKey = keys.find((key) => Array.isArray(result.data[key]));
          if (arrayKey) {
            methods = result.data[arrayKey];
          }
        }

        const transformedMethods = methods.map((method, index) => {
          const methodType =
            method.method_type?.toLowerCase() ||
            method.type?.toLowerCase() ||
            method.payment_type?.toLowerCase();

          if (
            methodType === 'mpesa' ||
            method.mpesa_number ||
            methodType === 'ardenapay' ||
            methodType === 'ardena_pay' ||
            methodType === 'ardena pay'
          ) {
            return {
              id: method.id,
              idString: method.id?.toString() || `mpesa-${index}-${Date.now()}`,
              type: 'mpesa',
              name: method.name || '',
              mobileNumber:
                method.mpesa_number ||
                method.mobile_number ||
                method.ardenapay_number ||
                method.phone_number ||
                '',
              logo: require('../assets/images/mpesa.png'),
              isDefault: method.is_default || false,
            };
          }

          if (methodType === 'visa' || methodType === 'mastercard' || method.card_type || method.card_last_four) {
            const lastFour =
              method.card_last_four ||
              (method.card_number && method.card_number.length >= 4 ? method.card_number.slice(-4) : '****') ||
              '****';
            const cardType = method.card_type?.toLowerCase() || methodType || 'visa';
            return {
              id: method.id,
              idString: method.id?.toString() || `card-${index}-${Date.now()}`,
              type: cardType,
              name: method.name || '',
              lastFour,
              expiry: method.expiry_date || method.expiry || '',
              logo:
                cardType === 'visa'
                  ? require('../assets/images/visa.png')
                  : require('../assets/images/mastercard.png'),
              isDefault: method.is_default || false,
            };
          }

          console.warn('Unknown payment method type:', method);
          return {
            id: method.id?.toString() || `unknown-${index}-${Date.now()}`,
            ...method,
            logo: require('../assets/images/mpesa.png'),
          };
        });

        addPaymentMethodScreenCache.savedMethods = transformedMethods;
        addPaymentMethodScreenCache.loadedOnce = true;
        setSavedMethods(transformedMethods);
      } else {
        if (!addPaymentMethodScreenCache.loadedOnce && !hadCache) {
          setSavedMethods([]);
        }
        console.error('Failed to load payment methods:', result.error);
      }
    } catch (error) {
      if (gen !== fetchGenRef.current) {
        return;
      }
      console.error('Error loading payment methods:', error);
      if (!addPaymentMethodScreenCache.loadedOnce && !hadCache) {
        setSavedMethods([]);
      }
    } finally {
      if (gen === fetchGenRef.current) {
        setIsLoadingMethods(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const silent = addPaymentMethodScreenCache.loadedOnce;
      loadPaymentMethods({ silent });
    }, [loadPaymentMethods])
  );

  // Handle card submission
  const handleCardSubmit = async () => {
    if (!validateCardForm()) {
      return;
    }

    setIsSubmittingCard(true);
    lightHaptic();

    try {
      // Determine card type from selected type
      const cardType = selectedType; // 'visa' or 'mastercard'

      // Call the API to add card payment method
      const result = await addCardPaymentMethod(
        cardForm.name.trim(),
        cardForm.cardNumber.replace(/\s/g, ''), // Remove spaces
        cardForm.expiry, // Already in MM/YY format
        cardForm.cvv,
        cardType,
        cardForm.isDefault
      );

      if (result.success) {
        // Reset form first
        setCardForm({ name: '', cardNumber: '', expiry: '', cvv: '', isDefault: false });
        setCardErrors({});
        setSelectedType(null);
        
        // Reload payment methods before showing success
        await loadPaymentMethods({ silent: true });
        
        // Success modal
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Payment method added',
          message: 'Card payment method added successfully.',
          onClose: () => navigation.goBack(),
        });
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Failed to add',
          message: result.error || 'Failed to add card payment method. Please try again.',
        });
      }
    } catch (error) {
      console.error('Card submission error:', error);
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmittingCard(false);
    }
  };

  // Remove saved method
  const handleRemoveMethod = async (id) => {
    lightHaptic();
    
    // Show confirmation via status modal-style pattern is heavier; keep a simple inline confirm:
    setStatusModal({
      visible: true,
      type: 'info',
      title: 'Delete payment method',
      message: 'Are you sure you want to delete this payment method?',
      primaryLabel: 'Delete',
      onPrimary: async () => {
        try {
          const result = await deletePaymentMethod(id);
          if (result.success) {
            await loadPaymentMethods({ silent: true });
            setStatusModal((prev) => ({ ...prev, visible: false }));
          } else {
            setStatusModal({
              visible: true,
              type: 'error',
              title: 'Delete failed',
              message: result.error || 'Failed to delete payment method. Please try again.',
            });
          }
        } catch (error) {
          console.error('Delete payment method error:', error);
          setStatusModal({
            visible: true,
            type: 'error',
            title: 'Error',
            message: 'An unexpected error occurred. Please try again.',
          });
        }
      },
      secondaryLabel: 'Cancel',
      onSecondary: () => {
        setStatusModal((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Payment Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select payment method</Text>
          <Text style={styles.sectionHint}>Tap a method to select it, then fill in your details below.</Text>
          <View style={styles.paymentMethodsCard}>
            <TouchableOpacity
              style={styles.paymentMethodItem}
              onPress={() => {
                lightHaptic();
                selectMpesa();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <Image
                  source={require('../assets/images/mpesa.png')}
                  style={styles.paymentPickerLogo}
                  resizeMode="contain"
                />
                <Text style={styles.paymentMethodLabel}>M-Pesa</Text>
              </View>
              <View style={[styles.radioOuter, selectedType === 'mpesa' && styles.radioOuterSelected]}>
                {selectedType === 'mpesa' ? <View style={styles.radioInner} /> : null}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.paymentMethodItem}
              onPress={() => {
                lightHaptic();
                selectVisa();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <Image
                  source={require('../assets/images/visa.png')}
                  style={styles.paymentPickerLogo}
                  resizeMode="contain"
                />
                <Text style={styles.paymentMethodLabel}>Visa</Text>
              </View>
              <View style={[styles.radioOuter, selectedType === 'visa' && styles.radioOuterSelected]}>
                {selectedType === 'visa' ? <View style={styles.radioInner} /> : null}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.paymentMethodItem}
              onPress={() => {
                lightHaptic();
                selectMastercard();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <Image
                  source={require('../assets/images/mastercard.png')}
                  style={styles.paymentPickerLogo}
                  resizeMode="contain"
                />
                <Text style={styles.paymentMethodLabel}>Mastercard</Text>
              </View>
              <View style={[styles.radioOuter, selectedType === 'mastercard' && styles.radioOuterSelected]}>
                {selectedType === 'mastercard' ? <View style={styles.radioInner} /> : null}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* M-Pesa Form */}
        {selectedType === 'mpesa' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add M-Pesa</Text>
            
            <View style={styles.formCard}>
              {/* Name Input */}
              <View style={styles.formInputContainer}>
                <Text style={styles.label}>Name on Account</Text>
                <TextInput
                  style={[styles.formInput, mpesaErrors.name && styles.inputError]}
                  placeholder="Enter full name"
                  placeholderTextColor="#999999"
                  value={mpesaForm.name}
                  onChangeText={(text) => {
                    setMpesaForm({ ...mpesaForm, name: text });
                    if (mpesaErrors.name) {
                      setMpesaErrors({ ...mpesaErrors, name: '' });
                    }
                  }}
                  autoCapitalize="words"
                />
                {mpesaErrors.name && (
                  <Text style={styles.errorText}>{mpesaErrors.name}</Text>
                )}
              </View>

              <View style={styles.formDivider} />

              {/* Mobile Number Input */}
              <View style={styles.formInputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={[styles.formInput, mpesaErrors.mobileNumber && styles.inputError]}
                  placeholder="07XX XXX XXX or 2547XX XXX XXX"
                  placeholderTextColor="#999999"
                  value={mpesaForm.mobileNumber}
                  onChangeText={(text) => {
                    const formatted = formatMobileNumber(text);
                    setMpesaForm({ ...mpesaForm, mobileNumber: formatted });
                    if (mpesaErrors.mobileNumber) {
                      setMpesaErrors({ ...mpesaErrors, mobileNumber: '' });
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
                {mpesaErrors.mobileNumber && (
                  <Text style={styles.errorText}>{mpesaErrors.mobileNumber}</Text>
                )}
              </View>

              <View style={styles.formDivider} />

              {/* Set as Default Toggle */}
              <View style={styles.formInputContainer}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Text style={styles.toggleLabel}>Set as default payment method</Text>
                    <Text style={styles.toggleHint}>This will be used for withdrawals by default</Text>
                  </View>
                  <Switch
                    value={mpesaForm.isDefault}
                    onValueChange={(value) => setMpesaForm({ ...mpesaForm, isDefault: value })}
                    trackColor={{ false: '#E5E5EA', true: COLORS.text }}
                    thumbColor={mpesaForm.isDefault ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              </View>

              <View style={styles.formDivider} />

              {/* Submit Button */}
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmittingMpesa && styles.submitButtonDisabled]}
                  onPress={handleMpesaSubmit}
                  activeOpacity={1}
                  disabled={isSubmittingMpesa}
                >
                  {isSubmittingMpesa ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add M-Pesa</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Card Form */}
        {(selectedType === 'visa' || selectedType === 'mastercard') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add {selectedType === 'visa' ? 'Visa' : 'Mastercard'}</Text>
            
            <View style={styles.formCard}>
              {/* Name Input */}
              <View style={styles.formInputContainer}>
                <Text style={styles.label}>Name on Card</Text>
                <TextInput
                  style={[styles.formInput, cardErrors.name && styles.inputError]}
                  placeholder="Enter name as on card"
                  placeholderTextColor="#999999"
                  value={cardForm.name}
                  onChangeText={(text) => {
                    setCardForm({ ...cardForm, name: text });
                    if (cardErrors.name) {
                      setCardErrors({ ...cardErrors, name: '' });
                    }
                  }}
                  autoCapitalize="words"
                />
                {cardErrors.name && (
                  <Text style={styles.errorText}>{cardErrors.name}</Text>
                )}
              </View>

              <View style={styles.formDivider} />

              {/* Card Number Input */}
              <View style={styles.formInputContainer}>
                <Text style={styles.label}>Card Number</Text>
                <View style={styles.cardNumberContainer}>
                  <TextInput
                    style={[styles.formInput, styles.cardNumberInput, cardErrors.cardNumber && styles.inputError]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#999999"
                    value={cardForm.cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                  {selectedType && (
                    <Image 
                      source={selectedType === 'visa' 
                        ? require('../assets/images/visa.png')
                        : require('../assets/images/mastercard.png')
                      } 
                      style={styles.cardTypeLogo}
                      resizeMode="contain"
                    />
                  )}
                </View>
                {cardErrors.cardNumber && (
                  <Text style={styles.errorText}>{cardErrors.cardNumber}</Text>
                )}
              </View>

              <View style={styles.formDivider} />

              {/* Expiry and CVV Row */}
              <View style={styles.formInputContainer}>
                <View style={styles.row}>
                  {/* Expiry Input */}
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Expiry Date</Text>
                    <TextInput
                      style={[styles.formInput, cardErrors.expiry && styles.inputError]}
                      placeholder="MM/YY"
                      placeholderTextColor="#999999"
                      value={cardForm.expiry}
                      onChangeText={(text) => {
                        const formatted = formatExpiry(text);
                        setCardForm({ ...cardForm, expiry: formatted });
                        if (cardErrors.expiry) {
                          setCardErrors({ ...cardErrors, expiry: '' });
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    {cardErrors.expiry && (
                      <Text style={styles.errorText}>{cardErrors.expiry}</Text>
                    )}
                  </View>

                  {/* CVV/CVC Input */}
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>
                      {selectedType === 'visa' ? 'CVC' : 'CVV'}
                    </Text>
                    <TextInput
                      style={[styles.formInput, cardErrors.cvv && styles.inputError]}
                      placeholder="123"
                      placeholderTextColor="#999999"
                      value={cardForm.cvv}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '').slice(0, 4);
                        setCardForm({ ...cardForm, cvv: cleaned });
                        if (cardErrors.cvv) {
                          setCardErrors({ ...cardErrors, cvv: '' });
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                    />
                    {cardErrors.cvv && (
                      <Text style={styles.errorText}>{cardErrors.cvv}</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.formDivider} />

              {/* Set as Default Toggle */}
              <View style={styles.formInputContainer}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <Text style={styles.toggleLabel}>Set as default payment method</Text>
                    <Text style={styles.toggleHint}>This will be used for withdrawals by default</Text>
                  </View>
                  <Switch
                    value={cardForm.isDefault}
                    onValueChange={(value) => setCardForm({ ...cardForm, isDefault: value })}
                    trackColor={{ false: '#E5E5EA', true: COLORS.text }}
                    thumbColor={cardForm.isDefault ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              </View>

              <View style={styles.formDivider} />

              {/* Submit Button */}
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmittingCard && styles.submitButtonDisabled]}
                  onPress={handleCardSubmit}
                  activeOpacity={1}
                  disabled={isSubmittingCard}
                >
                  {isSubmittingCard ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add {selectedType === 'visa' ? 'Visa' : 'Mastercard'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Saved Payment Methods */}
        {isLoadingMethods && savedMethods.length === 0 ? (
          <View style={styles.section}>
            <ActivityIndicator size="small" color={COLORS.text} />
          </View>
        ) : savedMethods.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
            {savedMethods.map((method, index) => (
              <View key={method.idString || method.id} style={styles.savedCard}>
                <View style={styles.savedCardContent}>
                  <Image 
                    source={method.logo} 
                    style={styles.savedCardLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.savedCardInfo}>
                    <Text style={styles.savedCardName}>{method.name}</Text>
                    {method.type === 'mpesa' ? (
                      <Text style={styles.savedCardDetails}>
                        {method.mobileNumber ? formatPhoneNumber(method.mobileNumber) : 'M-Pesa'}
                        {method.isDefault && (
                          <Text style={styles.defaultBadge}> • Default</Text>
                        )}
                      </Text>
                    ) : (
                      <Text style={styles.savedCardDetails}>
                        •••• •••• •••• {method.lastFour || '****'} {method.expiry ? `| Expires ${method.expiry}` : ''}
                        {method.isDefault && (
                          <Text style={styles.defaultBadge}> • Default</Text>
                        )}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMethod(method.id)}
                  activeOpacity={1}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {/* Empty State */}
        {!selectedType && savedMethods.length === 0 && !isLoadingMethods && (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#cccccc" />
            <Text style={styles.emptyStateText}>No payment methods added</Text>
            <Text style={styles.emptyStateSubtext}>
              Select a provider above to get started
            </Text>
          </View>
        )}
      </ScrollView>
      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type || 'success'}
        title={statusModal.title}
        message={statusModal.message}
        primaryLabel={statusModal.primaryLabel || 'OK'}
        secondaryLabel={statusModal.secondaryLabel}
        onPrimary={() => {
          if (statusModal.onPrimary) {
            statusModal.onPrimary();
          } else if (statusModal.onClose) {
            statusModal.onClose();
          }
          setStatusModal((prev) => ({ ...prev, visible: false, secondaryLabel: undefined, onSecondary: undefined, onPrimary: undefined, onClose: undefined }));
        }}
        onSecondary={statusModal.onSecondary}
        onRequestClose={() =>
          setStatusModal((prev) => ({ ...prev, visible: false }))
        }
      />
    </KeyboardAvoidingView>
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
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 6,
  },
  sectionHint: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
    marginBottom: 10,
    lineHeight: 16,
  },
  paymentMethodsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.m,
    minHeight: 62,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  paymentPickerLogo: {
    width: 40,
    height: 26,
    marginRight: 12,
  },
  paymentMethodLabel: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderStrong,
    marginHorizontal: SPACING.m,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderVisible,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioOuterSelected: {
    borderColor: COLORS.text,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.text,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
    paddingVertical: SPACING.m,
  },
  formInputContainer: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  formDivider: {
    height: 1,
    backgroundColor: COLORS.text,
    marginHorizontal: SPACING.m,
  },
  label: {
    ...TYPE.micro,
    color: '#8E8E93',
    marginBottom: 6,
  },
  formInput: {
    width: '100%',
    height: 48,
    paddingHorizontal: 0,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
  },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#007AFF',
    backgroundColor: '#fff5f8',
  },
  errorText: {
    ...TYPE.caption,
    fontSize: 11,
    color: '#007AFF',
    marginTop: 4,
  },
  cardNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cardNumberInput: {
    flex: 1,
    paddingRight: 60,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  cardTypeLogo: {
    position: 'absolute',
    right: 12,
    width: 50,
    height: 32,
  },
  buttonWrapper: {
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 48,
    backgroundColor: '#000000',
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  toggleHint: {
    ...TYPE.caption,
    fontSize: 12,
    color: '#8E8E93',
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  savedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  savedCardLogo: {
    width: 50,
    height: 32,
    marginRight: 16,
  },
  savedCardInfo: {
    flex: 1,
  },
  savedCardName: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  savedCardDetails: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  defaultBadge: {
    ...TYPE.caption,
    fontSize: 11,
    color: COLORS.text,
    fontFamily: 'Nunito-SemiBold',
  },
});
