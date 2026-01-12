import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, FlatList, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function HostScreen({ navigation }) {
  // Mock data - TODO: Replace with actual API data
  const [cars, setCars] = useState([
    {
      id: 'car-1',
      name: 'BMW M3',
      model: '2023 G80',
      image: require('../assets/images/bmw.jpg'),
      status: 'available',
      plateNumber: 'KCA 123A',
      pricePerDay: 15000,
      rating: 4.8,
      seats: 5,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      totalTrips: 12,
    },
    {
      id: 'car-2',
      name: 'Toyota Corolla',
      model: '2022',
      image: require('../assets/images/bm.jpg'),
      status: 'booked',
      plateNumber: 'KBZ 456B',
      pricePerDay: 8000,
      rating: null,
      seats: 5,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      totalTrips: 5,
    },
  ]);

  const handleAddVehicle = () => {
    lightHaptic();
    navigation.navigate('HostVehicle');
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'available':
        return { emoji: '🟢', label: 'Available', color: '#34C759', bgColor: '#E8F5E9' };
      case 'booked':
        return { emoji: '🔵', label: 'Booked', color: '#007AFF', bgColor: '#E3F2FD' };
      case 'pending':
        return { emoji: '🟡', label: 'Pending approval', color: '#FF9500', bgColor: '#FFF3E0' };
      case 'offline':
        return { emoji: '🔴', label: 'Offline', color: '#FF3B30', bgColor: '#FFEBEE' };
      default:
        return { emoji: '🟢', label: 'Available', color: '#34C759', bgColor: '#E8F5E9' };
    }
  };

  const formatPrice = (price) => {
    return `KSh ${price.toLocaleString()}/day`;
  };

  const handleCardPress = (item) => {
    navigation.navigate('CarDetails', { car: item });
  };

  const renderCarCard = ({ item, index }) => {
    const statusInfo = getStatusInfo(item.status);
    const isLastItem = index === cars.length - 1;
    
    return (
      <TouchableOpacity 
        style={[styles.carCard, isLastItem && styles.carCardLast]}
        onPress={() => handleCardPress(item)}
        activeOpacity={1}
      >
        <View style={styles.carImageContainer}>
          {item.image ? (
            <Image source={item.image} style={styles.carImage} />
          ) : (
            <View style={styles.carImagePlaceholder}>
              <Ionicons name="car-outline" size={24} color="#C7C7CC" />
            </View>
          )}
        </View>

        <View style={styles.carInfo}>
          <View style={styles.carHeader}>
            <Text style={styles.carName}>{item.name}</Text>
            <Text style={styles.carModel}>{item.model} • {item.plateNumber}</Text>
          </View>

          <View style={styles.carMetrics}>
            <View style={styles.metricItem}>
              <Ionicons name="wallet-outline" size={14} color="#1C1C1E" />
              <Text style={styles.metricText}>{formatPrice(item.pricePerDay)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="car-outline" size={14} color="#1C1C1E" />
              <Text style={styles.metricText}>{item.totalTrips || 0} trips</Text>
            </View>
            <View style={styles.metricItem}>
              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
              <Text style={styles.metricText}>{statusInfo.label}</Text>
            </View>
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
          </View>
        </View>
      </TouchableOpacity>
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
      {cars.length > 0 ? (
        <FlatList
          data={cars}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="car-sport-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No cars yet</Text>
          <Text style={styles.emptySubtitle}>Add your first vehicle to start hosting</Text>
        </View>
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleAddVehicle}
        activeOpacity={0.9}
      >
        <Ionicons name="car-sport" size={20} color="#FFFFFF" />
        <Ionicons name="add" size={16} color="#FFFFFF" style={styles.plusIcon} />
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  carCardLast: {
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
