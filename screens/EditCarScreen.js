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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

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

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSave = () => {
    // TODO: Save to API
    console.log('Saving car edits:', formData);
    lightHaptic();
    navigation.goBack();
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
        >
          <Text style={styles.saveButtonText}>Save</Text>
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

