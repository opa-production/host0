import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostBookings, getClientDisplayName, isBookingCompleted, getBookingStatusDisplayText } from '../services/bookingService';
import { fetchCarImagesFromSupabase } from '../services/carService';
import { getUserId } from '../utils/userStorage';
import { getBookingExtensions } from '../services/extensionService';

export default function BookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSh ${numAmount.toLocaleString()}`;
  };

  const formatDuration = (days) => {
    if (!days && days !== 0) return '';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (isBookingCompleted(statusLower)) return '#34C759'; // Completed (car dropped off)
    switch (statusLower) {
      case 'confirmed':
      case 'active':
        return '#007AFF';
      case 'pending':
      case 'upcoming':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status) => getBookingStatusDisplayText(status);

  const SkeletonBox = ({ width, height, style }) => (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#E5E5EA',
          borderRadius: 8,
        },
        style,
      ]}
    />
  );

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const result = await getHostBookings();
      if (result.success && result.bookings) {
        // Only show active/upcoming bookings here; completed/dropped-off go to Past Bookings only
        const activeBookings = result.bookings.filter((b) => !isBookingCompleted(b));

        // Fetch car images for each booking
        const userId = await getUserId();
        const mappedBookings = await Promise.all(
          activeBookings.map(async (booking) => {
            let carImageUrls = booking.car_image_urls || [];
            
            // If no images from API, fetch from Supabase (same as my cars page)
            if (carImageUrls.length === 0 && booking.car_id && userId) {
              const imageResult = await fetchCarImagesFromSupabase(booking.car_id, userId);
              if (imageResult.images && imageResult.images.length > 0) {
                carImageUrls = imageResult.images;
              }
            }

            let pendingExtension = null;
            const statusLower = (booking.status || '').toLowerCase();
            if (statusLower === 'confirmed' || statusLower === 'active') {
              try {
                const extResult = await getBookingExtensions(booking.booking_id || booking.id);
                if (extResult.success && extResult.extensions?.length > 0) {
                  pendingExtension = extResult.extensions.find(e => e.status === 'pending_host_approval') || null;
                }
              } catch (_) {}
            }

            return {
              id: booking.id,
              bookingId: booking.booking_id,
              clientId: booking.client_id,
              carId: booking.car_id,
              carName: booking.car_name || 'Unknown Car',
              carModel: booking.car_model || '',
              carYear: booking.car_year,
              carMake: booking.car_make || '',
              carImageUrls: carImageUrls,
              clientName: getClientDisplayName(booking),
              clientEmail: booking.client_email,
              clientMobile: booking.client_mobile_number,
              startDate: booking.start_date,
              endDate: booking.end_date,
              pickupTime: booking.pickup_time,
              returnTime: booking.return_time,
              pickupLocation: booking.pickup_location || [],
              returnLocation: booking.return_location || [],
              dropoffSameAsPickup: booking.dropoff_same_as_pickup,
              dailyRate: booking.daily_rate,
              rentalDays: booking.rental_days,
              basePrice: booking.base_price,
              damageWaiverFee: booking.damage_waiver_fee,
              totalPrice: booking.total_price,
              damageWaiverEnabled: booking.damage_waiver_enabled,
              driveType: booking.drive_type,
              checkInPreference: booking.check_in_preference,
              specialRequirements: booking.special_requirements,
              status: booking.status,
              statusUpdatedAt: booking.status_updated_at,
              cancellationReason: booking.cancellation_reason,
              createdAt: booking.created_at,
              updatedAt: booking.updated_at,
              pendingExtension,
            };
          })
        );
        
        setBookings(mappedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
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

  const handleBookingPress = async (booking) => {
    lightHaptic();
    // Route completed/dropped-off bookings to past booking detail screen
    if (isBookingCompleted(booking)) {
      // Format booking data for past booking detail screen
      const pastBookingData = {
        id: booking.id,
        bookingId: booking.bookingId || booking.id,
        carId: booking.carId,
        vehicleName: booking.carName || 'Unknown Car',
        carModel: booking.carModel || '',
        vehicleImage: booking.carImageUrls && booking.carImageUrls.length > 0 
          ? booking.carImageUrls[0] 
          : null,
        location: Array.isArray(booking.pickupLocation) 
          ? booking.pickupLocation[0] || '' 
          : booking.pickupLocation || '',
        startDate: formatDate(booking.startDate),
        endDate: formatDate(booking.endDate),
        startTime: booking.pickupTime || '',
        endTime: booking.returnTime || '',
        duration: booking.rentalDays 
          ? `${booking.rentalDays} ${booking.rentalDays === 1 ? 'day' : 'days'}` 
          : '',
        status: booking.status,
        totalPaid: booking.totalPrice || 0,
        payout: booking.totalPrice || 0,
        plate: '',
        renter: {
          name: booking.clientName || 'Client',
          bio: '',
          rating: 0,
          trips: 0,
          avatar: null,
        },
      };
      navigation.navigate('PastBookingDetail', { booking: pastBookingData });
    } else {
      navigation.navigate('ActiveBooking', {
        bookingId: booking.bookingId || booking.id,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Bookings</Text>
              <Text style={styles.subtitle}>Manage your bookings</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={() => {
                  lightHaptic();
                  navigation.navigate('SmartCalendar');
                }}
                style={styles.headerIconButton}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-number-outline" size={24} color="#000000" />
              </TouchableOpacity>
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
        </View>

        {/* Bookings List */}
        {isLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.gridCard, styles.skeletonCard]}>
                <View style={styles.gridHeaderRow}>
                  <SkeletonBox width={60} height={60} style={{ borderRadius: 30 }} />
                  <View style={styles.gridDetails}>
                    <SkeletonBox width={180} height={16} style={{ marginBottom: 8, borderRadius: 6 }} />
                    <View style={styles.gridMetrics}>
                      <SkeletonBox width={120} height={12} style={{ marginBottom: 6, borderRadius: 4 }} />
                      <SkeletonBox width={160} height={12} style={{ marginBottom: 6, borderRadius: 4 }} />
                      <SkeletonBox width={80} height={12} style={{ marginBottom: 6, borderRadius: 4 }} />
                      <SkeletonBox width={70} height={12} style={{ borderRadius: 4 }} />
                    </View>
                    <View style={styles.amountRow}>
                      <SkeletonBox width={90} height={12} style={{ borderRadius: 4 }} />
                      <SkeletonBox width={80} height={14} style={{ borderRadius: 4 }} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : bookings.length > 0 ? (
          <View style={styles.grid}>
            {bookings.map((booking) => {
              const coverImage = booking.carImageUrls && booking.carImageUrls.length > 0 
                ? booking.carImageUrls[0] 
                : null;
              
              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.gridCard}
                  onPress={() => handleBookingPress(booking)}
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
                        {booking.carName} {booking.carModel ? `• ${booking.carModel}` : ''}
                      </Text>
                      <View style={styles.gridMetrics}>
                        <View style={styles.gridMetricItem}>
                          <Ionicons name="person-outline" size={14} color={COLORS.subtle} />
                          <Text style={styles.gridMetricText} numberOfLines={1}>
                            {booking.clientName}
                          </Text>
                        </View>
                        <View style={styles.gridMetricItem}>
                          <Ionicons name="calendar-outline" size={14} color={COLORS.subtle} />
                          <Text style={styles.gridMetricText}>
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </Text>
                        </View>
                        {booking.rentalDays && (
                          <View style={styles.gridMetricItem}>
                            <Ionicons name="time-outline" size={14} color={COLORS.subtle} />
                            <Text style={styles.gridMetricText}>
                              {formatDuration(booking.rentalDays)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.gridMetricItem}>
                          <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                          <Text style={[styles.gridMetricText, { color: getStatusColor(booking.status) }]}>
                            {getStatusText(booking.status)}
                          </Text>
                        </View>
                      </View>
                      {booking.totalPrice && (
                        <View style={styles.amountRow}>
                          <Text style={styles.amountLabel}>Amount Earned</Text>
                          <Text style={styles.amountValue}>{formatCurrency(booking.totalPrice)}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {booking.pendingExtension && (
                    <View style={styles.extensionBanner}>
                      <View style={styles.extensionBannerLeft}>
                        <Ionicons name="time-outline" size={16} color="#FF9500" />
                        <View style={styles.extensionBannerText}>
                          <Text style={styles.extensionBannerTitle}>Extension Request</Text>
                          <Text style={styles.extensionBannerSub}>
                            +{booking.pendingExtension.extra_days} day{booking.pendingExtension.extra_days !== 1 ? 's' : ''} · {formatCurrency(booking.pendingExtension.extra_amount)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.extensionActionHint}>
                        <Text style={styles.extensionActionHintText}>Review</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FF9500" />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No active bookings</Text>
            <Text style={styles.emptySubtitle}>Your active bookings will appear here</Text>
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
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
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  viewLinkText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
    textDecorationLine: 'underline',
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    ...TYPE.section,
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    textAlign: 'center',
  },
  extensionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF95000D',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FF950033',
  },
  extensionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  extensionBannerText: {
    flex: 1,
  },
  extensionBannerTitle: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF9500',
    marginBottom: 2,
  },
  extensionBannerSub: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
  },
  extensionActionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  extensionActionHintText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF9500',
  },
});
