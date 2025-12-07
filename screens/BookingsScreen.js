import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BookingsScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Mock booking data
  const mockBooking = {
    id: '1',
    vehicleName: 'BMW M3',
    vehicleImage: require('../assets/images/bmw.jpg'),
    renterName: 'John Doe',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    status: 'active', // active, completed, upcoming
    totalAmount: 'KSh 45,000',
    location: 'Nakuru, Kenya',
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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

  const SkeletonBox = ({ width, height, style }) => {
    const [pulseAnim] = useState(new Animated.Value(0.3));

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, []);

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            backgroundColor: '#e8e8e8',
            borderRadius: 8,
            opacity: pulseAnim,
          },
          style,
        ]}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <SkeletonBox width={140} height={32} style={{ marginBottom: 8 }} />
                <SkeletonBox width={200} height={16} />
              </View>
              <SkeletonBox width={48} height={48} style={{ borderRadius: 24 }} />
            </View>
          </View>

          {/* Booking Card Skeleton */}
          <View style={styles.bookingCard}>
            {/* Image Skeleton */}
            <SkeletonBox width="100%" height={200} style={{ borderRadius: 0 }} />

            {/* Content Skeleton */}
            <View style={styles.cardContent}>
              {/* Header Row Skeleton */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <SkeletonBox width={120} height={20} style={{ marginBottom: 8 }} />
                  <SkeletonBox width={150} height={14} />
                </View>
                <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
              </View>

              {/* Renter Info Skeleton */}
              <View style={styles.renterInfo}>
                <SkeletonBox width={16} height={16} style={{ borderRadius: 8 }} />
                <SkeletonBox width={100} height={14} />
              </View>

              {/* Date Range Skeleton */}
              <View style={styles.dateRange}>
                <View style={styles.dateItem}>
                  <SkeletonBox width={16} height={16} style={{ borderRadius: 8 }} />
                  <View style={styles.dateTextContainer}>
                    <SkeletonBox width={70} height={12} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={100} height={14} />
                  </View>
                </View>
                <View style={styles.dateItem}>
                  <SkeletonBox width={16} height={16} style={{ borderRadius: 8 }} />
                  <View style={styles.dateTextContainer}>
                    <SkeletonBox width={60} height={12} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={100} height={14} />
                  </View>
                </View>
              </View>

              {/* Amount Row Skeleton */}
              <View style={styles.amountRow}>
                <SkeletonBox width={100} height={14} />
                <SkeletonBox width={120} height={20} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Bookings</Text>
              <Text style={styles.subtitle}>Manage your bookings</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
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
    </Animated.View>
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
  notificationButton: {
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
