import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS } from '../../ui/tokens';

const COMMON_RULES = [
  'No smoking',
  'No pets',
  'Return with full tank',
  'No off-road driving',
  'Minimum age requirement applies',
  'Valid driver\'s license required',
  'No towing allowed',
];

export default function RentalInfoScreen({ formData, updateFormData, onNext, onBack, isSubmitting = false }) {
  const insets = useSafeAreaInsets();
  const [showCustomRuleInput, setShowCustomRuleInput] = useState(false);
  const [customRuleText, setCustomRuleText] = useState('');
  
  // Initialize carRules as array if not already
  const carRules = Array.isArray(formData.carRules) ? formData.carRules : [];

  const toggleRule = (rule) => {
    const rules = Array.isArray(formData.carRules) ? formData.carRules : [];
    if (rules.includes(rule)) {
      updateFormData({ carRules: rules.filter(r => r !== rule) });
    } else {
      updateFormData({ carRules: [...rules, rule] });
    }
  };

  const addCustomRule = () => {
    if (customRuleText.trim()) {
      const rules = Array.isArray(formData.carRules) ? formData.carRules : [];
      updateFormData({ carRules: [...rules, customRuleText.trim()] });
      setCustomRuleText('');
      setShowCustomRuleInput(false);
    }
  };

  const removeRule = (rule) => {
    const rules = Array.isArray(formData.carRules) ? formData.carRules : [];
    updateFormData({ carRules: rules.filter(r => r !== rule) });
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


  const canProceed = () => {
    return (
      formData.pricePerDay !== '' &&
      formData.pricePerWeek !== '' &&
      formData.pricePerMonth !== '' &&
      formData.minimumRentalDays !== '' &&
      formData.ageRestriction !== ''
    );
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
          <Text style={styles.label}>Price per Week (KSh) *</Text>
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
          <Text style={styles.label}>Price per Month (KSh) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.pricePerMonth}
            onChangeText={(text) => updateFormData({ pricePerMonth: text })}
            keyboardType="numeric"
            placeholderTextColor="#999999"
          />
        </View>

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
          <Text style={styles.label}>Pickup Location</Text>
          <Text style={styles.hint}>Optional - Will be set in the next step</Text>
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
        <Text style={styles.hint}>Select rules that apply to your vehicle</Text>
        
        {/* Common Rules */}
        <View style={styles.rulesContainer}>
          {COMMON_RULES.map((rule) => {
            const isSelected = carRules.includes(rule);
            return (
              <TouchableOpacity
                key={rule}
                style={[styles.ruleCheckbox, isSelected && styles.ruleCheckboxSelected]}
                onPress={() => toggleRule(rule)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#000000" />
                  )}
                </View>
                <Text style={[styles.ruleText, isSelected && styles.ruleTextSelected]}>
                  {rule}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Rules */}
        {carRules.filter(rule => !COMMON_RULES.includes(rule)).map((rule, index) => (
          <View key={`custom-${index}`} style={styles.customRuleRow}>
            <Text style={styles.customRuleText}>{rule}</Text>
            <TouchableOpacity
              onPress={() => removeRule(rule)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add More Button */}
        {!showCustomRuleInput ? (
          <TouchableOpacity
            style={styles.addRuleButton}
            onPress={() => setShowCustomRuleInput(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addRuleButtonText}>Add More</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.customRuleInputContainer}>
            <TextInput
              style={styles.customRuleInput}
              placeholder="Enter custom rule"
              value={customRuleText}
              onChangeText={setCustomRuleText}
              placeholderTextColor="#999999"
              autoFocus
            />
            <View style={styles.customRuleActions}>
              <TouchableOpacity
                style={styles.cancelRuleButton}
                onPress={() => {
                  setShowCustomRuleInput(false);
                  setCustomRuleText('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelRuleText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addRuleConfirmButton, !customRuleText.trim() && styles.addRuleConfirmButtonDisabled]}
                onPress={addCustomRule}
                disabled={!customRuleText.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.addRuleConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  rulesContainer: {
    marginTop: 12,
    gap: 12,
  },
  ruleCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  ruleCheckboxSelected: {
    borderColor: '#000000',
    backgroundColor: COLORS.surface,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
  },
  ruleTextSelected: {
    fontFamily: 'Nunito-SemiBold',
  },
  customRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginTop: 8,
  },
  customRuleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
  },
  addRuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  addRuleButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#007AFF',
  },
  customRuleInputContainer: {
    marginTop: 12,
    gap: 12,
  },
  customRuleInput: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  customRuleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelRuleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 14,
    backgroundColor: COLORS.surface,
  },
  cancelRuleText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  addRuleConfirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#007AFF',
  },
  addRuleConfirmButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  addRuleConfirmText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
});

