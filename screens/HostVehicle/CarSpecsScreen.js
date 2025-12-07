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

export default function CarSpecsScreen({ formData, updateFormData, onNext, onBack }) {
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
    <View style={styles.section}>
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
                    <Ionicons name="checkmark" size={20} color="#FF1577" />
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

      {/* Features */}
      <View style={styles.section}>
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
                  <Ionicons name="checkmark-circle" size={18} color="#FF1577" style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
          <Text style={styles.nextButtonText}>Next: Rental Info</Text>
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
    marginBottom: 24,
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
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
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  featureChipSelected: {
    borderColor: '#FF1577',
    backgroundColor: '#FF157715',
  },
  featureChipText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  featureChipTextSelected: {
    color: '#FF1577',
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

