import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPE, SPACING } from '../ui/tokens';
import { createCarBasics, updateCarSpecs, updateCarPricing, saveVehicleImageUrls } from '../services/carService';
import { uploadVehicleImages, uploadVehicleVideo } from '../services/mediaService';
import { myListingsScreenCache } from '../utils/screenDataCache';
import CitySelectionScreen, { HOST_LISTING_CITIES } from './HostVehicle/CitySelectionScreen';
import BasicInfoScreen from './HostVehicle/BasicInfoMediaScreen';
import MediaUploadScreen from './HostVehicle/MediaUploadScreen';
import CarSpecsScreen from './HostVehicle/CarSpecsScreen';
import RentalInfoScreen from './HostVehicle/RentalInfoScreen';
import ReviewScreen from './HostVehicle/ReviewScreen';
import AppLoader from "../ui/AppLoader";

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

  const [currentStep, setCurrentStep] = useState(() =>
    existingCar ? getInitialStep() : 0
  );
  const [carId, setCarId] = useState(existingCarId || existingCar?.carId || existingCar?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    // If moving from step 1 to step 2, create car with basic info via API
    if (currentStep === 1) {
      // Validate basic info before proceeding
      if (!formData.name.trim() || !formData.model.trim() || !formData.body || !formData.year || !formData.description.trim()) {
        Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
        return;
      }
      if (!formData.hostCityName && !formData.hostCityId) {
        Alert.alert('Missing city', 'Please select an operating city first.');
        setCurrentStep(0);
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

        const selectedCityName =
          formData.hostCityName ||
          (formData.hostCityId ? HOST_CITY_NAME_BY_ID[formData.hostCityId] : null);

        const result = await createCarBasics({
          name: formData.name,
          model: formData.model,
          body_type: formData.body,
          year: formData.year,
          description: formData.description,
          city: selectedCityName || undefined,
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
      // If moving from step 4 to step 5, upload media via API
      // Validate media before proceeding
      if (!formData.coverPhoto) {
        Alert.alert('Incomplete Information', 'Please add a cover photo before proceeding.');
        return;
      }
      if (!formData.images || formData.images.length < 4) {
        Alert.alert('Incomplete Information', 'Please add at least 4 photos before proceeding.');
        return;
      }

      if (!carId && !formData.carId) {
        Alert.alert('Error', 'Car ID is missing. Please go back and complete the basic information step.');
        return;
      }

      setIsSubmitting(true);
      
      try {
        const currentCarId = carId || formData.carId;
        const uploadResults = {
          coverPhoto: formData.coverPhotoUrl || null,
          images: formData.imageUrls || [],
          video: formData.videoUrl || null,
        };

        // If any media is missing its uploaded URL, upload it now
        if (!uploadResults.coverPhoto || uploadResults.images.length < formData.images.length) {
          console.log('📸 [Media Upload] Some media not uploaded yet, starting remaining uploads...');
          
          // Identify which images need uploading
          // For simplicity, if we don't have all imageUrls, we re-upload everything that's not in imageUrls
          // But wait, it's easier to just re-upload everything if we are missing any, 
          // OR better: check if we have enough URLs.
          
          if (!uploadResults.coverPhoto || uploadResults.images.length < formData.images.length) {
            const allImages = [formData.coverPhoto, ...formData.images];
            const imagesResult = await uploadVehicleImages(
              allImages.map((uri, index) => ({
                uri: uri,
                name: `image_${currentCarId}_${index}.jpg`,
                type: 'image/jpeg',
              })),
              currentCarId
            );
            
            if (!imagesResult.success) {
              throw new Error(`Images upload failed: ${imagesResult.error}`);
            }
            uploadResults.images = imagesResult.urls || [];
            uploadResults.coverPhoto = uploadResults.images[0] || null;
          }
        }

        // Save image URLs to backend database
        console.log('💾 [Media Upload] Saving image URLs to backend...');
        const saveUrlsResult = await saveVehicleImageUrls(
          currentCarId,
          uploadResults.coverPhoto,
          uploadResults.images,
          uploadResults.video // Video will be saved separately if provided
        );

        if (!saveUrlsResult.success) {
          console.warn('⚠️ [Media Upload] Failed to save URLs to backend:', saveUrlsResult.error);
        }

        // Upload video if provided and not yet uploaded
        if (formData.video && !uploadResults.video) {
          console.log('📹 [Media Upload] Starting video upload...');
          const videoResult = await uploadVehicleVideo({
            uri: formData.video,
            name: `video_${currentCarId}.mp4`,
            type: 'video/mp4',
          }, currentCarId);
          
          if (!videoResult.success) {
            console.warn('⚠️ [Media Upload] Video upload failed:', videoResult.error);
          } else {
            uploadResults.video = videoResult.url;
            
            // Update video URL in backend
            await saveVehicleImageUrls(
              currentCarId,
              uploadResults.coverPhoto,
              uploadResults.images,
              uploadResults.video
            );
          }
        }

        // Update form data with uploaded URLs
        updateFormData({
          coverPhotoUrl: uploadResults.coverPhoto,
          imageUrls: uploadResults.images,
          videoUrl: uploadResults.video,
        });

        console.log('✅ [Media Upload] All media handled successfully');
        setCurrentStep(5);
      } catch (error) {
        console.error('❌ [Media Upload] Error uploading media:', error);
        Alert.alert(
          'Upload Error',
          error.message || 'Failed to upload media. Please check your connection and try again.',
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
    } else if (currentStep === 1 && !existingCar) {
      setCurrentStep(0);
    }
  };

  const handleHeaderBack = () => {
    if (currentStep === 0) {
      navigation.goBack();
      return;
    }
    if (currentStep === 1 && !existingCar) {
      setCurrentStep(0);
      return;
    }
    if (currentStep > 1) {
      prevStep();
      return;
    }
    navigation.goBack();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let currentCarId = carId;
      
      // Step 1: Create car basics if this is a new car
      if (!currentCarId) {
        const basicsResult = await createCarBasics({
          name: formData.name,
          model: formData.model,
          body_type: formData.body,
          year: formData.year,
          description: formData.description,
          city: formData.hostCityName,
        });
        
        if (!basicsResult.success) {
          Alert.alert('Error', basicsResult.error || 'Failed to create car basics');
          return;
        }
        
        currentCarId = basicsResult.carId;
        setCarId(currentCarId);
      }
      
      // Step 2: Update car specs
      const specsResult = await updateCarSpecs(currentCarId, {
        seats: formData.seats,
        fuel_type: formData.fuelType,
        transmission: formData.transmission,
        color: formData.colour,
        mileage: formData.mileage,
        features: formData.features,
      });
      
      if (!specsResult.success) {
        Alert.alert('Error', specsResult.error || 'Failed to update car specifications');
        return;
      }
      
      // Step 3: Update car pricing
      const pricingResult = await updateCarPricing(currentCarId, {
        daily_rate: formData.pricePerDay,
        weekly_rate: formData.pricePerWeek,
        monthly_rate: formData.pricePerMonth,
        min_rental_days: formData.minimumRentalDays,
        max_rental_days: formData.maxRentalDays,
        min_age_requirement: formData.ageRestriction,
        rules: formData.carRules,
      });
      
      if (!pricingResult.success) {
        Alert.alert('Error', pricingResult.error || 'Failed to update car pricing');
        return;
      }
      
      // Step 4: Handle media upload if not already done
      const coverUrl = formData.coverPhotoUrl || (formData.imageUrls && formData.imageUrls[0]) || null;
      const imageUrls = formData.imageUrls || [];
      const videoUrl = formData.videoUrl || null;
      
      if (imageUrls.length > 0) {
        console.log('💾 [Submit] Saving media URLs to backend...');
        const mediaResult = await saveVehicleImageUrls(
          currentCarId,
          coverUrl,
          imageUrls,
          videoUrl
        );
        
        if (!mediaResult.success) {
          console.warn('⚠️ [Submit] Failed to save image URLs:', mediaResult.error);
        }
      }
      
      // Invalidate cache to force refresh
      myListingsScreenCache.cars = null;
      myListingsScreenCache.fetchedOnce = false;
      myListingsScreenCache.cachedUserId = null;
      
      Alert.alert(
        'Success!',
        'Your car has been submitted for verification. You will see it in your garage shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MainTabs', { screen: 'My Cars' })
          }
        ]
      );
      
    } catch (error) {
      console.error('Error submitting car:', error);
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

