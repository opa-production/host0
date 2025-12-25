import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING } from '../ui/tokens';
import BasicInfoScreen from './HostVehicle/BasicInfoMediaScreen';
import MediaUploadScreen from './HostVehicle/MediaUploadScreen';
import CarSpecsScreen from './HostVehicle/CarSpecsScreen';
import RentalInfoScreen from './HostVehicle/RentalInfoScreen';
import ReviewScreen from './HostVehicle/ReviewScreen';

export default function HostVehicleScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    model: '',
    body: '',
    year: '',
    description: '',
    
    // Step 2: Media
    coverPhoto: null,
    images: [],
    video: null,
    
    // Step 3: Car Specifications
    seats: '',
    fuelType: '',
    transmission: '',
    colour: '',
    features: [],
    
    // Step 4: Rental Info & Pricing
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    customPrice: '',
    customPriceLabel: '',
    minimumRentalDays: '',
    maxRentalDays: '',
    pickupLocation: '',
    pickupLat: null,
    pickupLong: null,
    carRules: '',
    crossCountryAllowed: false,
    allowedCountries: [],
    ageRestriction: '',
    carValue: '',
    paymentType: 'full', // 'full' or 'deposit'
    securityDepositAmount: '',
  });

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // TODO: Submit to API
    console.log('Submitting car listing:', formData);
    navigation.goBack();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <MediaUploadScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <CarSpecsScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <RentalInfoScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <ReviewScreen
            formData={formData}
            onBack={prevStep}
            onSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  const stepTitles = ['Basic Info', 'Upload Media', 'Specifications', 'Rental Info', 'Review'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header with Progress */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <Text style={styles.stepTitle}>{stepTitles[currentStep - 1]}</Text>
            <Text style={styles.stepIndicator}>
              Step {currentStep} of 5
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${(currentStep / 5) * 100}%` }]} />
        </View>
      </View>

      {/* Step Content */}
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  stepIndicator: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.brand,
    borderRadius: 2,
  },
});

