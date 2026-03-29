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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../ui/tokens';
import {
  hostVehicleFormShared as HV,
  hostVehiclePlaceholderColor,
  hostVehicleInputRuleColor,
} from './formFieldStyles';

const BODY_TYPES = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Pickup Truck', 'Van', 'Minivan', 'Sports Car', 'Luxury', 'Other'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => (CURRENT_YEAR - i).toString());

export default function BasicInfoScreen({ formData, updateFormData, onNext, isSubmitting = false }) {
  const insets = useSafeAreaInsets();
  const [showBodyDropdown, setShowBodyDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const canProceed = () => {
    return (
      formData.name.trim() !== '' &&
      formData.model.trim() !== '' &&
      formData.body !== '' &&
      formData.year !== '' &&
      formData.description.trim() !== ''
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
    <KeyboardAvoidingView
      style={HV.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={HV.scroll}
        contentContainerStyle={[HV.scrollContent, { paddingBottom: insets.bottom + 200 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={HV.formOutline}>
        {/* Car Name */}
        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Car name *</Text>
          <TextInput
            style={HV.field}
            placeholder="e.g., BMW M3"
            value={formData.name}
            onChangeText={(text) => updateFormData({ name: text })}
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        {/* Model */}
        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Model *</Text>
          <TextInput
            style={HV.field}
            placeholder="e.g., G80"
            value={formData.model}
            onChangeText={(text) => updateFormData({ model: text })}
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        {/* Body Type */}
        <Dropdown
          label="Body Type"
          value={formData.body}
          options={BODY_TYPES}
          visible={showBodyDropdown}
          onSelect={(value) => updateFormData({ body: value })}
          onToggle={() => setShowBodyDropdown(!showBodyDropdown)}
        />

        {/* Year */}
        <Dropdown
          label="Year"
          value={formData.year}
          options={YEARS}
          visible={showYearDropdown}
          onSelect={(value) => updateFormData({ year: value })}
          onToggle={() => setShowYearDropdown(!showYearDropdown)}
        />

        {/* Description */}
        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Description *</Text>
          <TextInput
            style={HV.fieldArea}
            placeholder="Describe your car, its features, condition, etc."
            value={formData.description}
            onChangeText={(text) => updateFormData({ description: text })}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        <View style={HV.formActions}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  nextButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
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

