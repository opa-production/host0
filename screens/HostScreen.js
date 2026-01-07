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
      status: 'active',
      available: true,
      price: 'KSh 15,000/day',
      location: 'Nakuru, Kenya',
      seats: 5,
      fuelType: 'Petrol',
      transmission: 'Automatic',
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
    },
  ]);

  const handleAddVehicle = () => {
    lightHaptic();
    navigation.navigate('HostVehicle');
  };

  const toggleAvailability = (id) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === id ? { ...car, available: !car.available } : car
      )
    );
  };

  const handleCardPress = (item) => {
    navigation.navigate('CarDetails', { car: item });
  };

  const renderCarCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.carCard}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.7}
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
        <View style={styles.carTitleRow}>
          <View style={styles.carTitleContainer}>
            <Text style={styles.carName}>{item.name}</Text>
            <Text style={styles.carModel}>{item.model}</Text>
          </View>
          <Switch
            value={!!item.available}
            onValueChange={() => toggleAvailability(item.id)}
            trackColor={{ false: '#E5E5EA', true: COLORS.brand }}
            thumbColor="#FFFFFF"
            style={styles.switch}
          />
        </View>
        
        <View style={styles.carDetails}>
          <View style={styles.carDetailItem}>
            <Ionicons name="location-outline" size={12} color="#8E8E93" />
            <Text style={styles.carDetailText}>{item.location}</Text>
          </View>
          <View style={styles.carDetailItem}>
            <Ionicons name="cash-outline" size={12} color="#8E8E93" />
            <Text style={styles.carDetailText}>{item.price}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  carImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  carTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  carTitleContainer: {
    flex: 1,
  },
  carName: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#1C1C1E',
  },
  switch: {
    transform: [{ scale: 0.8 }],
    marginLeft: 8,
  },
  carModel: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  carDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  carDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  carDetailText: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
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
