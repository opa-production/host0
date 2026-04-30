import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPE, SPACING } from '../ui/tokens';
import { createCarBasics, updateCarSpecs, updateCarPricing, saveVehicleImageUrls } from '../services/carService';
import { uploadVehicleImages, uploadVehicleVideo } from '../services/mediaService';
import CitySelectionScreen, { HOST_LISTING_CITIES } from './HostVehicle/CitySelectionScreen';
import BasicInfoScreen from './HostVehicle/BasicInfoMediaScreen';
import MediaUploadScreen from './HostVehicle/MediaUploadScreen';
import CarSpecsScreen from './HostVehicle/CarSpecsScreen';
import RentalInfoScreen from './HostVehicle/RentalInfoScreen';
import ReviewScreen from './HostVehicle/ReviewScreen';
import StatusModal from "../ui/StatusModal";

const LISTING_STEP_TITLES = [
  'Your area',
  'Basic Info',
  'Specifications',
  'Rental Info',
  'Upload Media',
  'Review',
];

const HOST_CITY_NAME_BY_ID = HOST_LISTING_CITIES.reduce((acc, city) => {
  acc[city.id] = city.name;
  return acc;
}, {});

export default function HostVehicleScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const existingCar = route?.params?.existingCar;
  const existingCarId = route?.params?.carId;
  
  const [currentStep, setCurrentStep] = useState(() =>
    existingCar ? 1 : 0
  );
  const [carId, setCarId] = useState(existingCarId || existingCar?.carId || existingCar?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const totalSteps = existingCar ? 5 : 6;
  const [formData, setFormData] = useState({
    // Step 0: Listing city (new listings only)
    hostCityId: existingCar?.hostCityId || null,
    hostCityName: existingCar?.hostCityName || null,
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
    if (currentStep === 4) {
      if (!formData.coverPhoto) {
        Alert.alert('Incomplete Information', 'Please add a cover photo.');
        return;
      }
      if (!formData.images || formData.images.length < 4) {
        Alert.alert('Incomplete Information', 'Please add at least 4 photos.');
        return;
      }

      const currentCarId = carId || formData.carId;
      
      // OPTIMIZATION: Instant transition if everything is already uploaded in background
      const allImagesUploaded = formData.coverPhotoUrl && formData.imageUrls && formData.imageUrls.length >= (formData.images.length + 1);
      const videoUploaded = !formData.video || (formData.video && formData.videoUrl);

      if (allImagesUploaded && videoUploaded) {
        console.log('⚡ [Optimized] Instant transition Step 4 -> 5');
        setCurrentStep(5);
        return;
      }

      setIsSubmitting(true);
      try {
        const uploadResults = {
          coverPhoto: formData.coverPhotoUrl || null,
          images: formData.imageUrls || [],
          video: formData.videoUrl || null,
        };

        if (!uploadResults.coverPhoto || uploadResults.images.length < formData.images.length) {
          const allImages = [formData.coverPhoto, ...formData.images];
          const imagesResult = await uploadVehicleImages(
            allImages.map((uri, index) => ({
              uri: uri, name: `image_${index}.jpg`, type: 'image/jpeg'
            })),
            currentCarId
          );
          if (imagesResult.success) {
            uploadResults.images = imagesResult.urls || [];
            uploadResults.coverPhoto = uploadResults.images[0] || null;
          }
        }

        if (formData.video && !uploadResults.video) {
          const videoResult = await uploadVehicleVideo({
            uri: formData.video, name: 'video.mp4', type: 'video/mp4'
          }, currentCarId);
          if (videoResult.success) uploadResults.video = videoResult.url;
        }

        updateFormData({
          coverPhotoUrl: uploadResults.coverPhoto,
          imageUrls: uploadResults.images,
          videoUrl: uploadResults.video,
        });
        setCurrentStep(5);
      } catch (error) {
        Alert.alert('Upload Error', error.message);
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 1) {
      if (!formData.name.trim() || !formData.model.trim() || !formData.body || !formData.year || !formData.description.trim()) {
        Alert.alert('Incomplete Information', 'Please fill required fields.');
        return;
      }
      setIsSubmitting(true);
      try {
        if (carId) { setCurrentStep(2); return; }
        const result = await createCarBasics({
          name: formData.name, model: formData.model, body_type: formData.body,
          year: formData.year, description: formData.description,
          city: formData.hostCityName || undefined,
        });
        if (result.success && result.carId) {
          setCarId(result.carId);
          updateFormData({ carId: result.carId });
          setCurrentStep(2);
        } else {
          if (result.error?.includes('limit of 10 car listings')) {
            Alert.alert('Listing Limit Reached', result.error);
          } else {
            Alert.alert('Error', result.error || 'Failed to create listing');
          }
        }
      } catch (error) { Alert.alert('Error', error.message); }
      finally { setIsSubmitting(false); }
    } else if (currentStep === 2) {
      if (!formData.seats || !formData.fuelType || !formData.transmission || !formData.colour) {
        Alert.alert('Incomplete Information', 'Please fill required fields.');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await updateCarSpecs(carId || formData.carId, {
          seats: formData.seats, fuel_type: formData.fuelType,
          transmission: formData.transmission, color: formData.colour,
          mileage: formData.mileage, features: formData.features || [],
        });
        if (result.success) setCurrentStep(3);
        else Alert.alert('Error', result.error);
      } catch (error) { Alert.alert('Error', error.message); }
      finally { setIsSubmitting(false); }
    } else if (currentStep === 3) {
      if (!formData.pricePerDay || !formData.pricePerWeek || !formData.pricePerMonth || 
          !formData.minimumRentalDays || !formData.ageRestriction) {
        Alert.alert('Incomplete Information', 'Please fill required fields.');
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await updateCarPricing(carId || formData.carId, {
          daily_rate: formData.pricePerDay, weekly_rate: formData.pricePerWeek,
          monthly_rate: formData.pricePerMonth, min_rental_days: formData.minimumRentalDays,
          max_rental_days: formData.maxRentalDays || null, min_age_requirement: formData.ageRestriction,
          rules: formData.carRules || [],
        });
        if (result.success) setCurrentStep(4);
        else Alert.alert('Error', result.error);
      } catch (error) { Alert.alert('Error', error.message); }
      finally { setIsSubmitting(false); }
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else if (currentStep === 1 && !existingCar) setCurrentStep(0);
  };

  const handleHeaderBack = () => {
    if (currentStep === 0) navigation.goBack();
    else if (currentStep === 1 && !existingCar) setCurrentStep(0);
    else if (currentStep > 1) prevStep();
    else navigation.goBack();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const currentCarId = carId || formData.carId;
      const coverUrl = formData.coverPhotoUrl || (formData.imageUrls && formData.imageUrls[0]) || null;
      const imageUrls = formData.imageUrls || [];
      const videoUrl = formData.videoUrl || null;
      
      if (imageUrls.length > 0) {
        await saveVehicleImageUrls(currentCarId, coverUrl, imageUrls, videoUrl);
      }
      
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit car. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CitySelectionScreen
            selectedCityId={formData.hostCityId}
            onSelectCity={(city) => {
              updateFormData({
                hostCityId: city.id,
                hostCityName: city.name,
              });
              setCurrentStep(1);
            }}
          />
        );
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
            isSubmitting={isSubmitting}
          />
        );
      case 5:
        return (
          <ReviewScreen
            formData={formData}
            onBack={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  const stepTitle = LISTING_STEP_TITLES[currentStep] ?? LISTING_STEP_TITLES[0];
  const stepNumberDisplay = existingCar ? currentStep : currentStep + 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Header with Progress */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <Text style={styles.stepTitle}>{stepTitle}</Text>
            <Text style={styles.stepIndicator}>
              Step {stepNumberDisplay} of {totalSteps}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${(stepNumberDisplay / totalSteps) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Step Content */}
      {renderStep()}

      <StatusModal
        visible={showSuccessModal}
        type="success"
        title="Success!"
        message="Your car has been submitted for verification. You will see it in your garage shortly."
        onPrimary={() => {
          setShowSuccessModal(false);
          navigation.navigate('MainTabs', { screen: 'My Cars' });
        }}
        primaryLabel="Go to Garage"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
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

