import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BasicInfoMediaScreen from './HostVehicle/BasicInfoMediaScreen';
import CarSpecsScreen from './HostVehicle/CarSpecsScreen';
import RentalInfoScreen from './HostVehicle/RentalInfoScreen';
import ReviewScreen from './HostVehicle/ReviewScreen';

export default function HostVehicleScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info & Media
    name: '',
    model: '',
    images: [],
    video: null,
    description: '',
    
    // Step 2: Car Specifications
    seats: '',
    fuelType: '',
    transmission: '',
    colour: '',
    features: [],
    
    // Step 3: Rental Info
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    customPrice: '',
    customPriceLabel: '',
    minimumRentalDays: '',
    pickupLocation: '',
    carRules: '',
    crossCountryAllowed: false,
    allowedCountries: [],
    ageRestriction: '',
  });

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
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
          <BasicInfoMediaScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <CarSpecsScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <RentalInfoScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
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

  const stepTitles = ['Basic Info', 'Specifications', 'Rental Info', 'Review'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with Progress */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={1}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <Text style={styles.stepIndicator}>
            Step {currentStep} of 4
          </Text>
          <Text style={styles.stepTitle}>{stepTitles[currentStep - 1]}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${(currentStep / 4) * 100}%` }]} />
          </View>
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
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  progressContainer: {
    marginTop: 4,
  },
  stepIndicator: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#e8e8e8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF1577',
    borderRadius: 2,
  },
});

