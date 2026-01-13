import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../ui/tokens';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT'];
const COLOURS = [
  'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Brown', 'Beige', 'Gold', 'Other'
];
const FEATURES = [
  'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Port', 'Sunroof',
  'Leather Seats', 'Heated Seats', 'Backup Camera', 'Parking Sensors',
  'Cruise Control', 'Keyless Entry', 'Remote Start', 'WiFi', 'Child Seat',
];

export default function CarSpecsScreen({ formData, updateFormData, onNext, onBack, isSubmitting = false }) {
  const insets = useSafeAreaInsets();
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState(false);
  const [showColourDropdown, setShowColourDropdown] = useState(false);
  const [showSeatsDropdown, setShowSeatsDropdown] = useState(false);

  const seatsOptions = Array.from({ length: 8 }, (_, i) => (i + 2).toString());

  const toggleFeature = (feature) => {
    const features = formData.features || [];
    if (features.includes(feature)) {
      updateFormData({ features: features.filter(f => f !== feature) });
    } else {
      updateFormData({ features: [...features, feature] });
    }
  };

  const canProceed = () => {
    return (
      formData.seats !== '' &&
      formData.fuelType !== '' &&
      formData.transmission !== '' &&
      formData.colour !== ''
    );
  };

  const Dropdown = ({ label, value, options, visible, onSelect, onToggle, showSeparator = true }) => (
    <View>
      <View style={styles.inputSection}>
        <Text style={styles.label}>{label} *</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={onToggle}
          activeOpacity={1}
        >
          <Text style={[styles.dropdownText, !value && styles.placeholder]}>
            {value || `Select ${label}`}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      {showSeparator && <View style={styles.separator} />}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onToggle}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onToggle}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={onToggle} activeOpacity={1}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    onSelect(item);
                    onToggle();
                  }}
                  activeOpacity={1}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {value === item && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        {/* Seats */}
        <Dropdown
          label="Seats Capacity"
          value={formData.seats}
          options={seatsOptions}
          visible={showSeatsDropdown}
          onSelect={(value) => updateFormData({ seats: value })}
          onToggle={() => setShowSeatsDropdown(!showSeatsDropdown)}
        />

        {/* Fuel Type */}
        <Dropdown
          label="Fuel Type"
          value={formData.fuelType}
          options={FUEL_TYPES}
          visible={showFuelDropdown}
          onSelect={(value) => updateFormData({ fuelType: value })}
          onToggle={() => setShowFuelDropdown(!showFuelDropdown)}
        />

        {/* Transmission */}
        <Dropdown
          label="Transmission"
          value={formData.transmission}
          options={TRANSMISSIONS}
          visible={showTransmissionDropdown}
          onSelect={(value) => updateFormData({ transmission: value })}
          onToggle={() => setShowTransmissionDropdown(!showTransmissionDropdown)}
        />

        {/* Colour */}
        <Dropdown
          label="Colour"
          value={formData.colour}
          options={COLOURS}
          visible={showColourDropdown}
          onSelect={(value) => updateFormData({ colour: value })}
          onToggle={() => setShowColourDropdown(!showColourDropdown)}
        />

        {/* Mileage */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Mileage</Text>
          <Text style={styles.hint}>Current odometer reading in kilometers</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 15000"
            value={formData.mileage}
            onChangeText={(text) => updateFormData({ mileage: text })}
            keyboardType="numeric"
            placeholderTextColor="#999999"
          />
        </View>
        <View style={styles.separator} />

        {/* Features */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Features</Text>
          <Text style={styles.hint}>Select all that apply</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature) => {
              const isSelected = (formData.features || []).includes(feature);
              return (
                <TouchableOpacity
                  key={feature}
                  style={[styles.featureChip, isSelected && styles.featureChipSelected]}
                  onPress={() => toggleFeature(feature)}
                  activeOpacity={1}
                >
                  <Text
                    style={[
                      styles.featureChipText,
                      isSelected && styles.featureChipTextSelected,
                    ]}
                  >
                    {feature}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#007AFF" style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

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
          style={[styles.nextButton, (!canProceed() || isSubmitting) && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={!canProceed() || isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  inputSection: {
    padding: SPACING.m,
  },
  separator: {
    height: 1,
    backgroundColor: '#CCCCCC',
    marginHorizontal: SPACING.m,
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
    backgroundColor: '#F9F9F9',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    flex: 1,
  },
  placeholder: {
    color: '#999999',
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
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
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
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  featureChipSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF15',
  },
  featureChipText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
  },
  featureChipTextSelected: {
    color: '#007AFF',
    fontFamily: 'Nunito-SemiBold',
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
    backgroundColor: '#000000',
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
});

