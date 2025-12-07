import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MyListingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock data - TODO: Replace with actual API data
  const cars = [
    {
      id: 'car-1',
      name: 'BMW M3',
      model: '2023 G80',
      image: require('../assets/images/bmw.jpg'),
      status: 'active',
      available: true,
      price: 'KSh 15,000/day',
      location: 'Nakuru, Kenya',
      seats: 5,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      activeRentals: 2,
      totalBookings: 12,
      description: 'Premium luxury sedan with exceptional performance and comfort. Perfect for long drives and special occasions.',
      totalRatings: 4.8,
      ratingCount: 24,
    },
    {
      id: 'car-2',
      name: 'Toyota Corolla',
      model: '2022',
      image: require('../assets/images/bm.jpg'),
      status: 'listed',
      available: false,
      price: 'KSh 8,000/day',
      location: 'Nakuru, Kenya',
      seats: 5,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      activeRentals: 0,
      totalBookings: 5,
      description: 'Reliable and fuel-efficient compact car, ideal for city driving and daily commutes.',
      totalRatings: 4.5,
      ratingCount: 12,
    },
  ];

  const services = [
    {
      id: 'service-1',
      name: 'Chauffeur Service',
      image: require('../assets/images/deon.jpg'),
      type: 'chauffeur',
      status: 'active',
      available: true,
      price: 'KSh 5,000/day',
      location: 'Nakuru, Kenya',
      activeBookings: 1,
      totalBookings: 8,
      description: 'Professional chauffeur service with experienced drivers. Available for events, airport transfers, and special occasions.',
      totalRatings: 4.9,
      ratingCount: 18,
    },
    {
      id: 'service-2',
      name: 'Road Trip Service',
      image: require('../assets/images/jeep.jpg'),
      type: 'roadtrip',
      status: 'listed',
      available: true,
      price: 'KSh 12,000/trip',
      location: 'Kenya-wide',
      activeBookings: 0,
      totalBookings: 3,
      description: 'Plan and execute memorable road trips across Kenya. Customized itineraries and comfortable vehicles.',
      totalRatings: 4.7,
      ratingCount: 8,
    },
  ];

  // Combine cars and services with unique keys
  const allListings = [...cars, ...services];

  const toggleAvailability = (id) => {
    // TODO: Update availability via API
    console.log('Toggle availability for:', id);
  };

  const handleUpdate = (item) => {
    // TODO: Navigate to update/edit screen
    console.log('Update:', item);
    if (item.type) {
      // It's a service
      // navigation.navigate('UpdateService', { serviceId: item.id });
    } else {
      // It's a car
      // navigation.navigate('UpdateCar', { carId: item.id });
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'listed':
        return 'Listed';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const renderCarCard = ({ item, index }) => {
    const isCar = !item.type;
    
    return (
      <View style={styles.cardContainer}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {item.image ? (
            <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons 
                name={isCar ? "car-outline" : (item.type === 'chauffeur' ? "person-outline" : "map-outline")} 
                size={64} 
                color="#cccccc" 
              />
            </View>
          )}
          
          {/* Bottom Indicators */}
          <View style={styles.imageBottomBar}>
            {/* Swipe Indicator - Centered */}
            {index < allListings.length - 1 && (
              <View style={styles.swipeIndicator}>
                <Ionicons name="chevron-up" size={16} color="#ffffff" />
                <Text style={styles.swipeText}>Swipe</Text>
              </View>
            )}
            
            {/* Page Indicator - Right */}
            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {index + 1} / {allListings.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {isCar && item.model && (
                <Text style={styles.cardSubtitle}>{item.model}</Text>
              )}
            </View>
            <Ionicons 
              name={isCar ? "car-outline" : (item.type === 'chauffeur' ? "person-outline" : "map-outline")} 
              size={24} 
              color="#000000" 
            />
          </View>

          {/* Details - 2 Columns */}
          <View style={styles.detailsSection}>
            <View style={styles.detailsGrid}>
              <View style={styles.detailColumn}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#666666" />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#666666" />
                  <Text style={styles.detailText}>{item.price}</Text>
                </View>

                {/* Ratings */}
                <View style={styles.detailRow}>
                  <Ionicons name="star" size={16} color="#666666" />
                  <Text style={styles.detailText}>
                    {item.totalRatings?.toFixed(1) || 'N/A'} ({item.ratingCount || 0})
                  </Text>
                </View>
              </View>

              {isCar && (
                <View style={styles.detailColumn}>
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color="#666666" />
                    <Text style={styles.detailText}>{item.seats} seats</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="flash-outline" size={16} color="#666666" />
                    <Text style={styles.detailText}>{item.fuelType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="settings-outline" size={16} color="#666666" />
                    <Text style={styles.detailText}>{item.transmission}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Description */}
            {item.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {isCar ? item.activeRentals : item.activeBookings}
                </Text>
                <Text style={styles.statLabel}>
                  {isCar ? 'Active Rentals' : 'Active Bookings'}
                </Text>
                <Text style={styles.statDetail}>
                  {isCar 
                    ? `${item.activeRentals} currently rented` 
                    : `${item.activeBookings} ongoing bookings`}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {isCar ? item.totalBookings : item.totalBookings}
                </Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
                <Text style={styles.statDetail}>
                  {isCar 
                    ? `${item.totalBookings} total rentals` 
                    : `${item.totalBookings} completed`}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.availabilityButton, item.available && styles.availabilityButtonActive]}
              onPress={() => toggleAvailability(item.id)}
              activeOpacity={1}
            >
              <Ionicons 
                name={item.available ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color="#ffffff" 
              />
              <Text style={styles.availabilityButtonText}>
                {item.available ? 'Available' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => handleUpdate(item)}
              activeOpacity={1}
            >
              <Ionicons name="create-outline" size={18} color="#000000" />
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Floating Back Button and Status Badge */}
      <View style={[styles.topBar, { top: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={1}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        {allListings[currentIndex] && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {getStatusText(allListings[currentIndex].status)}
            </Text>
          </View>
        )}
      </View>

      {/* Swipeable Cards */}
      <FlatList
        ref={flatListRef}
        data={allListings}
        renderItem={renderCarCard}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
  imageBottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageIndicator: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pageIndicatorText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
  cardContainer: {
    height: SCREEN_HEIGHT,
    backgroundColor: '#ffffff',
  },
  imageSection: {
    height: '40%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
  },
  swipeText: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: '#ffffff',
  },
  contentSection: {
    height: '60%',
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 26,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  detailColumn: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  statBox: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    marginBottom: 2,
  },
  statDetail: {
    fontSize: 10,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  availabilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  availabilityButtonActive: {
    backgroundColor: '#000000',
  },
  availabilityButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  updateButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
});
