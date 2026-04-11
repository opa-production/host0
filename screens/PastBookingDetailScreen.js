import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, StatusBar, TouchableOpacity,
  ScrollView, Image, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import StatusModal from '../ui/StatusModal';
import { fetchCarImagesFromSupabase } from '../services/carService';
import { fetchClientAvatarFromSupabase } from '../services/mediaService';
import {
  getBookingDetails,
  getClientDisplayName,
  getBookingStatusDisplayText,
  getHostBookings,
  isBookingCompleted,
  isBookingCancelled,
  getHostBookingMoneyForDisplay,
} from '../services/bookingService';
import { getHostClientProfile } from '../services/clientProfileService';
import { getClientRatings, submitHostClientRating } from '../services/ratingService';
import { downloadBookingReceipt } from '../services/receiptService';
import { getUserId } from '../utils/userStorage';
import {
  pastBookingDetailCache,
  PAST_BOOKING_DETAIL_TTL_MS,
} from '../utils/screenDataCache';

// ─── Skeleton helpers ────────────────────────────────────────────────────────

function SkeletonPulse({ style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: '#E5E5EA', borderRadius: 6 }, style, { opacity }]} />;
}

function SkeletonCard({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

function SkeletonRow({ labelWidth = 80, valueWidth = 120 }) {
  return (
    <View style={styles.detailRow}>
      <SkeletonPulse style={{ width: labelWidth, height: 13 }} />
      <SkeletonPulse style={{ width: valueWidth, height: 13 }} />
    </View>
  );
}

function LoadingSkeleton({ insets }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero card skeleton */}
      <View style={styles.heroCard}>
        <SkeletonPulse style={{ width: 60, height: 60, borderRadius: 30, marginRight: 14 }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonPulse style={{ width: '70%', height: 16 }} />
          <SkeletonPulse style={{ width: '45%', height: 12 }} />
          <SkeletonPulse style={{ width: '55%', height: 12 }} />
        </View>
      </View>

      {/* Booking meta skeleton */}
      <SkeletonCard>
        <View style={styles.statusHeader}>
          <View style={styles.bookingIdRow}>
            <SkeletonPulse style={{ width: 80, height: 12 }} />
            <SkeletonPulse style={{ width: 110, height: 12 }} />
          </View>
          <SkeletonPulse style={{ width: 90, height: 26, borderRadius: 13 }} />
        </View>
      </SkeletonCard>

      {/* Trip details skeleton */}
      <SkeletonCard>
        <SkeletonPulse style={{ width: 90, height: 15, marginBottom: SPACING.m }} />
        <SkeletonRow labelWidth={40} valueWidth={140} />
        <View style={styles.tripDivider} />
        <SkeletonRow labelWidth={30} valueWidth={140} />
        <View style={styles.tripDivider} />
        <SkeletonRow labelWidth={65} valueWidth={80} />
      </SkeletonCard>

      {/* Locations skeleton */}
      <SkeletonCard>
        <SkeletonPulse style={{ width: 70, height: 15, marginBottom: SPACING.m }} />
        <SkeletonRow labelWidth={50} valueWidth={160} />
        <View style={styles.divider} />
        <SkeletonRow labelWidth={55} valueWidth={150} />
      </SkeletonCard>

      {/* Renter skeleton */}
      <SkeletonCard>
        <View style={[styles.sectionHeader, { marginBottom: SPACING.m }]}>
          <SkeletonPulse style={{ width: 55, height: 15 }} />
          <SkeletonPulse style={{ width: 50, height: 30, borderRadius: 8 }} />
        </View>
        <View style={styles.renterTopRow}>
          <SkeletonPulse style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonPulse style={{ width: '55%', height: 14 }} />
            <SkeletonPulse style={{ width: '80%', height: 12 }} />
          </View>
        </View>
        <View style={[styles.renterStatsRow, { marginTop: 12, gap: 8 }]}>
          <SkeletonPulse style={{ width: 120, height: 28, borderRadius: 14 }} />
          <SkeletonPulse style={{ width: 80, height: 28, borderRadius: 14 }} />
        </View>
      </SkeletonCard>

      {/* Price skeleton */}
      <SkeletonCard>
        <SkeletonPulse style={{ width: 110, height: 15, marginBottom: SPACING.m }} />
        <SkeletonRow labelWidth={70} valueWidth={90} />
        <View style={styles.divider} />
        <SkeletonRow labelWidth={80} valueWidth={100} />
        <View style={styles.divider} />
        <SkeletonRow labelWidth={75} valueWidth={110} />
        <View style={styles.divider} />
        <SkeletonRow labelWidth={110} valueWidth={95} />
        <View style={styles.divider} />
        <SkeletonRow labelWidth={90} valueWidth={100} />
      </SkeletonCard>
    </ScrollView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  if (isBookingCompleted(statusLower)) return '#34C759';
  if (isBookingCancelled(statusLower)) return '#FF3B30';
  switch (statusLower) {
    case 'confirmed':
    case 'active':
      return '#007AFF';
    case 'pending':
    case 'upcoming':
      return '#FF9500';
    default:
      return '#8E8E93';
  }
};

const getStatusText = (status) => getBookingStatusDisplayText(status);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PastBookingDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [vehicleImage, setVehicleImage] = useState(null);
  const [clientAvatar, setClientAvatar] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const [clientRatingSummary, setClientRatingSummary] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [clientProfile, setClientProfile] = useState(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [carTrips, setCarTrips] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const routeBooking = route?.params?.booking || {};
  const clientId = detailBooking?.client_id ?? routeBooking?.clientId ?? routeBooking?.client_id ?? null;
  const bookingId = routeBooking?.bookingId ?? routeBooking?.id ?? null;

  useEffect(() => {
    let cancelled = false;

    const loadBookingEnhancements = async () => {
      const cacheKey = String(bookingId ?? '');

      // ── Cache hit ──────────────────────────────────────────────────────────
      if (cacheKey) {
        const cached = pastBookingDetailCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < PAST_BOOKING_DETAIL_TTL_MS) {
          if (!cancelled) {
            setDetailBooking(cached.detailBooking);
            setClientProfile(cached.clientProfile);
            setClientRatingSummary(cached.clientRatingSummary);
            setVehicleImage(cached.vehicleImage);
            setClientAvatar(cached.clientAvatar);
            setCarTrips(cached.carTrips);
            setIsLoading(false);
          }
          return;
        }
      }

      // ── Cache miss — fetch everything ──────────────────────────────────────
      let resolvedVehicleImage = typeof routeBooking.vehicleImage === 'string'
        ? routeBooking.vehicleImage
        : null;
      let resolvedClientAvatar = routeBooking.renter?.avatar || null;

      const resolvedBookingId = routeBooking.bookingId || routeBooking.id;
      const userId = await getUserId();
      if (cancelled) return;

      let nextDetailBooking = null;
      let nextClientRatingSummary = null;
      let nextClientProfile = null;
      let nextCarTrips = null;

      if (resolvedBookingId) {
        const detailResult = await getBookingDetails(resolvedBookingId);
        if (cancelled) return;
        if (detailResult.success && detailResult.booking) {
          const b = detailResult.booking;
          nextDetailBooking = b;
          setDetailBooking(b);

          if (!resolvedVehicleImage && Array.isArray(b.car_image_urls) && b.car_image_urls.length > 0) {
            resolvedVehicleImage = b.car_image_urls[0];
          }

          let avatarFromApi =
            b.client_avatar_url ||
            b.client_avatar ||
            b.client?.avatar_url ||
            b.client?.profile_image_uri ||
            null;
          if (!avatarFromApi && b.client_id) {
            avatarFromApi = await fetchClientAvatarFromSupabase(b.client_id);
          }
          resolvedClientAvatar = avatarFromApi || resolvedClientAvatar;

          // Count trips for this car (reuse host bookings — backend Redis caches this)
          try {
            const bookingsResult = await getHostBookings();
            if (bookingsResult.success && Array.isArray(bookingsResult.bookings)) {
              nextCarTrips = bookingsResult.bookings.filter(
                (bk) => bk.car_id === b.car_id && isBookingCompleted(bk)
              ).length;
              setCarTrips(nextCarTrips);
            }
          } catch (_) {}

          if (b.client_id) {
            const [ratingsResult, profileResult] = await Promise.all([
              getClientRatings(b.client_id),
              getHostClientProfile(b.client_id),
            ]);
            if (cancelled) return;

            if (ratingsResult.success) {
              nextClientRatingSummary = {
                average: ratingsResult.average ?? 0,
                count: ratingsResult.count ?? 0,
              };
              setClientRatingSummary(nextClientRatingSummary);
            }

            if (profileResult.success && profileResult.profile) {
              nextClientProfile = profileResult.profile;
              setClientProfile(profileResult.profile);
              if (profileResult.profile.avatar_url) {
                resolvedClientAvatar = profileResult.profile.avatar_url;
              }
            }
          }
        }
      }

      if (!resolvedVehicleImage && routeBooking.carId) {
        const carId = routeBooking.carId;
        if (userId && carId) {
          const imageResult = await fetchCarImagesFromSupabase(carId, userId);
          if (imageResult.coverPhoto) resolvedVehicleImage = imageResult.coverPhoto;
        }
      }

      if (cancelled) return;

      setVehicleImage(resolvedVehicleImage);
      setClientAvatar(resolvedClientAvatar);
      setIsLoading(false);

      // ── Populate cache ─────────────────────────────────────────────────────
      if (cacheKey) {
        pastBookingDetailCache.set(cacheKey, {
          detailBooking: nextDetailBooking,
          clientProfile: nextClientProfile,
          clientRatingSummary: nextClientRatingSummary,
          vehicleImage: resolvedVehicleImage,
          clientAvatar: resolvedClientAvatar,
          carTrips: nextCarTrips,
          timestamp: Date.now(),
        });
      }
    };

    loadBookingEnhancements();
    return () => { cancelled = true; };
  }, [routeBooking.vehicleImage, routeBooking.carId, routeBooking.bookingId, routeBooking.id]);

  const statusResolved = (detailBooking?.status ?? routeBooking?.status ?? '').trim();
  const cancelled = isBookingCancelled(statusResolved);

  const financialBooking =
    detailBooking ||
    ({
      status: routeBooking.status,
      total_price: routeBooking.total_price ?? routeBooking.totalPaid,
      commission_amount: routeBooking.commission_amount,
      platform_commission: routeBooking.platform_commission,
      commission: routeBooking.commission,
      platform_fee: routeBooking.platform_fee,
      commission_rate: routeBooking.commission_rate,
      platform_commission_rate: routeBooking.platform_commission_rate,
      host_payout: routeBooking.host_payout,
      net_payout: routeBooking.net_payout,
      payout_amount: routeBooking.payout_amount,
      host_earnings: routeBooking.host_earnings,
      net_amount: routeBooking.net_amount,
    });

  const displayMoney = getHostBookingMoneyForDisplay(financialBooking);

  const payout = displayMoney.hasEarnings ? displayMoney.payoutAmount : 0;
  const totalPaid = displayMoney.hasEarnings ? displayMoney.totalPrice : 0;
  const commissionFromApi = displayMoney.hasEarnings ? displayMoney.commissionAmount : 0;

  const mergedVehicleName = [
    routeBooking.vehicleName || detailBooking?.car_name || '',
    routeBooking.carModel || detailBooking?.car_model || '',
  ]
    .filter(Boolean)
    .join(' • ');

  const booking = {
    vehicleName: mergedVehicleName || 'Unknown Car',
    vehicleImage: vehicleImage || routeBooking.vehicleImage || null,
    plate: routeBooking.plate || detailBooking?.car_plate || '',
    location: routeBooking.location || '',
    startDate: routeBooking.startDate || '',
    endDate: routeBooking.endDate || '',
    startTime: routeBooking.startTime || '',
    endTime: routeBooking.endTime || '',
    duration: routeBooking.duration || '',
    status: routeBooking.status || '',
    payout,
    totalPaid,
    commission: commissionFromApi,
    dailyRate: routeBooking.dailyRate || 0,
    carRating: detailBooking?.car_rating ?? detailBooking?.car_avg_rating ?? null,
    carTrips:
      carTrips ??
      detailBooking?.car_total_trips ??
      detailBooking?.car_trips_count ??
      null,
    renter: {
      name: clientProfile?.full_name || routeBooking.renter?.name || getClientDisplayName(detailBooking) || 'Client',
      bio: routeBooking.renter?.bio || detailBooking?.client_bio || '',
      rating: clientProfile?.average_rating ?? clientRatingSummary?.average ?? routeBooking.renter?.rating ?? detailBooking?.client_rating ?? detailBooking?.client_avg_rating ?? 0,
      trips: clientProfile?.trips_count ?? routeBooking.renter?.trips ?? detailBooking?.client_trips_count ?? detailBooking?.client_total_trips ?? 0,
      avatar: clientAvatar || null,
      email: clientProfile?.email || routeBooking.renter?.email || detailBooking?.client_email || routeBooking.client_email || routeBooking.renter_email || '',
      phone: routeBooking.renter?.phone || detailBooking?.client_mobile_number || detailBooking?.client_phone || routeBooking.client_phone || routeBooking.renter_phone || '',
      idNumber: routeBooking.renter?.idNumber || detailBooking?.client_id_number || routeBooking.client_id_number || routeBooking.renter_id_number || '',
    },
  };

  const ratingLabel = useMemo(() => {
    if (!rating) return 'Tap a star';
    if (rating >= 5) return 'Excellent';
    if (rating === 4) return 'Great';
    if (rating === 3) return 'Okay';
    if (rating === 2) return 'Not great';
    return 'Poor';
  }, [rating]);

  const submitRating = async () => {
    if (!rating) {
      setStatusModal({ visible: true, type: 'info', title: 'Select a rating', message: 'Please tap a star to rate your renter.' });
      return;
    }
    if (!clientId || !bookingId) {
      setStatusModal({ visible: true, type: 'error', title: 'Rating unavailable', message: 'Booking or client information is missing. Please refresh and try again.' });
      return;
    }

    lightHaptic();
    setSubmittingRating(true);
    try {
      const result = await submitHostClientRating({
        client_id: clientId,
        booking_id: String(bookingId),
        rating: Number(rating),
        note: note.trim() || undefined,
      });
      if (result.success) {
        setRateOpen(false);
        setRating(0);
        setNote('');
        if (clientId) {
          const refetch = await getClientRatings(clientId);
          if (refetch.success) {
            const updated = { average: refetch.average ?? 0, count: refetch.count ?? 0 };
            setClientRatingSummary(updated);
            // Invalidate cache so re-open shows fresh rating
            if (bookingId) {
              const key = String(bookingId);
              const cached = pastBookingDetailCache.get(key);
              if (cached) pastBookingDetailCache.set(key, { ...cached, clientRatingSummary: updated, timestamp: Date.now() });
            }
          }
        }
        setStatusModal({ visible: true, type: 'success', title: 'Thanks!', message: `You rated ${booking?.renter?.name || 'the renter'} ${rating}★.` });
      } else {
        setStatusModal({ visible: true, type: 'error', title: 'Rating failed', message: result.error || 'Could not submit rating. Try again.' });
      }
    } catch (e) {
      setStatusModal({ visible: true, type: 'error', title: 'Error', message: e?.message || 'Could not submit rating.' });
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0';
    if (typeof amount === 'string') {
      const num = parseInt(amount.replace(/[^\d]/g, ''), 10);
      return isNaN(num) ? '0' : num.toLocaleString();
    }
    return amount.toLocaleString();
  };

  const dailyRateDisplay = detailBooking?.daily_rate ?? routeBooking.daily_rate ?? routeBooking.dailyRate;
  const basePriceDisplay = detailBooking?.base_price ?? routeBooking.base_price ?? routeBooking.basePrice;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { lightHaptic(); navigation.goBack(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.backButton} />
      </View>

      {/* Loading skeleton */}
      {isLoading ? (
        <LoadingSkeleton insets={insets} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {!booking.vehicleName ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No booking details</Text>
              <Text style={styles.emptyStateText}>Booking information will appear here</Text>
            </View>
          ) : (
            <>
              {/* Booking Meta & Status */}
              <View style={styles.card}>
                <View style={styles.statusHeader}>
                  <View style={styles.bookingIdRow}>
                    <Text style={styles.bookingIdLabel}>Booking ID</Text>
                    <Text style={styles.bookingIdValue}>
                      {detailBooking?.booking_id || routeBooking.bookingId || routeBooking.id || '—'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(detailBooking?.status || routeBooking.status || 'completed') + '1A' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(detailBooking?.status || routeBooking.status || 'completed') },
                      ]}
                    >
                      {getStatusText(detailBooking?.status || routeBooking.status || 'completed')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vehicle Info */}
              <View style={styles.heroCard}>
                {booking.vehicleImage ? (
                  <Image
                    source={typeof booking.vehicleImage === 'string' ? { uri: booking.vehicleImage } : booking.vehicleImage}
                    style={styles.heroAvatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.heroAvatar}>
                    <Ionicons name="car-outline" size={24} color={COLORS.subtle} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>{booking.vehicleName?.trim?.() || 'Unknown Car'}</Text>
                  <View style={styles.carStatsRow}>
                    <View style={styles.carStatItem}>
                      <Ionicons name="star" size={14} color="#FFCC00" />
                      <Text style={styles.carStatText}>{(booking.carRating ?? 4.8).toFixed(1)} rating</Text>
                    </View>
                    <View style={styles.carStatItem}>
                      <Ionicons name="car-sport-outline" size={14} color={COLORS.subtle} />
                      <Text style={styles.carStatText}>{(booking.carTrips ?? 12)} trips</Text>
                    </View>
                  </View>
                  {booking.location && <Text style={styles.heroSub}>{booking.location}</Text>}
                  {booking.plate && (
                    <View style={styles.plateRow}>
                      <Ionicons name="car-sport-outline" size={14} color={COLORS.subtle} />
                      <Text style={styles.plateText}>{booking.plate}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Trip Details */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Trip details</Text>
                <View style={styles.detailRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Start</Text>
                    <Text style={styles.detailValue}>
                      {booking.startDate || detailBooking?.start_date || ''}
                      {(booking.startTime || detailBooking?.pickup_time) &&
                        ` • ${booking.startTime || detailBooking?.pickup_time}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.tripDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>End</Text>
                    <Text style={styles.detailValue}>
                      {booking.endDate || detailBooking?.end_date || ''}
                      {(booking.endTime || detailBooking?.return_time) &&
                        ` • ${booking.endTime || detailBooking?.return_time}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.tripDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {(detailBooking?.rental_days ??
                      routeBooking.rental_days ??
                      routeBooking.rentalDays ??
                      booking.duration) || '—'}
                  </Text>
                </View>
              </View>

              {/* Locations */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Locations</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pickup</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {Array.isArray(detailBooking?.pickup_location)
                      ? detailBooking.pickup_location.join(', ')
                      : detailBooking?.pickup_location ||
                        routeBooking.pickup_location ||
                        routeBooking.pickupLocation ||
                        'Not specified'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dropoff</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {Array.isArray(detailBooking?.return_location)
                      ? detailBooking.return_location.join(', ')
                      : detailBooking?.return_location ||
                        routeBooking.return_location ||
                        routeBooking.returnLocation ||
                        'Not specified'}
                  </Text>
                </View>
              </View>

              {/* Renter Info */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Renter</Text>
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => { lightHaptic(); setRateOpen(true); }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.rateButtonText}>Rate</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.renterTopRow}>
                  {booking?.renter?.avatar ? (
                    <Image source={{ uri: booking.renter.avatar }} style={styles.renterAvatar} />
                  ) : (
                    <View style={styles.renterAvatarPlaceholder}>
                      <Ionicons name="person" size={22} color={COLORS.subtle} />
                    </View>
                  )}
                  <View style={styles.renterTopDetails}>
                    <Text style={styles.renterName}>{booking?.renter?.name || 'Renter'}</Text>
                    {booking?.renter?.bio ? (
                      <Text style={styles.renterBio} numberOfLines={2}>{booking.renter.bio}</Text>
                    ) : (
                      <Text style={styles.renterBioMuted}>No profile bio added yet.</Text>
                    )}
                  </View>
                </View>

                <View style={styles.renterStatsRow}>
                  <View style={styles.statPill}>
                    <Ionicons name="star" size={14} color="#FFCC00" />
                    <Text style={styles.statPillText}>
                      {(clientRatingSummary?.average ?? booking?.renter?.rating)
                        ? `${clientRatingSummary?.average ?? booking?.renter?.rating} rating${(clientRatingSummary?.count ?? 0) > 0 ? ` (${clientRatingSummary.count} reviews)` : ''}`
                        : 'No ratings yet'}
                    </Text>
                  </View>
                  <View style={styles.statPill}>
                    <Ionicons name="car-sport-outline" size={14} color={COLORS.subtle} />
                    <Text style={styles.statPillText}>{booking?.renter?.trips ?? 0} trips</Text>
                  </View>
                </View>

                <View style={styles.renterDetailsWrap}>
                  <View style={styles.renterDetailRow}>
                    <Text style={styles.renterDetailLabel}>Email</Text>
                    <Text style={styles.renterDetailValue} numberOfLines={1}>{booking?.renter?.email || 'Not provided'}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.renterDetailRow}>
                    <Text style={styles.renterDetailLabel}>Phone</Text>
                    <Text style={styles.renterDetailValue} numberOfLines={1}>{booking?.renter?.phone || 'Not provided'}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.renterDetailRow}>
                    <Text style={styles.renterDetailLabel}>ID Number</Text>
                    <Text style={styles.renterDetailValue} numberOfLines={1}>{booking?.renter?.idNumber || 'Not provided'}</Text>
                  </View>
                </View>
              </View>

              {/* Price & payout */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Price & payout</Text>

                {cancelled ? (
                  <Text style={styles.cancelledMoneyNote}>
                    This booking was cancelled before the trip completed. There is no guest payment, platform commission, or host payout for this booking.
                  </Text>
                ) : (
                  <>
                    <View style={styles.rowBetween}>
                      <Text style={styles.rowLabel}>Daily rate</Text>
                      <Text style={styles.rowValueMuted}>
                        {dailyRateDisplay != null && dailyRateDisplay !== ''
                          ? `KSh ${formatCurrency(dailyRateDisplay)}`
                          : '—'}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.rowBetween}>
                      <Text style={styles.rowLabel}>Base price</Text>
                      <Text style={styles.rowValueMuted}>
                        {basePriceDisplay != null && basePriceDisplay !== ''
                          ? `KSh ${formatCurrency(basePriceDisplay)}`
                          : '—'}
                      </Text>
                    </View>

                    {detailBooking?.damage_waiver_enabled && (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.rowBetween}>
                          <Text style={styles.rowLabel}>Damage waiver</Text>
                          <Text style={styles.rowValue}>
                            KSh {formatCurrency(detailBooking?.damage_waiver_fee ?? 0)}
                          </Text>
                        </View>
                      </>
                    )}

                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <Text style={[styles.rowLabel, styles.rowStrong]}>Total paid</Text>
                      <Text style={[styles.rowValueOrange, styles.rowStrong]}>
                        KSh {formatCurrency(displayMoney.totalPrice)}
                      </Text>
                    </View>

                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <Text style={styles.rowLabel}>Platform commission</Text>
                      <Text style={styles.rowValueRed}>KSh {formatCurrency(displayMoney.commissionAmount)}</Text>
                    </View>

                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <Text style={styles.rowLabel}>Your payout</Text>
                      <Text style={styles.rowValueGreen}>KSh {formatCurrency(displayMoney.payoutAmount)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <TouchableOpacity
                      style={styles.receiptLink}
                      onPress={async () => {
                        if (!bookingId || isDownloadingReceipt || cancelled) return;
                        setIsDownloadingReceipt(true);
                        const result = await downloadBookingReceipt(bookingId);
                        setIsDownloadingReceipt(false);
                        if (!result.success) {
                          Alert.alert('Receipt', result.error || 'Could not download receipt.');
                        }
                      }}
                      activeOpacity={0.7}
                      disabled={isDownloadingReceipt || cancelled}
                    >
                      <Ionicons name="document-text-outline" size={18} color={COLORS.brand} />
                      <Text style={styles.receiptLinkText}>
                        {isDownloadingReceipt ? 'Opening…' : 'View receipt'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.brand} />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Additional booking details */}
              {(detailBooking?.drive_type ||
                detailBooking?.check_in_preference ||
                detailBooking?.special_requirements) && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Additional details</Text>
                  {detailBooking?.drive_type && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Drive type</Text>
                        <Text style={styles.detailValue}>{detailBooking.drive_type}</Text>
                      </View>
                      <View style={styles.divider} />
                    </>
                  )}
                  {detailBooking?.check_in_preference && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Check-in preference</Text>
                        <Text style={styles.detailValue}>{detailBooking.check_in_preference}</Text>
                      </View>
                      <View style={styles.divider} />
                    </>
                  )}
                  {detailBooking?.special_requirements && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Special requirements</Text>
                      <Text style={styles.detailValue} numberOfLines={3}>
                        {detailBooking.special_requirements}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Rate modal */}
      <Modal
        visible={rateOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRateOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setRateOpen(false)} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCenter}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalTopRow}>
                <Text style={styles.modalTitle}>Rate renter</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => { lightHaptic(); setRateOpen(false); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="close" size={18} color={COLORS.subtle} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub} numberOfLines={1}>
                {booking?.renter?.name || 'Renter'} · {ratingLabel}
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = rating >= n;
                  return (
                    <TouchableOpacity
                      key={`star-${n}`}
                      style={styles.starButton}
                      onPress={() => { lightHaptic(); setRating(n); }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={on ? 'star' : 'star-outline'} size={26} color={on ? '#FFCC00' : '#C7C7CC'} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.noteWrap}>
                <Text style={styles.noteLabel}>Add a note (optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Short feedback"
                  placeholderTextColor={COLORS.subtle}
                  style={styles.noteInput}
                  multiline
                  maxLength={220}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSecondary]}
                  onPress={() => { lightHaptic(); setRateOpen(false); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalSecondaryText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalPrimary, submittingRating && { opacity: 0.7 }]}
                  onPress={submitRating}
                  activeOpacity={0.9}
                  disabled={submittingRating}
                >
                  <Text style={styles.modalPrimaryText}>{submittingRating ? 'Submitting…' : 'Submit'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        primaryLabel="OK"
        onPrimary={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
        onRequestClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
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
    gap: SPACING.m,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.bg,
    marginRight: 14,
  },
  heroTitle: {
    ...TYPE.title,
    flexShrink: 1,
  },
  heroSub: {
    ...TYPE.caption,
    marginTop: 2,
  },
  carStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  carStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  carStatText: {
    ...TYPE.caption,
    color: COLORS.subtle,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  plateText: {
    ...TYPE.caption,
    color: COLORS.subtle,
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 16,
    marginBottom: SPACING.m,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bookingIdRow: {
    flex: 1,
  },
  bookingIdLabel: {
    ...TYPE.caption,
    color: COLORS.subtle,
    marginBottom: 2,
  },
  bookingIdValue: {
    ...TYPE.bodyStrong,
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeText: {
    ...TYPE.bodyStrong,
    fontSize: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  detailLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  detailValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    textAlign: 'right',
    flexShrink: 1,
  },
  tripDivider: {
    height: 1,
    backgroundColor: COLORS.borderStrong,
    marginVertical: SPACING.s,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderStrong,
    marginVertical: SPACING.s,
  },
  renterTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  renterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  renterAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  renterTopDetails: {
    flex: 1,
  },
  renterName: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    marginBottom: 4,
  },
  renterBio: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  renterBioMuted: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.border,
    fontStyle: 'italic',
  },
  renterStatsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statPillText: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.text,
  },
  renterDetailsWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderStrong,
    paddingTop: SPACING.s,
  },
  renterDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  renterDetailLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  renterDetailValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    flexShrink: 1,
    marginLeft: 12,
    textAlign: 'right',
  },
  rateButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.brand,
  },
  rateButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#FFFFFF',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
  },
  rowStrong: {
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  rowValue: {
    ...TYPE.bodyStrong,
    fontSize: 14,
  },
  rowValueMuted: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.text,
  },
  rowValueOrange: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FF9500',
  },
  rowValueRed: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FF3B30',
  },
  rowValueGreen: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#34C759',
  },
  cancelledMoneyNote: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  receiptLinkText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.brand,
    flex: 1,
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
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCenter: {
    padding: SPACING.l,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.l,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    ...TYPE.section,
    fontSize: 17,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSub: {
    ...TYPE.caption,
    marginBottom: SPACING.m,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.m,
  },
  starButton: {
    padding: 4,
  },
  noteWrap: {
    marginBottom: SPACING.m,
  },
  noteLabel: {
    ...TYPE.caption,
    marginBottom: 6,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 10,
    padding: SPACING.s,
    minHeight: 70,
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSecondary: {
    backgroundColor: COLORS.borderStrong,
  },
  modalSecondaryText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
  },
  modalPrimary: {
    backgroundColor: COLORS.brand,
  },
  modalPrimaryText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
