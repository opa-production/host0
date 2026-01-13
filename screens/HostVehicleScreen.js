import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPE, SPACING } from '../ui/tokens';
import { createCarBasics, updateCarSpecs, updateCarPricing, updateCarLocation } from '../services/carService';
import BasicInfoScreen from './HostVehicle/BasicInfoMediaScreen';
import MediaUploadScreen from './HostVehicle/MediaUploadScreen';
import CarSpecsScreen from './HostVehicle/CarSpecsScreen';
import RentalInfoScreen from './HostVehicle/RentalInfoScreen';
import ReviewScreen from './HostVehicle/ReviewScreen';

export default function HostVehicleScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existingCar = route?.params?.existingCar;
  const existingCarId = route?.params?.carId;
  
  // Determine initial step based on existing car data
  const getInitialStep = () => {
    if (!existingCar) return 1;
    // If car has specs, move to step 3
    if (existingCar.seats && existingCar.fuelType && existingCar.transmission) {
      // If car has pricing, move to step 4
      if (existingCar.pricePerDay && existingCar.pricePerWeek && existingCar.pricePerMonth) {
        // If car has location, move to step 5
        if (existingCar.pickupLocation || (existingCar.pickupLat && existingCar.pickupLong)) {
          return 5; // Media/Review step
        }
        return 4; // Location step
      }
      return 3; // Pricing step
    }
    return 2; // Specs step
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [carId, setCarId] = useState(existingCarId || existingCar?.carId || existingCar?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: existingCar?.name || '',
    model: existingCar?.model || '',
    body: existingCar?.body || existingCar?.body_type || '',
    year: existingCar?.year || '',
    description: existingCar?.description || '',
    
    // Step 5: Media (moved to last)
    coverPhoto: existingCar?.coverPhoto || null,
    images: existingCar?.images || [],
    video: existingCar?.video || null,
    
    // Step 2: Car Specifications
    seats: existingCar?.seats || '',
    fuelType: existingCar?.fuelType || existingCar?.fuel_type || '',
    transmission: existingCar?.transmission || '',
    colour: existingCar?.colour || existingCar?.color || '',
    mileage: existingCar?.mileage || '',
    features: existingCar?.features || [],
    
    // Step 3: Rental Info & Pricing
    pricePerDay: existingCar?.pricePerDay?.toString() || existingCar?.daily_rate?.toString() || '',
    pricePerWeek: existingCar?.pricePerWeek?.toString() || existingCar?.weekly_rate?.toString() || '',
    pricePerMonth: existingCar?.pricePerMonth?.toString() || existingCar?.monthly_rate?.toString() || '',
    minimumRentalDays: existingCar?.minimumRentalDays || existingCar?.min_rental_days?.toString() || '',
    maxRentalDays: existingCar?.maxRentalDays || existingCar?.max_rental_days?.toString() || '',
    pickupLocation: existingCar?.pickupLocation || existingCar?.location_name || '',
    pickupLat: existingCar?.pickupLat || existingCar?.latitude || null,
    pickupLong: existingCar?.pickupLong || existingCar?.longitude || null,
    carRules: existingCar?.carRules || existingCar?.rules || [],
    ageRestriction: existingCar?.ageRestriction || existingCar?.min_age_requirement?.toString() || '',
  });


  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = async () => {
    // If moving from step 1 to step 2, create car with basic info via API
    if (currentStep === 1) {
      // Validate basic info before proceeding
      if (!formData.name.trim() || !formData.model.trim() || !formData.body || !formData.year || !formData.description.trim()) {
        Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
        return;
      }

      setIsSubmitting(true);
      
      try {
        // If we already have a carId, skip creation and just move to next step
        if (carId) {
          setCurrentStep(2);
          setIsSubmitting(false);
          return;
        }

        const result = await createCarBasics({
          name: formData.name,
          model: formData.model,
          body_type: formData.body,
          year: formData.year,
          description: formData.description,
        });

        if (result.success && result.carId) {
          // Store the car ID for subsequent steps
          setCarId(result.carId);
          setFormData(prev => ({ ...prev, carId: result.carId }));
          setCurrentStep(2);
        } else {
          Alert.alert(
            'Error',
            result.error || 'Failed to create car. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error creating car basics:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to create car. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 2) {
      // If moving from step 2 to step 3, update car with specs via API
      // Validate specs before proceeding
      if (!formData.seats || !formData.fuelType || !formData.transmission || !formData.colour) {
        Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
        return;
      }

      if (!carId && !formData.carId) {
        Alert.alert('Error', 'Car ID is missing. Please go back and complete the basic information step.');
        return;
      }

      setIsSubmitting(true);
      
      try {
        const result = await updateCarSpecs(carId || formData.carId, {
          seats: formData.seats,
          fuel_type: formData.fuelType,
          transmission: formData.transmission,
          color: formData.colour,
          mileage: formData.mileage,
          features: formData.features || [],
        });

        if (result.success) {
          setCurrentStep(3);
        } else {
          Alert.alert(
            'Error',
            result.error || 'Failed to update car specifications. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error updating car specs:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to update car specifications. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 3) {
      // If moving from step 3 to step 4, update car with pricing via API
      // Validate pricing before proceeding
      if (!formData.pricePerDay || !formData.pricePerWeek || !formData.pricePerMonth || 
          !formData.minimumRentalDays || !formData.ageRestriction) {
        Alert.alert('Incomplete Information', 'Please fill in all required pricing fields before proceeding.');
        return;
      }

      if (!carId && !formData.carId) {
        Alert.alert('Error', 'Car ID is missing. Please go back and complete the basic information step.');
        return;
      }

      setIsSubmitting(true);
      
      try {
        const result = await updateCarPricing(carId || formData.carId, {
          daily_rate: formData.pricePerDay,
          weekly_rate: formData.pricePerWeek,
          monthly_rate: formData.pricePerMonth,
          min_rental_days: formData.minimumRentalDays,
          max_rental_days: formData.maxRentalDays || null,
          min_age_requirement: formData.ageRestriction,
          rules: formData.carRules || [],
        });

        if (result.success) {
          setCurrentStep(4);
        } else {
          Alert.alert(
            'Error',
            result.error || 'Failed to update car pricing. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error updating car pricing:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to update car pricing. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 4) {
      // If moving from step 4 to step 5, update car location via API
      // Validate location before proceeding
      if (!formData.pickupLocation && (!formData.pickupLat || !formData.pickupLong)) {
        Alert.alert('Incomplete Information', 'Please provide a pickup location before proceeding.');
        return;
      }

      if (!carId && !formData.carId) {
        Alert.alert('Error', 'Car ID is missing. Please go back and complete the basic information step.');
        return;
      }

      setIsSubmitting(true);
      
      try {
        const result = await updateCarLocation(carId || formData.carId, {
          location_name: formData.pickupLocation,
          latitude: formData.pickupLat,
          longitude: formData.pickupLong,
        });

        if (result.success) {
          setCurrentStep(5);
        } else {
          Alert.alert(
            'Error',
            result.error || 'Failed to update car location. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error updating car location:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to update car location. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep < 5) {
      // For other steps, just move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const HOST_CARS_KEY = '@host_cars';
      
      // Get existing cars
      const existingCars = await AsyncStorage.getItem(HOST_CARS_KEY);
      const cars = existingCars ? JSON.parse(existingCars) : [];
      
      // Check for duplicates based on name and model
      const isDuplicate = cars.some(car => 
        car.name === formData.name && 
        car.model === formData.model &&
        car.year === formData.year
      );
      
      if (isDuplicate) {
        Alert.alert('Duplicate Car', 'A car with the same name, model, and year already exists.');
        return;
      }
      
      // Create new car object
      const newCar = {
        ...formData,
        id: `car-${Date.now()}`,
        status: 'awaiting_verification',
        createdAt: new Date().toISOString(),
        totalTrips: 0,
      };
      
      // Add new car to array
      cars.push(newCar);
      
      // Save to storage
      await AsyncStorage.setItem(HOST_CARS_KEY, JSON.stringify(cars));
      
      console.log('Car saved locally:', newCar);
      
      // Navigate to My Cars tab to see the car
      navigation.navigate('MainTabs', { screen: 'My Cars' });
    } catch (error) {
      console.error('Error saving car:', error);
      Alert.alert('Error', 'Failed to save car. Please try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            isSubmitting={isSubmitting}
          />
        );
      case 2:
        return (
          <CarSpecsScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 3:
        return (
          <RentalInfoScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <MediaUploadScreen
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

  const stepTitles = ['Basic Info', 'Specifications', 'Rental Info', 'Upload Media', 'Review'];

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

