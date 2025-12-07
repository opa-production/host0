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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

  const canProceed = () => {
    return (
      formData.pricePerDay !== '' &&
      formData.minimumRentalDays !== '' &&
      formData.pickupLocation !== '' &&
      formData.ageRestriction !== ''
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
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

        <TouchableOpacity
          style={styles.customPriceButton}
          onPress={() => setShowCustomPriceModal(true)}
          activeOpacity={1}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FF1577" />
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
              <Ionicons name="close-circle" size={20} color="#FF1577" />
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
          <Text style={styles.label}>Pickup Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Nakuru, Kenya"
            value={formData.pickupLocation}
            onChangeText={(text) => updateFormData({ pickupLocation: text })}
            placeholderTextColor="#999999"
          />
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
            trackColor={{ false: '#e0e0e0', true: '#FF1577' }}
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
                      <Ionicons name="checkmark-circle" size={16} color="#FF1577" style={{ marginLeft: 6 }} />
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
          activeOpacity={1}
        >
          <Ionicons name="arrow-back" size={20} color="#000000" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canProceed()}
          activeOpacity={1}
        >
          <Text style={styles.nextButtonText}>Review</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
    backgroundColor: '#ffffff',
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
    borderColor: '#FF1577',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  customPriceButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF1577',
  },
  customPriceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  customPriceLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  customPriceValue: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
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
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  countryChipSelected: {
    borderColor: '#FF1577',
    backgroundColor: '#FF157715',
  },
  countryChipText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  countryChipTextSelected: {
    color: '#FF1577',
    fontFamily: 'Nunito-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  modalBody: {
    padding: 20,
  },
  modalSaveButton: {
    backgroundColor: '#FF1577',
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
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 18,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF1577',
    borderRadius: 12,
    padding: 18,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
});

