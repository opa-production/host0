import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, calculateMinSecurityDeposit } from '../../ui/tokens';

const COUNTRIES = [
  'Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Ethiopia', 'South Sudan',
  'Somalia', 'Burundi', 'Djibouti', 'Eritrea', 'All East Africa',
];

export default function RentalInfoScreen({ formData, updateFormData, onNext, onBack }) {
  const insets = useSafeAreaInsets();
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCustomPriceModal, setShowCustomPriceModal] = useState(false);

  const toggleCountry = (country) => {
    const countries = formData.allowedCountries || [];
    if (countries.includes(country)) {
      updateFormData({ allowedCountries: countries.filter(c => c !== country) });
    } else {
      updateFormData({ allowedCountries: [...countries, country] });
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions to use current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      updateFormData({
        pickupLat: location.coords.latitude,
        pickupLong: location.coords.longitude,
        pickupLocation: `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    }
  };

  const getMinDepositAmount = () => {
    if (!formData.carValue || formData.carValue === '') return 0;
    return calculateMinSecurityDeposit(formData.carValue);
  };

  const validateDepositAmount = (amount) => {
    if (!amount || amount === '') return true; // Empty is okay if not required
    const depositValue = parseFloat(amount);
    const minDeposit = getMinDepositAmount();
    return !isNaN(depositValue) && depositValue >= minDeposit;
  };

  const canProceed = () => {
    const basicFields = (
      formData.pricePerDay !== '' &&
      formData.minimumRentalDays !== '' &&
      formData.pickupLocation !== '' &&
      formData.ageRestriction !== ''
    );

    // If payment type is deposit, validate deposit amount
    if (formData.paymentType === 'deposit') {
      return basicFields && 
             formData.carValue !== '' && 
             formData.securityDepositAmount !== '' &&
             validateDepositAmount(formData.securityDepositAmount);
    }

    return basicFields;
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 200 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      {/* Pricing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per Day (KSh) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.pricePerDay}
            onChangeText={(text) => updateFormData({ pricePerDay: text })}
            keyboardType="numeric"
            placeholderTextColor="#999999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per Week (KSh)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.pricePerWeek}
            onChangeText={(text) => updateFormData({ pricePerWeek: text })}
            keyboardType="numeric"
            placeholderTextColor="#999999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price per Month (KSh)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.pricePerMonth}
            onChangeText={(text) => updateFormData({ pricePerMonth: text })}
            keyboardType="numeric"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Payment Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Type *</Text>
          <View style={styles.paymentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'full' && styles.paymentTypeOptionSelected,
              ]}
              onPress={() => updateFormData({ paymentType: 'full', securityDepositAmount: '' })}
              activeOpacity={1}
            >
              <Ionicons
                name={formData.paymentType === 'full' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={formData.paymentType === 'full' ? '#007AFF' : COLORS.subtle}
              />
              <Text
                style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'full' && styles.paymentTypeTextSelected,
                ]}
              >
                Full Payment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'deposit' && styles.paymentTypeOptionSelected,
              ]}
              onPress={() => updateFormData({ paymentType: 'deposit' })}
              activeOpacity={1}
            >
              <Ionicons
                name={formData.paymentType === 'deposit' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={formData.paymentType === 'deposit' ? '#007AFF' : COLORS.subtle}
              />
              <Text
                style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'deposit' && styles.paymentTypeTextSelected,
                ]}
              >
                Accept Security Deposit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Car Value (required if deposit is selected) */}
        {formData.paymentType === 'deposit' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Car Value (KSh) *</Text>
              <Text style={styles.hint}>Enter the estimated value of your car</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={formData.carValue}
                onChangeText={(text) => {
                  updateFormData({ carValue: text });
                  // Clear deposit amount if car value changes
                  if (formData.securityDepositAmount) {
                    updateFormData({ securityDepositAmount: '' });
                  }
                }}
                keyboardType="numeric"
                placeholderTextColor="#999999"
              />
            </View>

            {/* Security Deposit Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Security Deposit Amount (KSh) *</Text>
              <Text style={styles.hint}>
                Minimum: KSh {getMinDepositAmount().toLocaleString()} (45% higher than car value)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  formData.securityDepositAmount &&
                    !validateDepositAmount(formData.securityDepositAmount) &&
                    styles.inputError,
                ]}
                placeholder={getMinDepositAmount().toString()}
                value={formData.securityDepositAmount}
                onChangeText={(text) => updateFormData({ securityDepositAmount: text })}
                keyboardType="numeric"
                placeholderTextColor="#999999"
              />
              {formData.securityDepositAmount &&
                !validateDepositAmount(formData.securityDepositAmount) && (
                  <Text style={styles.errorText}>
                    Deposit must be at least KSh {getMinDepositAmount().toLocaleString()}
                  </Text>
                )}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.customPriceButton}
          onPress={() => setShowCustomPriceModal(true)}
          activeOpacity={1}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.customPriceButtonText}>Add Custom Price Option</Text>
        </TouchableOpacity>

        {formData.customPrice && (
          <View style={styles.customPriceDisplay}>
            <Text style={styles.customPriceLabel}>{formData.customPriceLabel}:</Text>
            <Text style={styles.customPriceValue}>KSh {formData.customPrice}</Text>
            <TouchableOpacity
              onPress={() => updateFormData({ customPrice: '', customPriceLabel: '' })}
              activeOpacity={1}
            >
              <Ionicons name="close-circle" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Rental Terms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rental Terms</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Minimum Rental Days *</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            value={formData.minimumRentalDays}
            onChangeText={(text) => updateFormData({ minimumRentalDays: text })}
            keyboardType="numeric"
            placeholderTextColor="#999999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Maximum Rental Days</Text>
          <Text style={styles.hint}>Optional - Leave blank for no maximum</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 30"
            value={formData.maxRentalDays}
            onChangeText={(text) => updateFormData({ maxRentalDays: text })}
            keyboardType="numeric"
            placeholderTextColor="#999999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pickup Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Nakuru, Kenya"
            value={formData.pickupLocation}
            onChangeText={(text) => updateFormData({ pickupLocation: text })}
            placeholderTextColor="#999999"
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.locationButtonText}>Use Current Location</Text>
          </TouchableOpacity>
          {formData.pickupLat && formData.pickupLong && (
            <Text style={styles.hint}>
              Coordinates: {formData.pickupLat.toFixed(6)}, {formData.pickupLong.toFixed(6)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age Restriction *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 25 years and above"
            value={formData.ageRestriction}
            onChangeText={(text) => updateFormData({ ageRestriction: text })}
            placeholderTextColor="#999999"
          />
        </View>
      </View>

      {/* Car Rules */}
      <View style={styles.section}>
        <Text style={styles.label}>Car Rules</Text>
        <Text style={styles.hint}>List any rules or restrictions for renters</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., No smoking, No pets, Return with full tank, etc."
          value={formData.carRules}
          onChangeText={(text) => updateFormData({ carRules: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#999999"
        />
      </View>

      {/* Cross Country */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.label}>Allow Cross Country Travel</Text>
            <Text style={styles.hint}>Allow renters to travel to other countries</Text>
          </View>
          <Switch
            value={formData.crossCountryAllowed}
            onValueChange={(value) => updateFormData({ crossCountryAllowed: value })}
            trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
            thumbColor="#ffffff"
          />
        </View>

        {formData.crossCountryAllowed && (
          <View style={styles.countriesSection}>
            <Text style={styles.label}>Allowed Countries</Text>
            <Text style={styles.hint}>Select countries renters can visit</Text>
            <View style={styles.countriesGrid}>
              {COUNTRIES.map((country) => {
                const isSelected = (formData.allowedCountries || []).includes(country);
                return (
                  <TouchableOpacity
                    key={country}
                    style={[styles.countryChip, isSelected && styles.countryChipSelected]}
                    onPress={() => toggleCountry(country)}
                    activeOpacity={1}
                  >
                    <Text
                      style={[
                        styles.countryChipText,
                        isSelected && styles.countryChipTextSelected,
                      ]}
                    >
                      {country}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Custom Price Modal */}
      <Modal
        visible={showCustomPriceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Price</Text>
              <TouchableOpacity
                onPress={() => setShowCustomPriceModal(false)}
                activeOpacity={1}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Label</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Weekend Special"
                  value={formData.customPriceLabel}
                  onChangeText={(text) => updateFormData({ customPriceLabel: text })}
                  placeholderTextColor="#999999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (KSh)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.customPrice}
                  onChangeText={(text) => updateFormData({ customPrice: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setShowCustomPriceModal(false)}
              activeOpacity={1}
            >
              <Text style={styles.modalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.9}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canProceed()}
          activeOpacity={0.9}
        >
          <Text style={styles.nextButtonText}>Review</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.l,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  customPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  customPriceButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#007AFF',
  },
  customPriceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  customPriceLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  customPriceValue: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  countriesSection: {
    marginTop: 16,
  },
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  countryChipSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF15',
  },
  countryChipText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
  },
  countryChipTextSelected: {
    color: '#007AFF',
    fontFamily: 'Nunito-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderStrong,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    margin: 20,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  nextButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    padding: 18,
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  paymentTypeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF15',
  },
  paymentTypeText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
  },
  paymentTypeTextSelected: {
    fontFamily: 'Nunito-SemiBold',
    color: '#007AFF',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#007AFF',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.danger,
    marginTop: 4,
  },
});

