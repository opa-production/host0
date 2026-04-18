import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostCars } from '../services/carService';
import { myListingsScreenCache } from '../utils/screenDataCache';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Module-level — hooks are only called from named components, never from render fns
function SkeletonPulse({ style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View style={[{ backgroundColor: '#E5E5EA', borderRadius: 6 }, style, { opacity }]} />
  );
}

// Mirrors the real listCard layout: circle image | name + metrics column
function CarSkeletonCard({ isLast }) {
  return (
    <View style={[carSkeletonStyles.card, isLast && carSkeletonStyles.cardLast]}>
      {/* Circle image placeholder */}
      <SkeletonPulse style={carSkeletonStyles.avatar} />

      <View style={carSkeletonStyles.info}>
        {/* Name + model */}
        <View style={carSkeletonStyles.header}>
          <SkeletonPulse style={{ width: 140, height: 14, marginBottom: 6 }} />
          <SkeletonPulse style={{ width: 100, height: 11 }} />
        </View>

        {/* Metric rows: icon stub + text stub */}
        <View style={carSkeletonStyles.metrics}>
          <View style={carSkeletonStyles.metricRow}>
            <SkeletonPulse style={carSkeletonStyles.iconStub} />
            <SkeletonPulse style={{ width: 110, height: 11 }} />
          </View>
          <View style={carSkeletonStyles.metricRow}>
            <SkeletonPulse style={carSkeletonStyles.iconStub} />
            <SkeletonPulse style={{ width: 60, height: 11 }} />
          </View>
          <View style={carSkeletonStyles.metricRow}>
            <SkeletonPulse style={carSkeletonStyles.dotStub} />
            <SkeletonPulse style={{ width: 90, height: 11 }} />
          </View>
          <View style={carSkeletonStyles.metricRow}>
            <SkeletonPulse style={{ width: 36, height: 11, borderRadius: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

const carSkeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  cardLast: {
    marginBottom: 0,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  metrics: {
    gap: 6,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconStub: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  dotStub: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default function MyListingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const fetchGenRef = useRef(0);

  const loadCars = useCallback(async ({ pullToRefresh = false, initial = false } = {}) => {
    const gen = ++fetchGenRef.current;

    if (initial) {
      setIsLoading(true);
    } else if (pullToRefresh) {
      setRefreshing(true);
    }
    // silent re-focus: no visual indicator, list stays visible until new data arrives

    try {
      const result = await getHostCars();
      if (gen !== fetchGenRef.current) return;

      if (result.success) {
        const fresh = result.cars || [];
        setCars(fresh);
        myListingsScreenCache.cars = fresh;
        myListingsScreenCache.fetchedOnce = true;
        lastFetchTimeRef.current = Date.now();
      }
    } catch (error) {
      console.error('📱 [MyListingsScreen] Error loading cars:', error);
    } finally {
      if (gen === fetchGenRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const isFirstLoad = !hasLoadedRef.current;
      // HostVehicleScreen sets fetchedOnce=false after a car is submitted
      const cacheInvalidated = !myListingsScreenCache.fetchedOnce;
      const isStale = Date.now() - lastFetchTimeRef.current > 30_000;

      if (!isFirstLoad && !cacheInvalidated && !isStale) return;

      hasLoadedRef.current = true;
      // Only show skeleton on the very first visit — never flash it on re-focus
      loadCars({ initial: isFirstLoad });
    }, [loadCars])
  );

  const allListings = cars;

  const getDriveSettingLabel = (value) => {
    switch (value) {
      case 'self_only': return 'Self drive only';
      case 'self_and_chauffeur': return 'Self drive or chauffeur';
      case 'chauffeur_only': return 'Chauffeur only';
      default: return value || 'Not set';
    }
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

  const handleCardPress = (item) => {
    // If incomplete, navigate to HostVehicle screen to continue editing
    if (item.is_complete === false || item.status === 'incomplete') {
      navigation.navigate('HostVehicle', { carId: item.carId || item.id, existingCar: item });
    } else {
      navigation.navigate('CarDetails', { car: item });
    }
  };

  const renderCarCard = ({ item, index }) => {
    const statusInfo = getStatusInfo(item.status, item.is_complete);
    const isLastItem = index === allListings.length - 1;
    // Car is incomplete only if it's marked incomplete AND has no images
    const isIncomplete = (item.is_complete === false || item.status === 'incomplete') && !item.hasImages;
    
    return (
      <TouchableOpacity 
        style={[styles.listCard, isLastItem && styles.listCardLast]}
        onPress={() => handleCardPress(item)}
        activeOpacity={1}
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
                    <Text style={styles.metricText}>{getDriveSettingLabel(item.drive_setting)}</Text>
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
    );
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
        <Text style={styles.headerTitle}>My Cars</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.navigate('HostVehicle');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={28} color={COLORS.brand} />
        </TouchableOpacity>
      </View>

      {/* Listings */}
      {isLoading ? (
        // Show as many skeletons as we have cached cars (so the layout doesn't
        // visually jump when real data arrives). Default to 2 when unknown.
        <FlatList
          data={Array.from({ length: 3 }, (_, i) => i)}
          renderItem={({ index }) => (
            <CarSkeletonCard isLast={index === 2} />
          )}
          keyExtractor={(item) => `skeleton-${item}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingTop: SPACING.m }]}
        />
      ) : allListings.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={allListings}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id?.toString() || `car-${item.carId || Date.now()}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingTop: SPACING.m }]}
          refreshing={refreshing}
          onRefresh={() => loadCars({ pullToRefresh: true, showFullScreenLoader: false, forceRefresh: true })}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="car-sport-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No cars yet</Text>
          <Text style={styles.emptySubtitle}>Add your first vehicle to start hosting</Text>
          <TouchableOpacity
            style={styles.addCarButton}
            onPress={() => {
              lightHaptic();
              navigation.navigate('HostVehicle');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addCarButtonText}>Add a Car</Text>
          </TouchableOpacity>
        </View>
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
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 120,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderVisible,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  listCardLast: {
    marginBottom: 0,
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
  editPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
  },
  editPillText: {
    ...TYPE.bodyStrong,
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
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
  addCarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCarButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
