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
import {
  hostVehicleFormShared as HV,
  hostVehiclePlaceholderColor,
  hostVehicleInputRuleColor,
} from './formFieldStyles';

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
        {/* Pricing Section */}
        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Price per day (KSh) *</Text>
          <TextInput
            style={HV.field}
            placeholder="0"
            value={formData.pricePerDay}
            onChangeText={(text) => updateFormData({ pricePerDay: text })}
            keyboardType="numeric"
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Price per week (KSh) *</Text>
          <TextInput
            style={HV.field}
            placeholder="0"
            value={formData.pricePerWeek}
            onChangeText={(text) => updateFormData({ pricePerWeek: text })}
            keyboardType="numeric"
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Price per month (KSh) *</Text>
          <TextInput
            style={HV.field}
            placeholder="0"
            value={formData.pricePerMonth}
            onChangeText={(text) => updateFormData({ pricePerMonth: text })}
            keyboardType="numeric"
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        {/* Rental Terms */}
        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Minimum rental days *</Text>
          <TextInput
            style={HV.field}
            placeholder="1"
            value={formData.minimumRentalDays}
            onChangeText={(text) => updateFormData({ minimumRentalDays: text })}
            keyboardType="numeric"
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Maximum rental days</Text>
          <Text style={styles.hint}>Optional — leave blank for no maximum</Text>
          <TextInput
            style={HV.field}
            placeholder="e.g., 30"
            value={formData.maxRentalDays}
            onChangeText={(text) => updateFormData({ maxRentalDays: text })}
            keyboardType="numeric"
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Pickup location</Text>
          <Text style={styles.hint}>Optional — exact spot can follow in the next step</Text>
          <TextInput
            style={HV.field}
            placeholder="e.g., Nakuru, Kenya"
            value={formData.pickupLocation}
            onChangeText={(text) => updateFormData({ pickupLocation: text })}
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={20} color={COLORS.brand} />
            <Text style={styles.locationButtonText}>Use current location</Text>
          </TouchableOpacity>
          {formData.pickupLat && formData.pickupLong && (
            <Text style={styles.hint}>
              Coordinates: {formData.pickupLat.toFixed(6)}, {formData.pickupLong.toFixed(6)}
            </Text>
          )}
        </View>

        <View style={HV.inputSection}>
          <Text style={HV.fieldLabel}>Age restriction *</Text>
          <TextInput
            style={HV.field}
            placeholder="e.g., 25 years and above"
            value={formData.ageRestriction}
            onChangeText={(text) => updateFormData({ ageRestriction: text })}
            placeholderTextColor={hostVehiclePlaceholderColor}
          />
        </View>

        {/* Car Rules */}
        <View style={[HV.inputSection, styles.rulesBlock]}>
          <Text style={HV.fieldLabel}>Car rules</Text>
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
                placeholderTextColor={hostVehiclePlaceholderColor}
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
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.muted,
    marginBottom: 10,
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
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingBottom: 12,
    marginTop: 4,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
    backgroundColor: 'transparent',
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.brand,
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
    marginTop: 8,
  },
  ruleCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
    backgroundColor: 'transparent',
  },
  ruleCheckboxSelected: {},
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: hostVehicleInputRuleColor,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    borderColor: COLORS.text,
    backgroundColor: COLORS.text,
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
    marginTop: 0,
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
    justifyContent: 'flex-start',
    paddingVertical: 14,
    marginTop: 4,
    gap: 8,
    backgroundColor: 'transparent',
  },
  addRuleButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.brand,
  },
  customRuleInputContainer: {
    marginTop: 12,
    gap: 12,
  },
  customRuleInput: {
    fontSize: 17,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    marginTop: 8,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hostVehicleInputRuleColor,
    backgroundColor: 'transparent',
  },
  customRuleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelRuleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hostVehicleInputRuleColor,
    borderRadius: RADIUS.card,
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
    borderRadius: RADIUS.card,
    padding: 14,
    backgroundColor: COLORS.brand,
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

