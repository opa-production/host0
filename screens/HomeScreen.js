import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  // TODO: Replace with actual data from API/context
  const carData = {
    totalCars: 5,
    activelyListed: 3,
    activeRentals: 2,
    available: 2,
  };

  const serviceData = {
    hasServices: true,
    chauffeurs: 2,
    roadTrips: 1,
    otherServices: 0,
  };

  const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Home</Text>
              <Text style={styles.subtitle}>Dashboard Overview</Text>
            </View>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Combined Dashboard Card */}
        <View style={styles.card}>
          {/* Car Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-outline" size={18} color="#000000" />
              <Text style={styles.sectionTitle}>Car Details</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatItem label="Total Cars" value={carData.totalCars} />
              <StatItem label="Actively Listed" value={carData.activelyListed} />
              <StatItem label="Active Rentals" value={carData.activeRentals} />
              <StatItem label="Available" value={carData.available} />
            </View>
          </View>

          {/* Services Section */}
          {serviceData.hasServices && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="construct-outline" size={18} color="#000000" />
                  <Text style={styles.sectionTitle}>Services</Text>
                </View>
                <View style={styles.statsGrid}>
                  <StatItem label="Chauffeurs" value={serviceData.chauffeurs} />
                  <StatItem label="Road Trips" value={serviceData.roadTrips} />
                  {serviceData.otherServices > 0 && (
                    <StatItem label="Other Services" value={serviceData.otherServices} />
                  )}
                </View>
              </View>
            </>
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
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  section: {
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginVertical: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
});
