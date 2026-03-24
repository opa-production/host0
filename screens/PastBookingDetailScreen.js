import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import StatusModal from '../ui/StatusModal';
import { fetchCarImagesFromSupabase } from '../services/carService';
import { fetchClientAvatarFromSupabase } from '../services/mediaService';
import { getBookingDetails, getClientDisplayName, getBookingStatusDisplayText, getHostBookings, isBookingCompleted } from '../services/bookingService';
import { getHostClientProfile } from '../services/clientProfileService';
import { getClientRatings, submitHostClientRating } from '../services/ratingService';
import { downloadBookingReceipt } from '../services/receiptService';
import { getUserId } from '../utils/userStorage';

const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower === 'completed' || statusLower === 'dropped_off' || statusLower === 'dropped off') {
    return '#34C759';
  }
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
  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const routeBooking = route?.params?.booking || {};
  const clientId = detailBooking?.client_id ?? routeBooking?.clientId ?? routeBooking?.client_id ?? null;
  const bookingId = routeBooking?.bookingId ?? routeBooking?.id ?? null;

  // Fetch full booking details (same source as ActiveBookingScreen) to enrich past-booking UI.
  useEffect(() => {
    const loadBookingEnhancements = async () => {
      let resolvedVehicleImage =
        typeof routeBooking.vehicleImage === 'string' ? routeBooking.vehicleImage : null;
      let resolvedClientAvatar = routeBooking.renter?.avatar || null;

      const bookingId = routeBooking.bookingId || routeBooking.id;
      if (bookingId) {
        const detailResult = await getBookingDetails(bookingId);
        if (detailResult.success && detailResult.booking) {
          const b = detailResult.booking;
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

          // Compute real trips count for this car from host bookings (completed trips)
          try {
            const bookingsResult = await getHostBookings();
            if (bookingsResult.success && Array.isArray(bookingsResult.bookings)) {
              const tripsCount = bookingsResult.bookings.filter((bk) => {
                const sameCar = bk.car_id === b.car_id;
                return sameCar && isBookingCompleted(bk);
              }).length;
              setCarTrips(tripsCount);
            }
          } catch (_) {
            // Fallbacks will handle when this fails
          }
        }
      }

      if (!resolvedVehicleImage && routeBooking.carId) {
        const userId = await getUserId();
        const carId = routeBooking.carId;
        if (userId && carId) {
          const imageResult = await fetchCarImagesFromSupabase(carId, userId);
          if (imageResult.coverPhoto) {
            resolvedVehicleImage = imageResult.coverPhoto;
          }
        }
      }

      setVehicleImage(resolvedVehicleImage);
      setClientAvatar(resolvedClientAvatar);
    };

    loadBookingEnhancements();
  }, [routeBooking.vehicleImage, routeBooking.carId, routeBooking.bookingId, routeBooking.id]);

  // Fetch client rating summary when we have a client id
  useEffect(() => {
    const clientIdToUse = detailBooking?.client_id ?? routeBooking?.clientId ?? routeBooking?.client_id ?? null;
    if (!clientIdToUse) return;

    let cancelled = false;
    (async () => {
      const result = await getClientRatings(clientIdToUse);
      if (cancelled) return;
      if (result.success) {
        setClientRatingSummary({
          average: result.average ?? 0,
          count: result.count ?? 0,
        });
      } else {
        setClientRatingSummary(null);
      }
    })();
    return () => { cancelled = true; };
  }, [detailBooking?.client_id, routeBooking?.clientId, routeBooking?.client_id]);

  // Fetch client profile (trips_count, average_rating, full_name, avatar_url, email) from API
  useEffect(() => {
    const clientIdToUse = detailBooking?.client_id ?? routeBooking?.clientId ?? routeBooking?.client_id ?? null;
    if (!clientIdToUse) return;

    let cancelled = false;
    (async () => {
      const result = await getHostClientProfile(clientIdToUse);
      if (cancelled) return;
      if (result.success && result.profile) {
        setClientProfile(result.profile);
        if (result.profile.avatar_url) {
          setClientAvatar(result.profile.avatar_url);
        }
      } else {
        setClientProfile(null);
      }
    })();
    return () => { cancelled = true; };
  }, [detailBooking?.client_id, routeBooking?.clientId, routeBooking?.client_id]);

  // Convert payout to number if it's a string
  let payout = 0;
  if (routeBooking.payout !== undefined) {
    if (typeof routeBooking.payout === 'string') {
      const numStr = routeBooking.payout.replace(/[^\d]/g, '');
      payout = parseInt(numStr, 10) || 0;
    } else {
      payout = routeBooking.payout || 0;
    }
  }
  
  // Convert totalPaid to number if it's a string
  let totalPaid = 0;
  if (routeBooking.totalPaid !== undefined) {
    if (typeof routeBooking.totalPaid === 'string') {
      const numStr = routeBooking.totalPaid.replace(/[^\d]/g, '');
      totalPaid = parseInt(numStr, 10) || 0;
    } else {
      totalPaid = routeBooking.totalPaid || 0;
    }
  }
  
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
    commission: routeBooking.commission || 0,
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
      setStatusModal({
        visible: true,
        type: 'info',
        title: 'Select a rating',
        message: 'Please tap a star to rate your renter.',
      });
      return;
    }
    if (!clientId || !bookingId) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Rating unavailable',
        message: 'Booking or client information is missing. Please refresh and try again.',
      });
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
            setClientRatingSummary({ average: refetch.average ?? 0, count: refetch.count ?? 0 });
          }
        }
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Thanks!',
          message: `You rated ${booking?.renter?.name || 'the renter'} ${rating}★.`,
        });
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Rating failed',
          message: result.error || 'Could not submit rating. Try again.',
        });
      }
    } catch (e) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e?.message || 'Could not submit rating.',
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0';
    // Handle string amounts like "KSh 0" or "KSh 14,000"
    if (typeof amount === 'string') {
      // Extract numbers from string (remove "KSh" and commas)
      const numStr = amount.replace(/[^\d]/g, '');
      const num = parseInt(numStr, 10);
      return isNaN(num) ? '0' : num.toLocaleString();
    }
    return amount.toLocaleString();
  };

  // Fallbacks/mocks for price & commission when API does not provide them
  const totalPriceForDisplay = detailBooking?.total_price ?? totalPaid ?? 0;
  const commissionRaw =
    detailBooking?.commission_amount ??
    booking.commission ??
    Math.round((totalPriceForDisplay || 0) * 0.15);
  const payoutForDisplay =
    payout || Math.max((totalPriceForDisplay || 0) - (commissionRaw || 0), 0);

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
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.backButton} />
      </View>

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
                    {
                      backgroundColor: getStatusColor(
                        detailBooking?.status || routeBooking.status || 'completed'
                      ) + '1A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: getStatusColor(
                          detailBooking?.status || routeBooking.status || 'completed'
                        ),
                      },
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
                  source={typeof booking.vehicleImage === 'string' 
                    ? { uri: booking.vehicleImage } 
                    : booking.vehicleImage} 
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
                    <Text style={styles.carStatText}>
                      {(booking.carRating ?? 4.8).toFixed(1)} rating
                    </Text>
                  </View>
                  <View style={styles.carStatItem}>
                    <Ionicons name="car-sport-outline" size={14} color={COLORS.subtle} />
                    <Text style={styles.carStatText}>
                      {(booking.carTrips ?? 12)} trips
                    </Text>
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
              onPress={() => {
                lightHaptic();
                setRateOpen(true);
              }}
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
              <Text style={styles.renterDetailValue} numberOfLines={1}>
                {booking?.renter?.email || 'Not provided'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.renterDetailRow}>
              <Text style={styles.renterDetailLabel}>Phone</Text>
              <Text style={styles.renterDetailValue} numberOfLines={1}>
                {booking?.renter?.phone || 'Not provided'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.renterDetailRow}>
              <Text style={styles.renterDetailLabel}>ID Number</Text>
              <Text style={styles.renterDetailValue} numberOfLines={1}>
                {booking?.renter?.idNumber || 'Not provided'}
              </Text>
            </View>
          </View>
        </View>

            {/* Price & payout */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Price & payout</Text>

              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Daily rate</Text>
                <Text style={styles.rowValueMuted}>
                  KSh {formatCurrency(detailBooking?.daily_rate ?? routeBooking.dailyRate ?? 3500)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Base price</Text>
                <Text style={styles.rowValueMuted}>
                  KSh {formatCurrency(detailBooking?.base_price ?? routeBooking.base_price ?? 7000)}
                </Text>
              </View>

              {detailBooking?.damage_waiver_enabled && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowLabel}>Damage waiver</Text>
                    <Text style={styles.rowValue}>
                      KSh {formatCurrency(detailBooking?.damage_waiver_fee ?? 500)}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <Text style={[styles.rowLabel, styles.rowStrong]}>Total paid</Text>
                <Text style={[styles.rowValueOrange, styles.rowStrong]}>
                  KSh {formatCurrency(totalPriceForDisplay || 7500)}
                </Text>
              </View>

              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Platform commission</Text>
                <Text style={styles.rowValueRed}>KSh {formatCurrency(commissionRaw || 1125)}</Text>
              </View>

              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>Your payout</Text>
                <Text style={styles.rowValueGreen}>KSh {formatCurrency(payoutForDisplay || 6375)}</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.receiptLink}
                onPress={async () => {
                  if (!bookingId || isDownloadingReceipt) return;
                  setIsDownloadingReceipt(true);
                  const result = await downloadBookingReceipt(bookingId);
                  setIsDownloadingReceipt(false);
                  if (!result.success) {
                    Alert.alert('Receipt', result.error || 'Could not download receipt.');
                  }
                }}
                activeOpacity={0.7}
                disabled={isDownloadingReceipt}
              >
                <Ionicons name="document-text-outline" size={18} color={COLORS.brand} />
                <Text style={styles.receiptLinkText}>
                  {isDownloadingReceipt ? 'Opening…' : 'View receipt'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.brand} />
              </TouchableOpacity>
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
                  onPress={() => {
                    lightHaptic();
                    setRateOpen(false);
                  }}
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
                      onPress={() => {
                        lightHaptic();
                        setRating(n);
                      }}
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
                  onPress={() => {
                    lightHaptic();
                    setRateOpen(false);
                  }}
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
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  detailLabel: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
  },
  detailValue: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.button,
  },
  rateButtonText: {
    ...TYPE.caption,
    color: '#ffffff',
  },
  renterTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  renterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.bg,
  },
  renterAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renterName: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
  },
  renterTopDetails: {
    flex: 1,
  },
  renterBio: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginTop: 4,
    lineHeight: 18,
  },
  renterBioMuted: {
    ...TYPE.body,
    fontSize: 13,
    color: 'rgba(60, 60, 67, 0.4)',
    marginTop: 4,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  renterStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statPillText: {
    ...TYPE.caption,
    color: COLORS.text,
  },
  renterDetailsWrap: {
    marginTop: 12,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  renterDetailRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  renterDetailLabel: {
    ...TYPE.caption,
    color: COLORS.subtle,
    fontSize: 12,
  },
  renterDetailValue: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  amountLabel: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  amountValue: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },
  tripDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.text,
    marginVertical: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  rowValue: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  rowStrong: {
    fontFamily: 'Nunito-Bold',
  },
  rowValueMuted: {
    ...TYPE.bodyStrong,
    color: COLORS.subtle,
  },
  rowValueRed: {
    ...TYPE.bodyStrong,
    color: '#FF3B30',
  },
  rowValueGreen: {
    ...TYPE.bodyStrong,
    color: '#34C759',
  },
  rowValueOrange: {
    ...TYPE.bodyStrong,
    color: '#FF9500',
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
  },
  receiptLinkText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.brand,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCenter: {
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  modalTitle: {
    ...TYPE.section,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  modalSub: {
    ...TYPE.caption,
    color: COLORS.subtle,
    marginBottom: SPACING.m,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  noteWrap: {
    marginBottom: SPACING.l,
  },
  noteLabel: {
    ...TYPE.micro,
    color: COLORS.subtle,
    marginBottom: 8,
  },
  noteInput: {
    minHeight: 88,
    borderRadius: RADIUS.card,
    padding: 12,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondary: {
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  modalSecondaryText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.text,
  },
  modalPrimary: {
    backgroundColor: COLORS.text,
  },
  modalPrimaryText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#ffffff',
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdRow: {
    flex: 1,
  },
  bookingIdLabel: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
    marginBottom: 4,
  },
  bookingIdValue: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
});
