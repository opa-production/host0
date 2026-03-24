import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { updateCarSpecs, updateCarPricing, updateCarLocation } from '../services/carService';
import StatusModal from '../ui/StatusModal';

export default function EditCarScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { car } = route.params || {};

  // Initialize form data from car or defaults
  const [formData, setFormData] = useState({
    name: car?.name || '',
    model: car?.model || '',
    body: car?.body || '',
    year: car?.year || '',
    description: car?.description || '',
    seats: car?.seats || '',
    fuelType: car?.fuelType || '',
    transmission: car?.transmission || '',
    colour: car?.colour || '',
    mileage: car?.mileage || '',
    pricePerDay: car?.pricePerDay || '',
    pricePerWeek: car?.pricePerWeek || '',
    pricePerMonth: car?.pricePerMonth || '',
    minimumRentalDays: car?.minimumRentalDays || '',
    maxRentalDays: car?.maxRentalDays || '',
    ageRestriction: car?.ageRestriction || '',
    carRules: car?.carRules || '',
    pickupLocation: car?.pickupLocation || car?.location || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSave = async () => {
    const carId = car?.carId || car?.id;
    if (!carId) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Unable to save',
        message: 'Car ID is missing. Please go back and open this car again.',
      });
      return;
    }

    lightHaptic();
    setIsSaving(true);
    try {
      const specsPayload = {
        seats: formData.seats,
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        color: formData.colour,
        mileage: formData.mileage,
        features: Array.isArray(car?.features) ? car.features : [],
      };

      const rulesArray = String(formData.carRules || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const pricingPayload = {
        daily_rate: formData.pricePerDay,
        weekly_rate: formData.pricePerWeek,
        monthly_rate: formData.pricePerMonth,
        min_rental_days: formData.minimumRentalDays,
        max_rental_days: formData.maxRentalDays || null,
        min_age_requirement: formData.ageRestriction,
        rules: rulesArray,
      };

      const locationPayload = {
        pickup_location: formData.pickupLocation,
        dropoff_same_as_pickup: true,
      };

      const [specsResult, pricingResult, locationResult] = await Promise.all([
        updateCarSpecs(carId, specsPayload),
        updateCarPricing(carId, pricingPayload),
        updateCarLocation(carId, locationPayload),
      ]);

      const firstError = [specsResult, pricingResult, locationResult].find((r) => !r.success)?.error;
      if (firstError) {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Could not save changes',
          message: firstError || 'Please review your details and try again.',
        });
        return;
      }

      setStatusModal({
        visible: true,
        type: 'success',
        title: 'Changes saved',
        message: 'Car details were updated successfully.',
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Could not save changes',
        message: error?.message || 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Car</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.brand} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Car Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., BMW M3"
                value={formData.name}
                onChangeText={(text) => updateFormData({ name: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., G80"
                value={formData.model}
                onChangeText={(text) => updateFormData({ model: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Body Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sedan"
                value={formData.body}
                onChangeText={(text) => updateFormData({ body: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2023"
                value={formData.year}
                onChangeText={(text) => updateFormData({ year: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your car..."
                value={formData.description}
                onChangeText={(text) => updateFormData({ description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={COLORS.subtle}
              />
            </View>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Seats</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5"
                value={formData.seats}
                onChangeText={(text) => updateFormData({ seats: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fuel Type</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Petrol"
                value={formData.fuelType}
                onChangeText={(text) => updateFormData({ fuelType: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transmission</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Automatic"
                value={formData.transmission}
                onChangeText={(text) => updateFormData({ transmission: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Black"
                value={formData.colour}
                onChangeText={(text) => updateFormData({ colour: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mileage (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 15000"
                value={formData.mileage}
                onChangeText={(text) => updateFormData({ mileage: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>
          </View>

          {/* Rental Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Daily Rate (KSh)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 15000"
                value={formData.pricePerDay}
                onChangeText={(text) => updateFormData({ pricePerDay: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weekly Rate (KSh)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 90000"
                value={formData.pricePerWeek}
                onChangeText={(text) => updateFormData({ pricePerWeek: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Rate (KSh)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 320000"
                value={formData.pricePerMonth}
                onChangeText={(text) => updateFormData({ pricePerMonth: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minimum Rental Days</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2"
                value={formData.minimumRentalDays}
                onChangeText={(text) => updateFormData({ minimumRentalDays: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Rental Days</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 30"
                value={formData.maxRentalDays}
                onChangeText={(text) => updateFormData({ maxRentalDays: text })}
                keyboardType="numeric"
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age Restriction</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 25 years"
                value={formData.ageRestriction}
                onChangeText={(text) => updateFormData({ ageRestriction: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pickup Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Nakuru, Kenya"
                value={formData.pickupLocation}
                onChangeText={(text) => updateFormData({ pickupLocation: text })}
                placeholderTextColor={COLORS.subtle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Car Rules</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., No smoking allowed. No pets..."
                value={formData.carRules}
                onChangeText={(text) => updateFormData({ carRules: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={COLORS.subtle}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        primaryLabel="OK"
        onPrimary={() => {
          const shouldGoBack = statusModal.type === 'success';
          setStatusModal((prev) => ({ ...prev, visible: false }));
          if (shouldGoBack) {
            navigation.goBack();
          }
        }}
        onRequestClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
  },
  saveButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: COLORS.brand,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  inputGroup: {
    marginBottom: SPACING.m,
  },
  label: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.m,
    paddingVertical: 14,
    ...TYPE.body,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
});

