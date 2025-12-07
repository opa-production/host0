import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingsScreen() {
  // Mock booking data
  const mockBooking = {
    id: '1',
    vehicleName: 'BMW M3',
    vehicleImage: require('../assets/images/bmw.jpg'),
    renterName: 'John Doe',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    status: 'active', // active, completed, upcoming
    totalAmount: '$450',
    location: 'San Francisco, CA',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#FF1577';
      case 'completed':
        return '#4CAF50';
      case 'upcoming':
        return '#FF9800';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'upcoming':
        return 'Upcoming';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>Manage your bookings</Text>
        </View>

        {/* Booking Card */}
        <TouchableOpacity 
          style={styles.bookingCard}
          activeOpacity={0.9}
        >
          {/* Vehicle Image */}
          <Image 
            source={mockBooking.vehicleImage} 
            style={styles.vehicleImage}
            resizeMode="cover"
          />

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Header Row */}
            <View style={styles.cardHeader}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{mockBooking.vehicleName}</Text>
                <Text style={styles.location}>
                  <Ionicons name="location-outline" size={14} color="#666666" /> {mockBooking.location}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mockBooking.status) + '15' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(mockBooking.status) }]}>
                  {getStatusText(mockBooking.status)}
                </Text>
              </View>
            </View>

            {/* Renter Info */}
            <View style={styles.renterInfo}>
              <Ionicons name="person-outline" size={16} color="#666666" />
              <Text style={styles.renterName}>{mockBooking.renterName}</Text>
            </View>

            {/* Date Range */}
            <View style={styles.dateRange}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={16} color="#666666" />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateValue}>{mockBooking.startDate}</Text>
                </View>
              </View>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={16} color="#666666" />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <Text style={styles.dateValue}>{mockBooking.endDate}</Text>
                </View>
              </View>
            </View>

            {/* Total Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>{mockBooking.totalAmount}</Text>
            </View>
          </View>
        </TouchableOpacity>
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
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  vehicleImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  renterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  renterName: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  dateRange: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  amountValue: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
});
