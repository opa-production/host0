import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, FlatList, Switch, Alert, ActivityIndicator, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostCars } from '../services/carService';

export default function HostScreen({ navigation }) {
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousCarsCount, setPreviousCarsCount] = useState(0);

  const loadCars = async () => {
    console.log('📱 [HostScreen] loadCars called');
    setIsLoading(true);
    try {
      console.log('📱 [HostScreen] Calling getHostCars API...');
      const result = await getHostCars();
      console.log('📱 [HostScreen] getHostCars result:', result);
      
      if (result.success && result.cars) {
        console.log('📱 [HostScreen] Setting cars:', result.cars.length);
        setCars(result.cars);
        // Store the count for skeleton matching
        if (result.cars.length > 0) {
          setPreviousCarsCount(result.cars.length);
        }
      } else {
        console.error('📱 [HostScreen] Failed to load cars:', result.error);
        setCars([]);
      }
    } catch (error) {
      console.error('📱 [HostScreen] Error loading cars:', error);
      setCars([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cars on mount
  useEffect(() => {
    console.log('📱 [HostScreen] Component mounted, loading cars...');
    loadCars();
  }, []);

  // Reload when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 [HostScreen] Screen focused, loading cars...');
      loadCars();
    }, [])
  );

  const handleAddVehicle = () => {
    lightHaptic();
    navigation.navigate('HostVehicle');
  };

  const getStatusInfo = (status, isComplete) => {
    // Prioritize status field - if status is set, use it (especially for awaiting_verification)
    // Only show incomplete if status is explicitly 'incomplete' AND not awaiting verification
    if (status === 'awaiting_verification') {
      return { emoji: '🟡', label: 'Awaiting verification', color: '#FF9500', bgColor: '#FFF3E0' };
    }
    
    // Handle incomplete cars only if status is explicitly incomplete
    if (status === 'incomplete' && isComplete === false) {
      return { emoji: '⚪', label: 'Incomplete', color: '#8E8E93', bgColor: '#F2F2F7' };
    }
    
    switch (status) {
      case 'available':
        return { emoji: '🟢', label: 'Available', color: '#34C759', bgColor: '#E8F5E9' };
      case 'booked':
        return { emoji: '🔵', label: 'Booked', color: '#007AFF', bgColor: '#E3F2FD' };
      case 'awaiting_verification':
        return { emoji: '🟡', label: 'Awaiting verification', color: '#FF9500', bgColor: '#FFF3E0' };
      case 'pending':
        return { emoji: '🟡', label: 'Pending approval', color: '#FF9500', bgColor: '#FFF3E0' };
      case 'offline':
        return { emoji: '🔴', label: 'Offline', color: '#FF3B30', bgColor: '#FFEBEE' };
      default:
        // Default to awaiting verification if status is not set but car has images
        return { emoji: '🟡', label: 'Awaiting verification', color: '#FF9500', bgColor: '#FFF3E0' };
    }
  };

  const formatPrice = (price) => {
    return `KSh ${price.toLocaleString()}/day`;
  };

  // Skeleton component for loading state with shimmer effect
  const SkeletonBox = ({ width, height, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            backgroundColor: '#E5E5EA',
            borderRadius: 8,
            opacity,
          },
          style,
        ]}
      />
    );
  };

  const renderSkeletonCard = () => (
    <View style={[styles.carCard, styles.skeletonCard]}>
      <View style={styles.carCardContent}>
        {/* Skeleton Image */}
        <View style={styles.carImageContainer}>
          <View style={[styles.carImagePlaceholder, { backgroundColor: '#E5E5EA' }]} />
        </View>

        {/* Skeleton Info */}
        <View style={styles.carInfo}>
          <View style={styles.carHeader}>
            <SkeletonBox width={120} height={16} style={{ marginBottom: 8, borderRadius: 4 }} />
            <SkeletonBox width={150} height={12} style={{ borderRadius: 4 }} />
          </View>

          <View style={styles.carMetrics}>
            <SkeletonBox width={100} height={12} style={{ marginBottom: 6, borderRadius: 4 }} />
            <SkeletonBox width={80} height={12} style={{ marginBottom: 6, borderRadius: 4 }} />
            <SkeletonBox width={90} height={12} style={{ marginBottom: 6, borderRadius: 4 }} />
            <SkeletonBox width={60} height={12} style={{ borderRadius: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );

  const handleCardPress = (item) => {
    // If incomplete, navigate to HostVehicle screen to continue editing
    if (item.is_complete === false || item.status === 'incomplete') {
      navigation.navigate('HostVehicle', { carId: item.carId || item.id, existingCar: item });
    } else {
      navigation.navigate('CarDetails', { car: item });
    }
  };

  const handleDeleteCar = (carId, carName) => {
    lightHaptic();
    Alert.alert(
      'Delete Car',
      `Are you sure you want to delete ${carName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const HOST_CARS_KEY = '@host_cars';
              const storedCars = await AsyncStorage.getItem(HOST_CARS_KEY);
              const cars = storedCars ? JSON.parse(storedCars) : [];
              const updatedCars = cars.filter(car => car.id !== carId);
              await AsyncStorage.setItem(HOST_CARS_KEY, JSON.stringify(updatedCars));
              setCars(updatedCars);
              lightHaptic();
            } catch (error) {
              console.error('Error deleting car:', error);
              Alert.alert('Error', 'Failed to delete car. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderCarCard = ({ item, index }) => {
    const statusInfo = getStatusInfo(item.status, item.is_complete);
    const isLastItem = index === cars.length - 1;
    // Car is incomplete only if it's marked incomplete AND has no images
    const isIncomplete = (item.is_complete === false || item.status === 'incomplete') && !item.hasImages;
    
    return (
      <View style={[styles.carCard, isLastItem && styles.carCardLast]}>
        <TouchableOpacity 
          style={styles.carCardContent}
          onPress={() => handleCardPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.carImageContainer}>
            {item.coverPhoto || item.image ? (
              <Image 
                source={typeof (item.coverPhoto || item.image) === 'string' 
                  ? { uri: item.coverPhoto || item.image } 
                  : (item.coverPhoto || item.image)} 
                style={styles.carImage} 
              />
            ) : (
              <View style={styles.carImagePlaceholder}>
                <Ionicons name="car-outline" size={24} color="#C7C7CC" />
              </View>
            )}
          </View>

          <View style={styles.carInfo}>
            <View style={styles.carHeader}>
              <Text style={styles.carName}>{item.name}</Text>
              <Text style={styles.carModel}>
                {item.model}{item.plateNumber ? ` • ${item.plateNumber}` : ''}
              </Text>
            </View>

            <View style={styles.carMetrics}>
              {isIncomplete ? (
                <View style={styles.metricItem}>
                  <Ionicons name="alert-circle-outline" size={14} color="#FF9500" />
                  <Text style={[styles.metricText, { color: '#FF9500' }]}>Complete setup to publish</Text>
                </View>
              ) : (
                <>
                  <View style={styles.metricItem}>
                    <Ionicons name="wallet-outline" size={14} color="#1C1C1E" />
                    <Text style={styles.metricText}>{formatPrice(item.pricePerDay || 0)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="car-outline" size={14} color="#1C1C1E" />
                    <Text style={styles.metricText}>{item.totalTrips || 0} trips</Text>
                  </View>
                </>
              )}
              <View style={styles.metricItem}>
                <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                <Text style={styles.metricText}>{statusInfo.label}</Text>
              </View>
              {!isIncomplete && (
                <View style={styles.metricItem}>
                  {item.rating ? (
                    <>
                      <Text style={styles.ratingText}>⭐</Text>
                      <Text style={styles.metricText}>{item.rating}</Text>
                    </>
                  ) : (
                    <Text style={styles.newBadgeText}>New</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCar(item.id, item.name)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Cars</Text>
          <Text style={styles.subtitle}>{cars.length} {cars.length === 1 ? 'vehicle' : 'vehicles'}</Text>
        </View>
      </View>

      {/* Cars List */}
      {isLoading ? (
        <FlatList
          data={Array.from({ length: previousCarsCount > 0 ? previousCarsCount : 1 }, (_, i) => i + 1)}
          renderItem={renderSkeletonCard}
          keyExtractor={(item) => `skeleton-${item}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : cars.length > 0 ? (
        <FlatList
          data={cars}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id?.toString() || `car-${item.carId || Date.now()}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={loadCars}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="car-sport-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No cars yet</Text>
          <Text style={styles.emptySubtitle}>Add your first vehicle to start hosting</Text>
        </View>
      )}

      {/* Floating Add Button */}
      {cars.length < 2 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleAddVehicle}
          activeOpacity={0.9}
        >
          <Ionicons name="car-sport" size={20} color="#FFFFFF" />
          <Ionicons name="add" size={16} color="#FFFFFF" style={styles.plusIcon} />
        </TouchableOpacity>
      )}
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 15,
    color: '#8E8E93',
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 100,
  },
  carCard: {
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    marginBottom: 16,
  },
  carCardLast: {
    marginBottom: 0,
  },
  skeletonCard: {
    opacity: 0.7,
  },
  carCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
  },
  carImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
    marginRight: 12,
  },
  carImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  carInfo: {
    flex: 1,
  },
  carHeader: {
    marginBottom: 8,
  },
  carName: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  carModel: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
  },
  carMetrics: {
    flexDirection: 'column',
    gap: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    ...TYPE.body,
    fontSize: 12,
    color: '#1C1C1E',
  },
  ratingText: {
    fontSize: 12,
  },
  newBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPE.section,
    fontSize: 20,
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...TYPE.body,
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plusIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
