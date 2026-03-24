import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { toggleCarVisibility, getHostCars } from '../services/carService';

export default function CarDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { car: routeCar } = route.params || {};
  const [currentCar, setCurrentCar] = useState(routeCar || null);
  
  // Use car data from route params or mock data for testing
  const [isListed, setIsListed] = useState(routeCar?.available ?? routeCar?.is_visible ?? true);
  const [isToggling, setIsToggling] = useState(false);

  // Comprehensive mock data with all fields - merged with passed car data
  const defaultMockData = {
    id: 'car-1',
    name: 'BMW M3',
    model: 'G80',
    body: 'Sedan',
    year: '2023',
    description: 'Premium luxury sedan with exceptional performance and comfort. Perfect for long drives and special occasions. This vehicle features top-of-the-line amenities and delivers a smooth, powerful driving experience that makes every journey memorable.',
    coverPhoto: null, // Will use actual car image from API or placeholder
    seats: '5',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    colour: 'Black',
    mileage: '15000',
    features: [
      'Air Conditioning',
      'GPS Navigation',
      'Bluetooth',
      'USB Port',
      'Leather Seats',
      'Backup Camera',
      'Parking Sensors',
      'Sunroof',
      'Heated Seats',
      'Cruise Control',
      'Keyless Entry',
      'Child Seat',
    ],
    pricePerDay: '15000',
    pricePerWeek: '90000',
    pricePerMonth: '320000',
    minimumRentalDays: '2',
    maxRentalDays: '30',
    ageRestriction: '25 years',
    carRules: 'No smoking allowed. No pets. Return with full tank. No off-road driving. Maximum 4 passengers. Keep interior clean.',
    pickupLocation: 'Nakuru, Kenya',
    pickupLat: null,
    pickupLong: null,
  };

  // Merge passed car data with defaults, handling special field mappings
  const carData = {
    ...defaultMockData,
    ...(currentCar || {}),
    // Map 'image' to 'coverPhoto' if coverPhoto doesn't exist
    coverPhoto: currentCar?.coverPhoto || currentCar?.image || defaultMockData.coverPhoto,
    // Map 'location' to 'pickupLocation' if pickupLocation doesn't exist
    pickupLocation: currentCar?.pickupLocation || currentCar?.location || defaultMockData.pickupLocation,
    // Extract year from model if model contains year (e.g., "2023 G80") and year is not provided
    year: currentCar?.year || (currentCar?.model && currentCar.model.match(/^\d{4}/)?.[0]) || defaultMockData.year,
  };

  const loadLatestCar = useCallback(async () => {
    const targetCarId = routeCar?.carId || routeCar?.id || currentCar?.carId || currentCar?.id;
    if (!targetCarId) return;
    try {
      const result = await getHostCars();
      if (!result.success || !Array.isArray(result.cars)) return;
      const updatedCar = result.cars.find((item) => {
        const itemId = item?.carId || item?.id;
        return String(itemId) === String(targetCarId);
      });
      if (updatedCar) {
        setCurrentCar(updatedCar);
        if (updatedCar.available !== undefined || updatedCar.is_visible !== undefined) {
          setIsListed(updatedCar.available ?? updatedCar.is_visible ?? true);
        }
      }
    } catch (_) {
      // Keep current car data if refresh fails
    }
  }, [routeCar?.carId, routeCar?.id, currentCar?.carId, currentCar?.id]);

  useFocusEffect(
    useCallback(() => {
      loadLatestCar();
    }, [loadLatestCar])
  );

  const handleToggleListing = async (value) => {
    // Only allow toggle if car is verified
    if (carData.status !== 'verified') {
      Alert.alert(
        'Cannot Toggle Visibility',
        'Only verified cars can have their visibility toggled. Please wait for your car to be verified.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsToggling(true);
    lightHaptic();

    try {
      const carId = currentCar?.carId || currentCar?.id || routeCar?.carId || routeCar?.id;
      if (!carId) {
        Alert.alert('Error', 'Car ID not found');
        return;
      }

      const result = await toggleCarVisibility(carId);
      
      if (result.success) {
        // Update local state with new visibility status
        setIsListed(result.isVisible);
        setCurrentCar((prev) => ({
          ...(prev || {}),
          available: result.isVisible,
          is_visible: result.isVisible,
        }));
      } else {
        // Revert toggle on error
        setIsListed(!value);
        Alert.alert(
          'Failed to Toggle Visibility',
          result.error || 'Unable to update car visibility. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Revert toggle on error
      setIsListed(!value);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    lightHaptic();
    navigation.navigate('EditCar', { car: carData });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSh ${numAmount.toLocaleString()}`;
  };

  const DetailRow = ({ icon, label, value, isLast = false }) => {
    if (!value && value !== 0 && value !== false) return null;
    return (
      <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
        <View style={styles.detailLeft}>
          <Ionicons name={icon} size={20} color={COLORS.subtle} />
          <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  // Determine location display - show name OR coordinates, not both
  const getLocationDisplay = () => {
    if (carData.pickupLocation) {
      return carData.pickupLocation;
    }
    if (carData.pickupLat && carData.pickupLong) {
      return `${carData.pickupLat.toFixed(6)}, ${carData.pickupLong.toFixed(6)}`;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header with Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.brand} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        {carData.coverPhoto && (
          <View style={styles.imageContainer}>
            <Image source={carData.coverPhoto} style={styles.carImage} resizeMode="cover" />
          </View>
        )}

        {/* Car Name and Model */}
        <View style={styles.titleSection}>
          <Text style={styles.carName}>{carData.name}</Text>
          {carData.model && <Text style={styles.carModel}>{carData.model}</Text>}
        </View>

        {/* Listing Toggle - Only show for verified cars */}
        {carData.status === 'verified' && (
          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <View>
                <Text style={styles.toggleLabel}>Show car to renters</Text>
                <Text style={styles.toggleSubtext}>
                  {isListed ? 'Car is visible to renters' : 'Car is hidden from listings'}
                </Text>
              </View>
              {isToggling ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Switch
                  value={isListed}
                  onValueChange={handleToggleListing}
                  trackColor={{ false: '#E5E5EA', true: COLORS.brand }}
                  thumbColor="#FFFFFF"
                  disabled={isToggling}
                />
              )}
            </View>
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.sectionCard}>
            {carData.name && <DetailRow icon="car-outline" label="Car Name" value={carData.name} />}
            {carData.model && <DetailRow icon="document-outline" label="Model" value={carData.model} />}
            {carData.body && <DetailRow icon="car-sport-outline" label="Body Type" value={carData.body} />}
            {carData.year && <DetailRow icon="calendar-outline" label="Year" value={carData.year} />}
            {carData.description && (
              <View style={styles.descriptionContainer}>
                <View style={styles.detailLeft}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.subtle} />
                  <Text style={styles.detailLabel}>Description</Text>
                </View>
                <Text style={styles.descriptionText}>{carData.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          
          <View style={styles.sectionCard}>
            {carData.seats && <DetailRow icon="people-outline" label="Seats" value={`${carData.seats} seats`} />}
            {carData.fuelType && <DetailRow icon="flash-outline" label="Fuel Type" value={carData.fuelType} />}
            {carData.transmission && <DetailRow icon="settings-outline" label="Transmission" value={carData.transmission} />}
            {carData.colour && <DetailRow icon="color-palette-outline" label="Color" value={carData.colour} />}
            {carData.mileage && <DetailRow icon="speedometer-outline" label="Mileage" value={`${carData.mileage} km`} />}
            
            {/* Features */}
            {carData.features && carData.features.length > 0 && (
              <View style={styles.featuresContainer}>
                <View style={styles.detailLeft}>
                  <Ionicons name="star-outline" size={20} color={COLORS.subtle} />
                  <Text style={styles.detailLabel}>Features</Text>
                </View>
                <View style={styles.featuresList}>
                  {carData.features.map((feature, index) => (
                    <View key={index} style={styles.featureTag}>
                      <Text style={styles.featureTagText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Rental Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Information</Text>
          
          <View style={styles.sectionCard}>
            {carData.pricePerDay && (
              <DetailRow icon="cash-outline" label="Daily Rate" value={formatCurrency(carData.pricePerDay)} />
            )}
            {carData.pricePerWeek && (
              <DetailRow icon="calendar-outline" label="Weekly Rate" value={formatCurrency(carData.pricePerWeek)} />
            )}
            {carData.pricePerMonth && (
              <DetailRow icon="calendar-outline" label="Monthly Rate" value={formatCurrency(carData.pricePerMonth)} />
            )}
            {carData.minimumRentalDays && (
              <DetailRow icon="time-outline" label="Minimum Rental Days" value={`${carData.minimumRentalDays} days`} />
            )}
            {carData.maxRentalDays && (
              <DetailRow icon="time-outline" label="Maximum Rental Days" value={`${carData.maxRentalDays} days`} />
            )}
            {carData.ageRestriction && (
              <DetailRow icon="person-outline" label="Minimum Age Requirement" value={carData.ageRestriction} />
            )}
            {carData.carRules && (
              <View style={styles.descriptionContainer}>
                <View style={styles.detailLeft}>
                  <Ionicons name="list-outline" size={20} color={COLORS.subtle} />
                  <Text style={styles.detailLabel}>Car Rules</Text>
                </View>
                <Text style={styles.descriptionText}>{carData.carRules}</Text>
              </View>
            )}
            {getLocationDisplay() && (
              <DetailRow 
                icon={carData.pickupLocation ? "location-outline" : "navigate-outline"} 
                label="Location" 
                value={getLocationDisplay()} 
              />
            )}
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.title,
    fontSize: 20,
    color: COLORS.text,
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.l,
    gap: SPACING.l,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    marginBottom: SPACING.s,
  },
  carName: {
    ...TYPE.largeTitle,
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 4,
  },
  carModel: {
    ...TYPE.body,
    fontSize: 16,
    color: COLORS.subtle,
  },
  toggleSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  toggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    ...TYPE.section,
    color: COLORS.text,
    marginBottom: 4,
  },
  toggleSubtext: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  section: {
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    flex: 1,
  },
  detailLabel: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  detailValue: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
    textAlign: 'right',
  },
  descriptionContainer: {
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  descriptionText: {
    ...TYPE.body,
    color: COLORS.text,
    lineHeight: 22,
    marginTop: SPACING.s,
  },
  featuresContainer: {
    paddingVertical: SPACING.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  featureTag: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  featureTagText: {
    ...TYPE.caption,
    color: COLORS.text,
  },
});
