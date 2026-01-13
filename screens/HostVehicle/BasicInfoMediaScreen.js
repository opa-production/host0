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
import { COLORS, SPACING } from '../../ui/tokens';

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
      <View style={styles.card}>
        {/* Car Name */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Car Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., BMW M3"
            value={formData.name}
            onChangeText={(text) => updateFormData({ name: text })}
            placeholderTextColor="#999999"
          />
        </View>
        <View style={styles.separator} />

        {/* Model */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Model *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., G80"
            value={formData.model}
            onChangeText={(text) => updateFormData({ model: text })}
            placeholderTextColor="#999999"
          />
        </View>
        <View style={styles.separator} />

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
        <View style={styles.inputSection}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your car, its features, condition, etc."
            value={formData.description}
            onChangeText={(text) => updateFormData({ description: text })}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#999999"
          />
        </View>
      </View>

      {/* Next Button */}
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
  textArea: {
    height: 120,
    paddingTop: 16,
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

