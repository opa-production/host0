import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostCars } from '../services/carService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MyListingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCars = async () => {
    console.log('📱 [MyListingsScreen] loadCars called');
    setIsLoading(true);
    try {
      console.log('📱 [MyListingsScreen] Calling getHostCars...');
      const result = await getHostCars();
      console.log('📱 [MyListingsScreen] getHostCars result:', result);
      if (result.success && result.cars) {
        console.log('📱 [MyListingsScreen] Setting cars:', result.cars.length);
        setCars(result.cars);
      } else {
        console.error('📱 [MyListingsScreen] Failed to load cars:', result.error);
        setCars([]);
      }
    } catch (error) {
      console.error('📱 [MyListingsScreen] Error loading cars:', error);
      setCars([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cars on mount and when screen is focused
  useEffect(() => {
    console.log('📱 [MyListingsScreen] Component mounted, loading cars...');
    loadCars();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 [MyListingsScreen] Screen focused, loading cars...');
      loadCars();
    }, [])
  );

  const allListings = cars;

  const getStatusInfo = (status, isComplete) => {
    // Handle incomplete cars
    if (status === 'incomplete' || isComplete === false) {
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
    const isIncomplete = item.is_complete === false || item.status === 'incomplete';
    
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
        <View style={styles.backButton} />
      </View>

      {/* Listings */}
      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.brand} />
          <Text style={styles.emptySubtitle}>Loading your cars...</Text>
        </View>
      ) : allListings.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={allListings}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id?.toString() || `car-${item.carId || Date.now()}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingTop: SPACING.m }]}
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
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
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
});
