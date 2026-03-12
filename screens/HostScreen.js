import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, FlatList, Switch, Alert, ActivityIndicator, Animated, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostCars, toggleCarVisibility, deleteHostCar } from '../services/carService';
import { getCarDriveSettings, updateCarDriveSettings } from '../services/driveSettingsService';
import { useHost } from '../utils/HostContext';

export default function HostScreen({ navigation }) {
  const { logout } = useHost();
  const insets = useSafeAreaInsets();
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start with true for initial load
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousCarsCount, setPreviousCarsCount] = useState(0);
  const [driveSettingsModalVisible, setDriveSettingsModalVisible] = useState(false);
  const [driveSettingsCarId, setDriveSettingsCarId] = useState(null);
  const [driveSettingsValue, setDriveSettingsValue] = useState(null);
  const [isSavingDriveSettings, setIsSavingDriveSettings] = useState(false);

  const loadCars = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
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
        // Check if error indicates session expiration
        if (result.error && (result.error.includes('Session expired') || result.error.includes('Please login again'))) {
          // Clear context state and navigate to landing
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Landing' }],
          });
          return;
        }
        setCars([]);
      }
    } catch (error) {
      console.error('📱 [HostScreen] Error loading cars:', error);
      // Check if error indicates session expiration
      if (error.message && (error.message.includes('Session expired') || error.message.includes('Please login again'))) {
        // Clear context state and navigate to landing
        await logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
        return;
      }
      setCars([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load cars on mount
  useEffect(() => {
    console.log('📱 [HostScreen] Component mounted, loading cars...');
    loadCars(false);
  }, []);

  // Reload when screen is focused (but don't show skeleton if we have cars)
  useFocusEffect(
    React.useCallback(() => {
      // Only reload if we don't have cars yet (initial load)
      if (cars.length === 0) {
        console.log('📱 [HostScreen] Screen focused, no cars yet - loading...');
        loadCars(false);
      }
    }, [cars.length])
  );

  const handleAddVehicle = () => {
    lightHaptic();
    navigation.navigate('HostVehicle');
  };

  const openDriveSettingsModal = () => {
    lightHaptic();
    if (cars.length >= 1) {
      const car = cars[0];
      const carId = car.carId || car.id;
      setDriveSettingsCarId(carId);
      setDriveSettingsValue(car.drive_setting || 'self_and_chauffeur');
    } else {
      setDriveSettingsCarId(null);
      setDriveSettingsValue(null);
    }
    setDriveSettingsModalVisible(true);
  };

  const closeDriveSettingsModal = () => {
    setDriveSettingsModalVisible(false);
    setDriveSettingsCarId(null);
    setDriveSettingsValue(null);
  };

  const handleSaveDriveSettings = async () => {
    const carId = driveSettingsCarId || (cars.length === 1 ? (cars[0].carId || cars[0].id) : null);
    if (!carId || !driveSettingsValue) {
      Alert.alert('Error', 'Please select a car and a drive setting.');
      return;
    }
    lightHaptic();
    setIsSavingDriveSettings(true);
    try {
      const result = await updateCarDriveSettings(carId, driveSettingsValue);
      if (result.success) {
        setCars((prev) =>
          prev.map((c) => {
            const id = c.carId || c.id;
            if (id === carId) {
              return { ...c, drive_setting: result.drive_setting, allowed_drive_types: result.allowed_drive_types || [] };
            }
            return c;
          })
        );
        closeDriveSettingsModal();
      } else {
        Alert.alert('Error', result.error || 'Failed to update drive settings.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'An unexpected error occurred.');
    } finally {
      setIsSavingDriveSettings(false);
    }
  };

  const getDriveSettingLabel = (value) => {
    switch (value) {
      case 'self_only': return 'Self drive only';
      case 'self_and_chauffeur': return 'Self drive or chauffeur';
      case 'chauffeur_only': return 'Chauffeur only';
      default: return value || 'Not set';
    }
  };

  const getDriveTypesDisplay = (allowed) => {
    if (!allowed || !Array.isArray(allowed) || allowed.length === 0) return null;
    return allowed.map((t) => t.replace(/_/g, ' ')).join(', ');
  };

  const getStatusInfo = (status, isComplete) => {
    // Prioritize status field - if status is set, use it (especially for awaiting_verification)
    // Only show incomplete if status is explicitly 'incomplete' AND not awaiting verification
    if (status === 'awaiting_verification') {
      return { emoji: '🟡', label: 'Awaiting verification', color: '#FF9500', bgColor: '#FFF3E0' };
    }
    
    if (status === 'verified') {
      return { emoji: '🟢', label: 'Verified', color: '#34C759', bgColor: '#E8F5E9' };
    }
    
    if (status === 'denied') {
      return { emoji: '🔴', label: 'Verification denied', color: '#FF3B30', bgColor: '#FFEBEE' };
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
      case 'verified':
        return { emoji: '🟢', label: 'Verified', color: '#34C759', bgColor: '#E8F5E9' };
      case 'denied':
        return { emoji: '🔴', label: 'Verification denied', color: '#FF3B30', bgColor: '#FFEBEE' };
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

  const handleDeleteCar = (item, carName) => {
    lightHaptic();
    const carId = item.carId ?? item.id;
    if (!carId) {
      Alert.alert('Error', 'Car ID not found.');
      return;
    }
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
              const result = await deleteHostCar(carId);
              if (result.success) {
                setCars((prev) => prev.filter((c) => (c.carId ?? c.id) !== carId));
                lightHaptic();
              } else {
                if (result.error && (result.error.includes('Session expired') || result.error.includes('Please login again'))) {
                  await logout();
                  navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
                  return;
                }
                Alert.alert('Error', result.error || 'Failed to delete car. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting car:', error);
              if (error.message && (error.message.includes('Session expired') || error.message.includes('Please login again'))) {
                await logout();
                navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
                return;
              }
              Alert.alert('Error', 'Failed to delete car. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleVisibility = async (item, value) => {
    // Only allow toggle if car is verified
    if (item.status !== 'verified') {
      Alert.alert(
        'Cannot Toggle Visibility',
        'Only verified cars can have their visibility toggled. Please wait for your car to be verified.',
        [{ text: 'OK' }]
      );
      return;
    }

    lightHaptic();

    try {
      const carId = item.carId || item.id;
      if (!carId) {
        Alert.alert('Error', 'Car ID not found');
        return;
      }

      const result = await toggleCarVisibility(carId);
      
      if (result.success) {
        // Extract visibility from result - handle is_hidden field
        let newIsHidden = false; // default to visible
        let newVisibility = true;
        
        if (result.car) {
          // Check is_hidden first (API returns this field)
          if (result.car.is_hidden !== undefined) {
            newIsHidden = result.car.is_hidden;
            newVisibility = !newIsHidden;
          } else if (result.isVisible !== undefined) {
            newVisibility = result.isVisible;
            newIsHidden = !newVisibility;
          } else {
            newVisibility = result.car.is_visible !== undefined 
              ? result.car.is_visible 
              : (result.car.visible !== undefined ? result.car.visible : true);
            newIsHidden = !newVisibility;
          }
        } else if (result.isVisible !== undefined) {
          newVisibility = result.isVisible;
          newIsHidden = !newVisibility;
        }
        
        // Update local state with new visibility status
        setCars(prevCars => 
          prevCars.map(car => {
            if (car.id === item.id || car.carId === carId) {
              return {
                ...car,
                is_hidden: newIsHidden,
                is_visible: newVisibility,
                visible: newVisibility,
                available: newVisibility,
              };
            }
            return car;
          })
        );
      } else {
        Alert.alert(
          'Failed to Toggle Visibility',
          result.error || 'Unable to update car visibility. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
                {(item.drive_setting || (item.allowed_drive_types && item.allowed_drive_types.length > 0)) && (
                  <View style={styles.metricItem}>
                    <Ionicons name="settings-outline" size={14} color="#1C1C1E" />
                    <Text style={styles.metricText}>
                      {getDriveSettingLabel(item.drive_setting)}
                      {getDriveTypesDisplay(item.allowed_drive_types) ? ` (${getDriveTypesDisplay(item.allowed_drive_types)})` : ''}
                    </Text>
                  </View>
                )}
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

        {/* Visibility Toggle - Only show for verified cars */}
        {item.status === 'verified' && (
          <View style={styles.visibilityToggleContainer}>
            <View style={styles.visibilityToggleContent}>
              <View style={styles.visibilityToggleText}>
                <Text style={styles.visibilityToggleLabel}>Show to renters</Text>
                <Text style={styles.visibilityToggleSubtext}>
                  {item.is_hidden === true ? 'Hidden' : 'Visible'}
                </Text>
              </View>
              <Switch
                value={item.is_hidden !== true}
                onValueChange={(value) => handleToggleVisibility(item, value)}
                trackColor={{ false: '#E5E5EA', true: COLORS.brand }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        )}
        
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCar(item, item.name)}
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
      {isLoading && cars.length === 0 ? (
        // Only show skeleton on initial load when no cars exist
        <FlatList
          data={Array.from({ length: previousCarsCount > 0 ? previousCarsCount : 1 }, (_, i) => i + 1)}
          renderItem={renderSkeletonCard}
          keyExtractor={(item) => `skeleton-${item}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : cars.length > 0 ? (
        // Show cars, with pull-to-refresh indicator
        <FlatList
          data={cars}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id?.toString() || `car-${item.carId || Date.now()}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
          refreshing={isRefreshing}
          onRefresh={() => loadCars(true)}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="car-sport-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No cars yet</Text>
          <Text style={styles.emptySubtitle}>Add your first vehicle to start hosting</Text>
        </View>
      )}

      {/* Floating buttons - add car always (when 0 or 1 cars); drive settings only when at least 1 car */}
      {!isLoading && (
        <View style={[styles.floatingButtonsContainer, { bottom: 68 + insets.bottom + 16 }]}>
          <View style={styles.floatingButtonsColumn}>
            {cars.length >= 1 && (
              <TouchableOpacity
                style={styles.floatingDriveSettingsButton}
                onPress={openDriveSettingsModal}
                activeOpacity={0.9}
              >
                <Ionicons name="settings-outline" size={22} color={COLORS.text} />
                <View style={styles.driveSettingsCarBadge}>
                  <Ionicons name="car-sport-outline" size={10} color={COLORS.text} />
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleAddVehicle}
              activeOpacity={0.9}
            >
              <Ionicons name="car-sport" size={20} color="#FFFFFF" />
              <Ionicons name="add" size={16} color="#FFFFFF" style={styles.plusIcon} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Drive Settings Modal */}
      <Modal
        visible={driveSettingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDriveSettingsModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDriveSettingsModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Drive Settings</Text>
              <TouchableOpacity onPress={closeDriveSettingsModal} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {cars.length > 1 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Select car</Text>
                {cars.map((car) => {
                  const carId = car.carId || car.id;
                  const isSelected = driveSettingsCarId === carId;
                  return (
                    <TouchableOpacity
                      key={carId}
                      style={[styles.carOption, isSelected && styles.carOptionSelected]}
                      onPress={() => {
                        setDriveSettingsCarId(carId);
                        setDriveSettingsValue(car.drive_setting || 'self_and_chauffeur');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.carOptionText}>
                        <Text style={styles.carOptionName}>{car.name} {car.model ? `• ${car.model}` : ''}</Text>
                        {car.drive_setting && (
                          <Text style={styles.carOptionSub}>{getDriveSettingLabel(car.drive_setting)}</Text>
                        )}
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.brand} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Drive setting</Text>
              {['self_only', 'self_and_chauffeur', 'chauffeur_only'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.driveOption, driveSettingsValue === opt && styles.driveOptionSelected]}
                  onPress={() => setDriveSettingsValue(opt)}
                  activeOpacity={0.7}
                >
                  <View style={styles.driveOptionRadio}>
                    {driveSettingsValue === opt && <View style={styles.driveOptionRadioInner} />}
                  </View>
                  <Text style={styles.driveOptionText}>{getDriveSettingLabel(opt)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalSaveButton, isSavingDriveSettings && styles.modalSaveButtonDisabled]}
              onPress={handleSaveDriveSettings}
              disabled={isSavingDriveSettings}
              activeOpacity={0.8}
            >
              {isSavingDriveSettings ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  floatingButtonsContainer: {
    position: 'absolute',
    right: 20,
  },
  floatingButtonsColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  driveSettingsCarBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDriveSettingsButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingButton: {
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
  visibilityToggleContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  visibilityToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visibilityToggleText: {
    flex: 1,
  },
  visibilityToggleLabel: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 2,
  },
  visibilityToggleSubtext: {
    ...TYPE.body,
    fontSize: 11,
    color: COLORS.subtle,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: SPACING.l,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...TYPE.largeTitle,
    fontSize: 18,
    color: COLORS.text,
  },
  modalClose: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 10,
  },
  carOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    marginBottom: 8,
  },
  carOptionSelected: {
    borderColor: COLORS.brand,
    backgroundColor: `${COLORS.brand}10`,
  },
  carOptionText: {
    flex: 1,
  },
  carOptionName: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
  },
  carOptionSub: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
    marginTop: 2,
  },
  driveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    marginBottom: 8,
  },
  driveOptionSelected: {
    borderColor: COLORS.brand,
    backgroundColor: `${COLORS.brand}10`,
  },
  driveOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driveOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  driveOptionText: {
    ...TYPE.body,
    fontSize: 15,
    color: COLORS.text,
  },
  modalSaveButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
