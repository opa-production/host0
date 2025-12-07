import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AddPaymentMethodScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState(null); // 'mpesa' or 'card'
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
  const [cardType, setCardType] = useState(null); // 'visa' or 'mastercard'

  // Format card number as XXXX XXXX XXXX XXXX
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  // Detect card type from first digit
  const detectCardType = (cardNumber) => {
    const firstDigit = cardNumber.replace(/\s/g, '')[0];
    if (firstDigit === '4') {
      return 'visa';
    } else if (firstDigit === '5') {
      return 'mastercard';
    }
    return null;
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
      const detectedType = detectCardType(cleanedCardNumber);
      if (!detectedType) {
        errors.cardNumber = 'Card must start with 4 (Visa) or 5 (Mastercard)';
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

    const cvvLabel = cardType === 'visa' ? 'CVC' : 'CVV';
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
    
    const cleaned = formatted.replace(/\s/g, '');
    if (cleaned.length > 0) {
      const detected = detectCardType(cleaned);
      setCardType(detected);
    } else {
      setCardType(null);
    }
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
        type: 'card',
        name: cardForm.name.trim(),
        cardType: cardType,
        lastFour: lastFour,
        expiry: cardForm.expiry,
        logo: cardType === 'visa' 
          ? require('../assets/images/visa.png')
          : require('../assets/images/mastercard.png'),
      };

      setSavedMethods([...savedMethods, newMethod]);
      setSelectedType(null);
      setCardForm({ name: '', cardNumber: '', expiry: '', cvv: '' });
      setCardErrors({});
      setCardType(null);
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment Methods</Text>
          <Text style={styles.subtitle}>Add and manage your payment methods</Text>
        </View>

        {/* Payment Type Selection */}
        {!selectedType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <View style={styles.paymentTypeCards}>
              {/* M-Pesa Card */}
              <TouchableOpacity
                style={styles.paymentTypeCard}
                onPress={() => setSelectedType('mpesa')}
                activeOpacity={0.8}
              >
                <Image 
                  source={require('../assets/images/mpesa.png')} 
                  style={styles.paymentTypeLogo}
                  resizeMode="contain"
                />
                <Text style={styles.paymentTypeName}>M-Pesa</Text>
              </TouchableOpacity>

              {/* Card Option */}
              <TouchableOpacity
                style={styles.paymentTypeCard}
                onPress={() => setSelectedType('card')}
                activeOpacity={0.8}
              >
                <View style={styles.cardLogosContainer}>
                  <Image 
                    source={require('../assets/images/visa.png')} 
                    style={styles.cardLogoSmall}
                    resizeMode="contain"
                  />
                  <Image 
                    source={require('../assets/images/mastercard.png')} 
                    style={styles.cardLogoSmall}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.paymentTypeName}>Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* M-Pesa Form */}
        {selectedType === 'mpesa' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.backToSelection}
              onPress={() => {
                setSelectedType(null);
                setMpesaForm({ name: '', mobileNumber: '' });
                setMpesaErrors({});
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#666666" />
              <Text style={styles.backToSelectionText}>Back to selection</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Add M-Pesa</Text>
            
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name on Account</Text>
                <TextInput
                  style={[styles.input, mpesaErrors.name && styles.inputError]}
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

              {/* Mobile Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={[styles.input, mpesaErrors.mobileNumber && styles.inputError]}
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

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleMpesaSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Add M-Pesa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Card Form */}
        {selectedType === 'card' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.backToSelection}
              onPress={() => {
                setSelectedType(null);
                setCardForm({ name: '', cardNumber: '', expiry: '', cvv: '' });
                setCardErrors({});
                setCardType(null);
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#666666" />
              <Text style={styles.backToSelectionText}>Back to selection</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Add Card</Text>
            
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name on Card</Text>
                <TextInput
                  style={[styles.input, cardErrors.name && styles.inputError]}
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

              {/* Card Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Card Number</Text>
                <View style={styles.cardNumberContainer}>
                  <TextInput
                    style={[styles.input, styles.cardNumberInput, cardErrors.cardNumber && styles.inputError]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#999999"
                    value={cardForm.cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                  {cardType && (
                    <Image 
                      source={cardType === 'visa' 
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

              {/* Expiry and CVV Row */}
              <View style={styles.row}>
                {/* Expiry Input */}
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TextInput
                    style={[styles.input, cardErrors.expiry && styles.inputError]}
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
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>
                    {cardType === 'visa' ? 'CVC' : 'CVV'}
                  </Text>
                  <TextInput
                    style={[styles.input, cardErrors.cvv && styles.inputError]}
                    placeholder={cardType === 'visa' ? '123' : '123'}
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

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCardSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Add Card</Text>
              </TouchableOpacity>
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
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF1577" />
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
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 16,
  },
  paymentTypeCards: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentTypeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
  },
  paymentTypeLogo: {
    width: 80,
    height: 50,
    marginBottom: 12,
  },
  cardLogosContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogoSmall: {
    width: 50,
    height: 30,
  },
  paymentTypeName: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  backToSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backToSelectionText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
  },
  inputError: {
    borderColor: '#FF1577',
    backgroundColor: '#fff5f8',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#FF1577',
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
  cardTypeLogo: {
    position: 'absolute',
    right: 12,
    width: 50,
    height: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#FF1577',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF1577',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
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
