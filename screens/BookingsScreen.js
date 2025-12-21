import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

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
            backgroundColor: '#E5E5EA',
            borderRadius: 12,
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
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
            <SkeletonBox width="100%" height={160} style={{ borderRadius: 0 }} />

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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
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
              activeOpacity={1}
            >
              <Ionicons name="notifications-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Card */}
        <View style={styles.bookingCard}>
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
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      mockBooking.status === 'active'
                        ? '#ffffff'
                        : getStatusColor(mockBooking.status) + '15',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        mockBooking.status === 'active'
                          ? '#2e8b57'
                          : getStatusColor(mockBooking.status),
                    },
                  ]}
                >
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

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Messages')}
                activeOpacity={0.9}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111111" />
                <Text style={styles.secondaryButtonText}>Message renter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('ActiveBooking')}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>View details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.l,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  title: {
    ...TYPE.largeTitle,
    marginBottom: 6,
  },
  subtitle: {
    ...TYPE.body,
    color: '#8E8E93',
  },
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  vehicleImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F2F2F7',
  },
  cardContent: {
    padding: SPACING.m,
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
    ...TYPE.section,
    color: '#000000',
    marginBottom: 4,
  },
  location: {
    ...TYPE.caption,
    color: '#8E8E93',
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
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
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
    ...TYPE.micro,
    color: '#8E8E93',
    marginBottom: 2,
  },
  dateValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderStrong,
  },
  amountLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  amountValue: {
    ...TYPE.section,
    color: '#1C1C1E',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#111111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
  },
});
