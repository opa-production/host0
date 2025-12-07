import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MyListingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Mock data - TODO: Replace with actual API data
  const cars = [
    {
      id: '1',
      name: 'BMW M3',
      image: require('../assets/images/bmw.jpg'),
      status: 'active',
      price: 'KSh 5,000/day',
      location: 'Nakuru, Kenya',
    },
    {
      id: '2',
      name: 'Toyota Corolla',
      image: require('../assets/images/bm.jpg'),
      status: 'listed',
      price: 'KSh 3,000/day',
      location: 'Nakuru, Kenya',
    },
  ];

  const services = [
    {
      id: '1',
      name: 'Chauffeur Service',
      image: require('../assets/images/deon.jpg'),
      type: 'chauffeur',
      status: 'active',
      price: 'KSh 2,000/day',
      location: 'Nakuru, Kenya',
    },
    {
      id: '2',
      name: 'Road Trip Service',
      image: require('../assets/images/jeep.jpg'),
      type: 'roadtrip',
      status: 'listed',
      price: 'KSh 8,000/trip',
      location: 'Nakuru, Kenya',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'listed':
        return '#FF9800';
      case 'inactive':
        return '#999999';
      default:
        return '#666666';
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Listings</Text>
          <Text style={styles.subtitle}>Manage your cars and services</Text>
        </View>

        {/* Cars Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-outline" size={20} color="#000000" />
            <Text style={styles.sectionTitle}>Cars ({cars.length})</Text>
          </View>

          {cars.length > 0 ? (
            <View style={styles.listingsContainer}>
              {cars.map((car) => (
                <TouchableOpacity
                  key={car.id}
                  style={styles.listingCard}
                  activeOpacity={0.8}
                >
                  {car.image ? (
                    <Image source={car.image} style={styles.listingImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.listingImagePlaceholder}>
                      <Ionicons name="car-outline" size={32} color="#cccccc" />
                    </View>
                  )}
                  
                  <View style={styles.listingContent}>
                    <View style={styles.listingHeader}>
                      <Text style={styles.listingName}>{car.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(car.status) + '15' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(car.status) }]}>
                          {getStatusText(car.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.listingDetails}>
                      <Ionicons name="location-outline" size={14} color="#666666" />
                      <Text style={styles.listingLocation}>{car.location}</Text>
                    </View>
                    
                    <Text style={styles.listingPrice}>{car.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#cccccc" />
              <Text style={styles.emptyStateText}>No cars listed</Text>
            </View>
          )}
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct-outline" size={20} color="#000000" />
            <Text style={styles.sectionTitle}>Services ({services.length})</Text>
          </View>

          {services.length > 0 ? (
            <View style={styles.listingsContainer}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.listingCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.serviceIconContainer}>
                    <Ionicons 
                      name={service.type === 'chauffeur' ? 'person-outline' : 'map-outline'} 
                      size={32} 
                      color="#666666" 
                    />
                  </View>
                  
                  <View style={styles.listingContent}>
                    <View style={styles.listingHeader}>
                      <Text style={styles.listingName}>{service.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service.status) + '15' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(service.status) }]}>
                          {getStatusText(service.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.listingDetails}>
                      <Ionicons name="location-outline" size={14} color="#666666" />
                      <Text style={styles.listingLocation}>{service.location}</Text>
                    </View>
                    
                    <Text style={styles.listingPrice}>{service.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color="#cccccc" />
              <Text style={styles.emptyStateText}>No services listed</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  listingsContainer: {
    gap: 12,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listingImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f8f8f8',
  },
  listingImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listingName: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
  },
  listingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  listingLocation: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  listingPrice: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
    marginTop: 12,
  },
});

