import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostBookings, getClientDisplayName, isBookingCompleted, getBookingStatusDisplayText } from '../services/bookingService';
import { fetchCarImagesFromSupabase } from '../services/carService';
import { getUserId } from '../utils/userStorage';

export default function PastBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getStatusColor = (status) => {
    if (isBookingCompleted(status)) return '#34C759'; // Completed (car dropped off)
    switch ((status || '').toLowerCase()) {
      case 'active':
        return '#007AFF';
      case 'upcoming':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status) => getBookingStatusDisplayText(status);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const result = await getHostBookings();
      if (result.success && result.bookings) {
        // Filter for completed/dropped-off bookings only
        const completedBookings = result.bookings.filter(isBookingCompleted);

        // Fetch car images for each booking
        const userId = await getUserId();
        const bookingsWithImages = await Promise.all(
          completedBookings.map(async (booking) => {
            let coverImage = null;
            
            // First, try to use car_image_urls from API
            if (booking.car_image_urls && booking.car_image_urls.length > 0) {
              coverImage = booking.car_image_urls[0];
            } else if (booking.car_id && userId) {
              // Fallback: fetch from Supabase (same as my cars page)
              const imageResult = await fetchCarImagesFromSupabase(booking.car_id, userId);
              coverImage = imageResult.coverPhoto;
            }

            return {
              id: booking.id,
              bookingId: booking.booking_id,
              carId: booking.car_id,
              vehicleName: booking.car_name || 'Unknown Car',
              carModel: booking.car_model || '',
              vehicleImage: coverImage,
              location: booking.pickup_location?.[0] || '',
              startDate: formatDate(booking.start_date),
              endDate: formatDate(booking.end_date),
              status: booking.status,
              totalAmount: booking.total_price || 0,
              totalPaid: booking.total_price || 0,
              payout: booking.total_price || 0,
              startTime: booking.pickup_time || '',
              endTime: booking.return_time || '',
              duration: booking.rental_days ? `${booking.rental_days} ${booking.rental_days === 1 ? 'day' : 'days'}` : '',
              plate: booking.car_plate || '',
              renter: {
                name: getClientDisplayName(booking),
                bio: '',
                rating: 0,
                trips: 0,
                avatar: null,
              },
            };
          })
        );
        
        setBookings(bookingsWithImages);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading past bookings:', error);
      setBookings([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, []);

  useEffect(() => {
    loadBookings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Bookings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.text} />
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No past bookings</Text>
            <Text style={styles.emptyStateText}>Your completed bookings will appear here</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {bookings.map((b) => {
              const coverImage = b.vehicleImage;
              
              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.gridCard}
                  onPress={() => {
                    lightHaptic();
                    navigation.navigate('PastBookingDetail', { booking: b });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.gridHeaderRow}>
                    {coverImage ? (
                      <Image 
                        source={{ uri: coverImage }} 
                        style={styles.vehicleAvatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.vehicleAvatar}>
                        <Ionicons name="car-outline" size={24} color={COLORS.subtle} />
                      </View>
                    )}
                    <View style={styles.gridDetails}>
                      <Text style={styles.gridTitle} numberOfLines={1}>
                        {b.vehicleName} {b.carModel ? `• ${b.carModel}` : ''}
                      </Text>
                      <View style={styles.gridMetrics}>
                        <View style={styles.gridMetricItem}>
                          <Ionicons name="person-outline" size={14} color={COLORS.subtle} />
                          <Text style={styles.gridMetricText} numberOfLines={1}>
                            {b.renter?.name || 'Client'}
                          </Text>
                        </View>
                        <View style={styles.gridMetricItem}>
                          <Ionicons name="calendar-outline" size={14} color={COLORS.subtle} />
                          <Text style={styles.gridMetricText}>
                            {b.startDate} - {b.endDate}
                          </Text>
                        </View>
                        {b.duration && (
                          <View style={styles.gridMetricItem}>
                            <Ionicons name="time-outline" size={14} color={COLORS.subtle} />
                            <Text style={styles.gridMetricText}>
                              {b.duration}
                            </Text>
                          </View>
                        )}
                        <View style={styles.gridMetricItem}>
                          <View style={[styles.statusDot, { backgroundColor: getStatusColor(b.status) }]} />
                          <Text style={[styles.gridMetricText, { color: getStatusColor(b.status) }]}>
                            {getStatusText(b.status)}
                          </Text>
                        </View>
                      </View>
                      {b.totalPaid && (
                        <View style={styles.amountRow}>
                          <Text style={styles.amountLabel}>Amount Earned</Text>
                          <Text style={styles.amountValue}>KSh {typeof b.totalPaid === 'string' ? b.totalPaid.replace(/[^\d]/g, '') : b.totalPaid.toLocaleString()}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  content: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  grid: {
    marginTop: 16,
  },
  gridCard: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  vehicleAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F7',
  },
  gridDetails: {
    flex: 1,
  },
  gridTitle: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  gridMetrics: {
    gap: 6,
  },
  gridMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridMetricText: {
    ...TYPE.body,
    fontSize: 13,
    color: '#1C1C1E',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderStrong,
  },
  amountLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  amountValue: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'Nunito-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    ...TYPE.caption,
    color: COLORS.subtle,
    flex: 1,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    ...TYPE.section,
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
  },
});
