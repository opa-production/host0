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
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MyListingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

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

  const allListings = cars;

  const toggleAvailability = (id) => {
    // TODO: Update availability via API
    console.log('Toggle availability for:', id);
  };

  const handleUpdate = (item) => {
    // TODO: Navigate to update/edit screen
    console.log('Update:', item);
    // navigation.navigate('UpdateCar', { carId: item.id });
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

  const handleCardPress = (item) => {
    navigation.navigate('CarDetails', { car: item });
  };

  const renderCarCard = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.listCard}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.listLeft}>
          {item.image ? (
            <Image source={item.image} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="car-outline" size={22} color="#C7C7CC" />
            </View>
          )}
        </View>

        <View style={styles.listMiddle}>
          <Text style={styles.listTitle}>{item.name}</Text>
          <Text style={styles.listSubtitle}>{item.model ? item.model : item.location}</Text>
          <Text style={styles.listMeta}>{item.price} • {item.location}</Text>
        </View>

        <View style={styles.listRight}>
          <Switch
            value={!!item.available}
            onValueChange={(e) => {
              e.stopPropagation();
              toggleAvailability(item.id);
            }}
            trackColor={{ false: '#E5E5EA', true: COLORS.brand }}
            thumbColor="#FFFFFF"
          />
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('CarDetails', { car: item });
            }} 
            style={styles.editPill} 
            activeOpacity={0.9}
          >
            <Text style={styles.editPillText}>View</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Floating Back Button */}
      <View style={[styles.topBar, { top: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={1}
        >
          <Ionicons name="arrow-back" size={22} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={[styles.headerArea, { paddingTop: insets.top + 70 }]}>
        <Text style={styles.screenTitle}>My Cars</Text>
        <Text style={styles.screenSubtitle}>Manage your listings</Text>
      </View>

      {/* Listings */}
      <FlatList
        ref={flatListRef}
        data={allListings}
        renderItem={renderCarCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  headerArea: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
  },
  screenTitle: {
    ...TYPE.title,
    fontSize: 20,
    color: '#1C1C1E',
  },
  screenSubtitle: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 120,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    marginBottom: 12,
  },
  listLeft: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  listMiddle: {
    flex: 1,
  },
  listTitle: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  listSubtitle: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  listMeta: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  listRight: {
    alignItems: 'flex-end',
    gap: 8,
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
});
