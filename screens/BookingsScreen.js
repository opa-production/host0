import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

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

  const booking = { ...mockBooking, status: 'active' };

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
        return '#007AFF';
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
          <View style={styles.grid}>
            <View style={styles.gridCard}>
              <View style={styles.gridHeaderRow}>
                <SkeletonBox width={54} height={54} style={{ borderRadius: 27 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonBox width={120} height={16} style={{ marginBottom: 8 }} />
                  <SkeletonBox width={150} height={12} />
                </View>
                <SkeletonBox width={78} height={22} style={{ borderRadius: 999 }} />
              </View>

              <View style={styles.gridBottomRow}>
                <SkeletonBox width={110} height={18} />
                <SkeletonBox width={96} height={36} style={{ borderRadius: 999 }} />
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
              onPress={() => {
                lightHaptic();
                navigation.navigate('PastBookings');
              }}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="albums-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <View style={styles.gridHeaderRow}>
              <Image source={booking.vehicleImage} style={styles.vehicleAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.gridTitle}>{booking.vehicleName}</Text>
                <Text style={styles.gridSub}>{booking.startDate} - {booking.endDate}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: getStatusColor(booking.status) + '1A' }]}>
                <Text style={[styles.statusPillText, { color: getStatusColor(booking.status) }]}>{getStatusText(booking.status)}</Text>
              </View>
            </View>

            <View style={styles.gridBottomRow}>
              <Text style={styles.gridAmount}>{booking.totalAmount}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ActiveBooking')}
                style={styles.viewPill}
                activeOpacity={0.9}
              >
                <Text style={styles.viewPillText}>View details</Text>
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
  headerIconButton: {
    padding: 6,
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 20,
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
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  viewPill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  viewPillText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
  },
  grid: {
    marginTop: 16,
  },
  gridCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F2F2F7',
  },
  gridTitle: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#1C1C1E',
  },
  gridSub: {
    ...TYPE.body,
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 3,
  },
  gridBottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridAmount: {
    ...TYPE.section,
    color: '#1C1C1E',
  },
});
