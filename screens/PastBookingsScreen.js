import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Image, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import StatusModal from '../ui/StatusModal';
import { getHostBookings, getClientDisplayName, isBookingCompleted, getBookingStatusDisplayText, deleteBooking } from '../services/bookingService';
import { fetchCarImagesFromSupabase } from '../services/carService';
import { getUserId } from '../utils/userStorage';

const SKELETON_CARD_COUNT = 4;

function SkeletonBlock({ style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.skeletonBlock, style, { opacity }]}
    />
  );
}

function PastBookingCardSkeleton() {
  return (
    <View style={styles.gridCard}>
      <View style={styles.gridHeaderRow}>
        <SkeletonBlock style={styles.skeletonAvatar} />
        <View style={styles.gridDetails}>
          <SkeletonBlock style={styles.skeletonTitle} />
          <View style={styles.skeletonMetrics}>
            <SkeletonBlock style={styles.skeletonLineShort} />
            <SkeletonBlock style={styles.skeletonLineMedium} />
            <SkeletonBlock style={styles.skeletonLineShort} />
            <SkeletonBlock style={styles.skeletonLineTiny} />
          </View>
          <View style={styles.skeletonAmountRow}>
            <SkeletonBlock style={styles.skeletonAmountLabel} />
            <SkeletonBlock style={styles.skeletonAmountValue} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PastBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, bookingId: null });
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });

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

  const loadBookings = async ({ showFullScreenLoader = true } = {}) => {
    if (showFullScreenLoader) {
      setIsLoading(true);
    }
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
    loadBookings({ showFullScreenLoader: false });
  }, []);

  useEffect(() => {
    loadBookings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const confirmDeleteBooking = (bookingId) => {
    if (!bookingId) return;
    setDeleteModal({ visible: true, bookingId });
  };

  const handleDeleteConfirmed = async () => {
    const bookingId = deleteModal.bookingId;
    if (!bookingId) {
      setDeleteModal({ visible: false, bookingId: null });
      return;
    }
    try {
      const result = await deleteBooking(bookingId);
      if (result.success) {
        setBookings((prev) => prev.filter((b) => (b.bookingId || b.id) !== bookingId));
        setDeleteModal({ visible: false, bookingId: null });
      } else {
        setDeleteModal({ visible: false, bookingId: null });
        setErrorModal({
          visible: true,
          message: result.error || 'Failed to delete booking. Please try again.',
        });
      }
    } catch (e) {
      setDeleteModal({ visible: false, bookingId: null });
      setErrorModal({
        visible: true,
        message: e?.message || 'Failed to delete booking. Please try again.',
      });
    }
  };

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
          <View style={styles.skeletonGrid} accessibilityLabel="Loading past bookings">
            {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
              <PastBookingCardSkeleton key={`skeleton-${i}`} />
            ))}
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
                <View key={b.id} style={styles.gridCard}>
                  <TouchableOpacity
                    style={styles.cardPressArea}
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
                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={() => {
                      lightHaptic();
                      confirmDeleteBooking(b.bookingId || b.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      {/* Delete confirm modal */}
      <StatusModal
        visible={deleteModal.visible}
        type="info"
        title="Delete booking"
        message="Are you sure you want to permanently delete this booking?"
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimary={handleDeleteConfirmed}
        onSecondary={() => setDeleteModal({ visible: false, bookingId: null })}
        onRequestClose={() => setDeleteModal({ visible: false, bookingId: null })}
      />

      {/* Error modal */}
      <StatusModal
        visible={errorModal.visible}
        type="error"
        title="Unable to delete"
        message={errorModal.message}
        primaryLabel="OK"
        onPrimary={() => setErrorModal({ visible: false, message: '' })}
      />
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
  cardPressArea: {
    flex: 1,
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
  deleteIconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  skeletonGrid: {
    marginTop: 16,
  },
  skeletonBlock: {
    backgroundColor: COLORS.borderStrong,
    borderRadius: 6,
  },
  skeletonAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  skeletonTitle: {
    height: 16,
    width: '78%',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonMetrics: {
    gap: 8,
  },
  skeletonLineShort: {
    height: 12,
    width: '55%',
    borderRadius: 6,
  },
  skeletonLineMedium: {
    height: 12,
    width: '72%',
    borderRadius: 6,
  },
  skeletonLineTiny: {
    height: 12,
    width: '40%',
    borderRadius: 6,
  },
  skeletonAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderStrong,
  },
  skeletonAmountLabel: {
    height: 12,
    width: '38%',
    borderRadius: 6,
  },
  skeletonAmountValue: {
    height: 14,
    width: '28%',
    borderRadius: 6,
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
