import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  // TODO: Replace with actual data from API/context
  const carData = {
    totalCars: 5,
    activelyListed: 3,
    activeRentals: 2,
  };

  const serviceData = {
    hasServices: true,
    chauffeurs: 2,
    roadTrips: 1,
    otherServices: 0,
  };

  const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
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
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Dashboard Overview</Text>
        </View>

        {/* Car Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car-outline" size={18} color="#000000" />
            <Text style={styles.cardTitle}>Car Details</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <StatItem 
              label="Total Cars" 
              value={carData.totalCars} 
            />
            <StatItem 
              label="Actively Listed" 
              value={carData.activelyListed} 
            />
            <StatItem 
              label="Active Rentals" 
              value={carData.activeRentals} 
            />
          </View>
        </View>

        {/* Services Card */}
        {serviceData.hasServices && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct-outline" size={18} color="#000000" />
              <Text style={styles.cardTitle}>Services</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <StatItem 
                label="Chauffeurs" 
                value={serviceData.chauffeurs} 
              />
              <StatItem 
                label="Road Trips" 
                value={serviceData.roadTrips} 
              />
              {serviceData.otherServices > 0 && (
                <StatItem 
                  label="Other Services" 
                  value={serviceData.otherServices} 
                />
              )}
            </View>
          </View>
        )}
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
    marginBottom: 20,
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
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  statsContainer: {
    gap: 8,
  },
  statItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
});
