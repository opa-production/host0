import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function AddPaymentMethodScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState(null); // 'mpesa', 'visa', or 'mastercard'
  const [savedMethods, setSavedMethods] = useState([]);

  // M-Pesa form state
  const [mpesaForm, setMpesaForm] = useState({
    name: '',
    mobileNumber: '',
  });
  const [mpesaErrors, setMpesaErrors] = useState({});

  // Card form state
  const [cardForm, setCardForm] = useState({
    name: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState({});

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
      if (cleaned.length < 10) {
        errors.mobileNumber = 'Please enter a valid mobile number';
      } else if (!cleaned.startsWith('254') && !cleaned.startsWith('07') && !cleaned.startsWith('7')) {
        errors.mobileNumber = 'Please enter a valid Kenyan mobile number';
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

  // Format mobile number
  const formatMobileNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      return cleaned.slice(0, 12);
    } else if (cleaned.startsWith('0')) {
      return cleaned.slice(0, 10);
    } else if (cleaned.startsWith('7')) {
      return cleaned.slice(0, 9);
    }
    return cleaned.slice(0, 12);
  };

  // Handle M-Pesa submission
  const handleMpesaSubmit = () => {
    if (validateMpesaForm()) {
      const cleaned = mpesaForm.mobileNumber.replace(/\D/g, '');
      let formattedNumber = cleaned;
      if (cleaned.startsWith('0')) {
        formattedNumber = '254' + cleaned.slice(1);
      } else if (cleaned.startsWith('7')) {
        formattedNumber = '254' + cleaned;
      }

      const newMethod = {
        id: Date.now().toString(),
        type: 'mpesa',
        name: mpesaForm.name.trim(),
        mobileNumber: formattedNumber,
        logo: require('../assets/images/mpesa.png'),
      };

      setSavedMethods([...savedMethods, newMethod]);
      setSelectedType(null);
      setMpesaForm({ name: '', mobileNumber: '' });
      setMpesaErrors({});
    }
  };

  // Handle card submission
  const handleCardSubmit = () => {
    if (validateCardForm()) {
      const cleanedCardNumber = cardForm.cardNumber.replace(/\s/g, '');
      const lastFour = cleanedCardNumber.slice(-4);

      const newMethod = {
        id: Date.now().toString(),
        type: selectedType,
        name: cardForm.name.trim(),
        lastFour: lastFour,
        expiry: cardForm.expiry,
        logo: selectedType === 'visa' 
          ? require('../assets/images/visa.png')
          : require('../assets/images/mastercard.png'),
      };

      setSavedMethods([...savedMethods, newMethod]);
      setSelectedType(null);
      setCardForm({ name: '', cardNumber: '', expiry: '', cvv: '' });
      setCardErrors({});
    }
  };

  // Remove saved method
  const handleRemoveMethod = (id) => {
    setSavedMethods(savedMethods.filter(m => m.id !== id));
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
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.paymentMethodsCard}>
            <TouchableOpacity
              style={styles.paymentMethodItem}
              onPress={selectMpesa}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../assets/images/mpesa.png')} 
                style={styles.paymentTypeLogoSmall}
                resizeMode="contain"
              />
              <Text style={styles.paymentTypeLabel}>M-Pesa</Text>
              {selectedType === 'mpesa' && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color="#000000" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.paymentMethodItem}
              onPress={selectVisa}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../assets/images/visa.png')} 
                style={styles.paymentTypeLogoSmall}
                resizeMode="contain"
              />
              <Text style={styles.paymentTypeLabel}>Visa</Text>
              {selectedType === 'visa' && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color="#000000" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.paymentMethodItem}
              onPress={selectMastercard}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../assets/images/mastercard.png')} 
                style={styles.paymentTypeLogoSmall}
                resizeMode="contain"
              />
              <Text style={styles.paymentTypeLabel}>Mastercard</Text>
              {selectedType === 'mastercard' && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color="#000000" />
                </View>
              )}
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

              {/* Submit Button */}
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleMpesaSubmit}
                  activeOpacity={1}
                >
                  <Text style={styles.submitButtonText}>Add M-Pesa</Text>
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

              {/* Submit Button */}
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCardSubmit}
                  activeOpacity={1}
                >
                  <Text style={styles.submitButtonText}>Add {selectedType === 'visa' ? 'Visa' : 'Mastercard'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Saved Payment Methods */}
        {savedMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
            {savedMethods.map((method) => (
              <View key={method.id} style={styles.savedCard}>
                <View style={styles.savedCardContent}>
                  <Image 
                    source={method.logo} 
                    style={styles.savedCardLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.savedCardInfo}>
                    <Text style={styles.savedCardName}>
                      {method.type === 'mpesa' ? method.name : method.name}
                    </Text>
                    {method.type === 'mpesa' ? (
                      <Text style={styles.savedCardDetails}>
                        +{method.mobileNumber}
                      </Text>
                    ) : (
                      <Text style={styles.savedCardDetails}>
                        •••• •••• •••• {method.lastFour} | Expires {method.expiry}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMethod(method.id)}
                  activeOpacity={1}
                >
                  <Ionicons name="trash-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!selectedType && savedMethods.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#cccccc" />
            <Text style={styles.emptyStateText}>No payment methods added</Text>
            <Text style={styles.emptyStateSubtext}>
              Select a payment method above to get started
            </Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 10,
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
    justifyContent: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: SPACING.m,
    minHeight: 56,
    position: 'relative',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.text,
    marginHorizontal: SPACING.m,
  },
  checkmark: {
    position: 'absolute',
    right: SPACING.m,
  },
  paymentTypeLabel: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  paymentTypeLogoSmall: {
    width: 48,
    height: 20,
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
  },
  submitButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FFFFFF',
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
});
