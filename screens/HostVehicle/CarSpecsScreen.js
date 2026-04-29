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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../ui/tokens';
import {
  hostVehicleFormShared as HV,
  hostVehiclePlaceholderColor,
  hostVehicleInputRuleColor,
} from './formFieldStyles';
import AppLoader from "../../ui/AppLoader";

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

  const Dropdown = ({ label, value, options, visible, onSelect, onToggle }) => (
    <View>
      <View style={HV.inputSection}>
        <Text style={HV.fieldLabel}>{label} *</Text>
        <TouchableOpacity
          style={HV.dropdownRow}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <Text style={[styles.dropdownText, !value && styles.placeholder]}>
            {value || `Select ${label}`}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.subtle} />
        </TouchableOpacity>
      </View>

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
      style={HV.scroll}
      contentContainerStyle={[HV.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
        <View style={HV.formOutline}>
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
        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Mileage</Text>
          <Text style={styles.hint}>Current odometer reading in kilometers</Text>
          <TextInput
            style={HV.field}
            placeholder="e.g., 15000"
            value={formData.mileage}
            onChangeText={(text) => updateFormData({ mileage: text })}
            keyboardType="numeric"
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        {/* Features */}
        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Features</Text>
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
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.brand} style={{ marginLeft: 6 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[HV.formActions, styles.buttonRow]}>
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
              <AppLoader color="#ffffff" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.muted,
    marginBottom: 10,
  },
  dropdownText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    flex: 1,
  },
  placeholder: {
    color: hostVehiclePlaceholderColor,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hostVehicleInputRuleColor,
    backgroundColor: 'transparent',
  },
  featureChipSelected: {
    borderColor: COLORS.brand,
    backgroundColor: 'transparent',
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

