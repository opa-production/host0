import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getBookingDetails, confirmPickup, confirmDropoff, getClientDisplayName, getBookingStatusDisplayText } from '../services/bookingService';
import { getHostClientProfile } from '../services/clientProfileService';
import { fetchCarImagesFromSupabase } from '../services/carService';
import { fetchClientAvatarFromSupabase } from '../services/mediaService';
import { getUserId } from '../utils/userStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ActiveBookingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [isConfirmingPickup, setIsConfirmingPickup] = useState(false);
  const [isConfirmingDropoff, setIsConfirmingDropoff] = useState(false);
  const [clientAvatar, setClientAvatar] = useState(null);
  const bookingId = route?.params?.bookingId || route?.params?.booking_id;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `KSh ${numAmount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed' || statusLower === 'dropped_off') return '#34C759'; // Completed (car dropped off)
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

  const calculateCountdown = (startDate, endDate, status) => {
    if (!startDate || !endDate) return null;
    
    try {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const statusLower = status?.toLowerCase() || '';
      let targetDate;
      let label;
      
      // Determine target date based on status
      if (statusLower === 'confirmed' || statusLower === 'pending' || statusLower === 'upcoming') {
        // Countdown to pickup
        targetDate = start;
        label = 'Pickup in';
      } else if (statusLower === 'active') {
        // Countdown to return
        targetDate = end;
        label = 'Return in';
      } else {
        // Completed or cancelled - no countdown
        return null;
      }
      
      const diffMs = targetDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        return {
          label: statusLower === 'active' ? 'Return overdue' : 'Pickup overdue',
          days: 0,
          hours: 0,
          minutes: 0,
          isOverdue: true,
        };
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        label,
        days,
        hours,
        minutes,
        isOverdue: false,
      };
    } catch (e) {
      console.error('Error calculating countdown:', e);
      return null;
    }
  };

  useEffect(() => {
    if (booking?.startDateRaw && booking?.endDateRaw && booking?.status) {
      const countdownData = calculateCountdown(
        booking.startDateRaw,
        booking.endDateRaw,
        booking.status
      );
      setCountdown(countdownData);
      
      // Update countdown every minute (this also triggers re-render for dropoff button state)
      const interval = setInterval(() => {
        const updated = calculateCountdown(
          booking.startDateRaw,
          booking.endDateRaw,
          booking.status
        );
        setCountdown(updated);
      }, 60000); // Update every minute
      
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [booking?.startDateRaw, booking?.endDateRaw, booking?.status]);

  const loadBookingDetails = async () => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getBookingDetails(bookingId);
      if (result.success && result.booking) {
        const bookingData = result.booking;
        
        // Fetch car images from Supabase if not provided by API
        let vehicleImages = bookingData.car_image_urls || [];
        console.log('🚗 [ActiveBooking] Initial vehicleImages from API:', vehicleImages.length);
        console.log('🚗 [ActiveBooking] car_id:', bookingData.car_id);
        
        if (vehicleImages.length === 0 && bookingData.car_id) {
          const userId = await getUserId();
          console.log('🚗 [ActiveBooking] Fetching from Supabase, userId:', userId);
          if (userId) {
            const imageResult = await fetchCarImagesFromSupabase(bookingData.car_id, userId);
            console.log('🚗 [ActiveBooking] Supabase image result:', imageResult.images?.length || 0);
            if (imageResult.images && imageResult.images.length > 0) {
              vehicleImages = imageResult.images;
              console.log('🚗 [ActiveBooking] Using Supabase images:', vehicleImages.length);
            }
          }
        }
        
        console.log('🚗 [ActiveBooking] Final vehicleImages:', vehicleImages.length, vehicleImages[0]);
        
        // Fetch client avatar from API response or Supabase
        let clientAvatarUrl = bookingData.client_avatar_url 
          || bookingData.client_avatar 
          || bookingData.client?.avatar_url 
          || bookingData.client?.profile_image_uri
          || null;
        
        // If no avatar from API, fetch from Supabase
        if (!clientAvatarUrl && bookingData.client_id) {
          console.log('👤 [ActiveBooking] Fetching client avatar from Supabase for client_id:', bookingData.client_id);
          clientAvatarUrl = await fetchClientAvatarFromSupabase(bookingData.client_id);
          console.log('👤 [ActiveBooking] Client avatar result:', clientAvatarUrl ? 'Found' : 'Not found');
        }

        // Fetch client profile (trips_count, average_rating, full_name, avatar_url, email) from API
        let clientProfile = null;
        if (bookingData.client_id) {
          const profileResult = await getHostClientProfile(bookingData.client_id);
          if (profileResult.success && profileResult.profile) {
            clientProfile = profileResult.profile;
            if (clientProfile.avatar_url) clientAvatarUrl = clientProfile.avatar_url;
          }
        }

        setClientAvatar(clientAvatarUrl);

        const baseRenter = {
          name: getClientDisplayName(bookingData),
          email: bookingData.client_email || '',
          phone: bookingData.client_mobile_number || bookingData.client_phone || '',
          avatar: clientAvatarUrl,
          bio: bookingData.client_bio || '',
          rating: bookingData.client_rating || bookingData.client_avg_rating || null,
          trips: bookingData.client_trips_count || bookingData.client_total_trips || null,
        };
        if (clientProfile) {
          baseRenter.name = clientProfile.full_name || baseRenter.name;
          baseRenter.email = clientProfile.email || baseRenter.email;
          baseRenter.avatar = clientProfile.avatar_url || baseRenter.avatar;
          baseRenter.trips = clientProfile.trips_count ?? baseRenter.trips;
          baseRenter.rating = clientProfile.average_rating ?? baseRenter.rating;
        }

        // Map API response to UI format with all client details
        const mappedBooking = {
          id: bookingData.id,
          bookingId: bookingData.booking_id,
          carId: bookingData.car_id,
          vehicleName: bookingData.car_name || 'Unknown Car',
          vehicleModel: bookingData.car_model || '',
          vehicleYear: bookingData.car_year,
          vehicleMake: bookingData.car_make || '',
          vehicleImages: vehicleImages,
          plate: bookingData.car_plate || bookingData.plate || '',
          clientId: bookingData.client_id,
          renter: baseRenter,
          startDate: formatDate(bookingData.start_date),
          endDate: formatDate(bookingData.end_date),
          startDateRaw: bookingData.start_date,
          endDateRaw: bookingData.end_date,
          pickupTime: bookingData.pickup_time || '',
          returnTime: bookingData.return_time || '',
          pickupLocation: Array.isArray(bookingData.pickup_location) 
            ? bookingData.pickup_location 
            : bookingData.pickup_location ? [bookingData.pickup_location] : [],
          returnLocation: Array.isArray(bookingData.return_location) 
            ? bookingData.return_location 
            : bookingData.return_location ? [bookingData.return_location] : [],
          dropoffSameAsPickup: bookingData.dropoff_same_as_pickup || false,
          price: {
            days: bookingData.rental_days || 0,
            dailyRate: bookingData.daily_rate || 0,
            basePrice: bookingData.base_price || 0,
            total: formatCurrency(bookingData.total_price),
            commission: formatCurrency(0), // Not in API response
            payout: formatCurrency(bookingData.total_price), // Assuming total is payout for now
          },
          status: bookingData.status,
          specialRequirements: bookingData.special_requirements,
          damageWaiverEnabled: bookingData.damage_waiver_enabled,
          damageWaiverFee: formatCurrency(bookingData.damage_waiver_fee || 0),
          driveType: bookingData.drive_type,
          checkInPreference: bookingData.check_in_preference,
          statusUpdatedAt: bookingData.status_updated_at,
          cancellationReason: bookingData.cancellation_reason,
          createdAt: bookingData.created_at,
        };
        
        setBooking(mappedBooking);
      } else {
        setBooking(null);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      if (bookingId) {
        loadBookingDetails();
      }
    }, [bookingId])
  );

  const handleConfirmPickup = async () => {
    if (!bookingId || isConfirmingPickup) return;
    
    lightHaptic();
    setIsConfirmingPickup(true);
    
    try {
      const result = await confirmPickup(bookingId);
      if (result.success) {
        // Reload booking details to get updated status
        await loadBookingDetails();
      } else {
        // Show error (you might want to add an Alert here)
        console.error('Failed to confirm pickup:', result.error);
      }
    } catch (error) {
      console.error('Error confirming pickup:', error);
    } finally {
      setIsConfirmingPickup(false);
    }
  };

  const handleConfirmDropoff = async () => {
    if (!bookingId || isConfirmingDropoff) return;
    
    lightHaptic();
    setIsConfirmingDropoff(true);
    
    try {
      const result = await confirmDropoff(bookingId);
      if (result.success) {
        // Reload booking details to get updated status
        await loadBookingDetails();
      } else {
        // Show error (you might want to add an Alert here)
        console.error('Failed to confirm dropoff:', result.error);
      }
    } catch (error) {
      console.error('Error confirming dropoff:', error);
    } finally {
      setIsConfirmingDropoff(false);
    }
  };

  // Check if dropoff time has been reached
  const isDropoffTimeReached = () => {
    if (!booking?.endDateRaw) return false;
    
    try {
      const now = new Date();
      const endDate = new Date(booking.endDateRaw);
      
      // If returnTime is provided, combine it with the end date
      if (booking.returnTime) {
        // Parse returnTime (format: "HH:MM" or "HH:MM:SS")
        const timeParts = booking.returnTime.split(':');
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);
          endDate.setHours(hours, minutes, 0, 0);
        }
      } else {
        // If no specific time, use end of day (23:59:59)
        endDate.setHours(23, 59, 59, 999);
      }
      
      // Check if current time is >= dropoff time
      return now >= endDate;
    } catch (e) {
      console.error('Error checking dropoff time:', e);
      return false;
    }
  };

  // Determine if pickup/dropoff buttons should be shown
  const shouldShowConfirmPickup = () => {
    const status = booking?.status?.toLowerCase() || '';
    return (status === 'confirmed' || status === 'pending' || status === 'upcoming') && !isConfirmingPickup;
  };

  const shouldShowConfirmDropoff = () => {
    const status = booking?.status?.toLowerCase() || '';
    return status === 'active' && !isConfirmingDropoff;
  };

  const canConfirmDropoff = () => {
    return shouldShowConfirmDropoff() && isDropoffTimeReached();
  };


  // Show loading or empty state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.carouselContainer, { height: 300 + insets.top }]}>
          <TouchableOpacity
            style={[styles.stickyBackButton, { top: insets.top + 10 }]}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </View>
          </TouchableOpacity>
          <View style={[styles.carouselImagePlaceholder, { height: 300 + insets.top }]}>
            <ActivityIndicator size="large" color={COLORS.subtle} />
          </View>
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.text} />
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.carouselContainer, { height: 300 + insets.top }]}>
          <TouchableOpacity
            style={[styles.stickyBackButton, { top: insets.top + 10 }]}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </View>
          </TouchableOpacity>
          <View style={[styles.carouselImagePlaceholder, { height: 300 + insets.top }]}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.subtle} />
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No booking found</Text>
          <Text style={styles.emptySubtitle}>Booking details will appear here</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Car Cover Image - Full Screen Top */}
        <View style={[styles.carouselContainer, { height: 300 + insets.top }]}>
          {/* Sticky Back Button Overlay */}
          <TouchableOpacity
            style={[styles.stickyBackButton, { top: insets.top + 10 }]}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </View>
          </TouchableOpacity>
          {booking?.vehicleImages && booking.vehicleImages.length > 0 ? (
            <Image 
              source={{ uri: booking.vehicleImages[0] }} 
              style={[styles.carouselImage, { height: 300 + insets.top }]} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.carouselImagePlaceholder, { height: 300 + insets.top }]}>
              <Ionicons name="car-outline" size={48} color={COLORS.subtle} />
            </View>
          )}
        </View>
        {/* Countdown Section */}
        {countdown && (
          <View style={styles.countdownCard}>
            <View style={styles.countdownContent}>
              <Text style={styles.countdownLabel}>{countdown.label}</Text>
              {countdown.isOverdue ? (
                <Text style={styles.countdownOverdue}>{countdown.label}</Text>
              ) : (
                <View style={styles.countdownTime}>
                  {countdown.days > 0 && (
                    <View style={styles.countdownUnit}>
                      <Text style={styles.countdownValue}>{countdown.days}</Text>
                      <Text style={styles.countdownUnitLabel}>d</Text>
                    </View>
                  )}
                  <View style={styles.countdownUnit}>
                    <Text style={styles.countdownValue}>{countdown.hours}</Text>
                    <Text style={styles.countdownUnitLabel}>h</Text>
                  </View>
                  <View style={styles.countdownUnit}>
                    <Text style={styles.countdownValue}>{countdown.minutes}</Text>
                    <Text style={styles.countdownUnitLabel}>m</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Booking ID & Status */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <View style={styles.bookingIdRow}>
              <Text style={styles.bookingIdLabel}>Booking ID</Text>
              <Text style={styles.bookingIdValue}>{booking?.bookingId || `#${booking?.id}`}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking?.status) + '1A' }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(booking?.status) }]}>
                {getStatusText(booking?.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <View style={styles.vehicleNameRow}>
            <Text style={styles.vehicleName}>
              {booking?.vehicleName || ''}{booking?.vehicleModel ? ` • ${booking.vehicleModel}` : ''}
            </Text>
            {booking?.vehicleYear && (
              <Text style={styles.vehicleYear}>{booking.vehicleYear}</Text>
            )}
          </View>
          {booking?.vehicleMake && (
            <Text style={styles.vehicleMake}>{booking.vehicleMake}</Text>
          )}
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rental Duration</Text>
            <Text style={styles.detailValue}>{booking?.price?.days || 0} days</Text>
          </View>
          {booking?.price?.dailyRate > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Daily Rate</Text>
                <Text style={styles.detailValue}>{formatCurrency(booking.price.dailyRate)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Pickup — details + Confirm Pickup in one card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pickup</Text>
          {booking?.pickupLocation && booking.pickupLocation.length > 0 && (
            <View style={styles.locationContent}>
              <Text style={styles.locationText}>
                {Array.isArray(booking.pickupLocation)
                  ? booking.pickupLocation.join(', ')
                  : booking.pickupLocation}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{booking?.startDate || ''}</Text>
          </View>
          {booking?.pickupTime ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{booking.pickupTime}</Text>
              </View>
            </>
          ) : null}
          {shouldShowConfirmPickup() && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmPickupButton]}
                onPress={handleConfirmPickup}
                disabled={isConfirmingPickup}
                activeOpacity={0.8}
              >
                {isConfirmingPickup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Dropoff — details + Confirm Dropoff in one card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dropoff</Text>
          {booking?.dropoffSameAsPickup ? (
            <Text style={styles.sameLocationNote}>Same location as pickup</Text>
          ) : booking?.returnLocation && booking.returnLocation.length > 0 ? (
            <View style={styles.locationContent}>
              <Text style={styles.locationText}>
                {Array.isArray(booking.returnLocation)
                  ? booking.returnLocation.join(', ')
                  : booking.returnLocation}
              </Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{booking?.endDate || ''}</Text>
          </View>
          {booking?.returnTime ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{booking.returnTime}</Text>
              </View>
            </>
          ) : null}
          {shouldShowConfirmDropoff() && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.confirmDropoffButton,
                  !canConfirmDropoff() && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirmDropoff}
                disabled={isConfirmingDropoff || !canConfirmDropoff()}
                activeOpacity={canConfirmDropoff() ? 0.8 : 1}
              >
                {isConfirmingDropoff ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={22}
                      color={canConfirmDropoff() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
                    />
                    <Text style={[
                      styles.confirmButtonText,
                      !canConfirmDropoff() && styles.confirmButtonTextDisabled,
                    ]}>
                      Confirm Dropoff
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {!canConfirmDropoff() && (
                <Text style={styles.disabledHint}>
                  Dropoff can only be confirmed after the scheduled dropoff time
                </Text>
              )}
            </>
          )}
        </View>

        {/* Renter profile - styled like host profile */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Meet Your Client</Text>
          
          {/* Profile Picture and Statistics Row */}
          <View style={styles.clientProfileRow}>
            {/* Profile Picture */}
            {clientAvatar || booking?.renter?.avatar ? (
              <Image 
                source={{ uri: clientAvatar || booking?.renter?.avatar }} 
                style={styles.clientAvatar} 
              />
            ) : (
              <View style={styles.clientAvatarPlaceholder}>
                <Text style={styles.clientAvatarInitials}>
                  {booking?.renter?.name 
                    ? booking.renter.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : '?'}
                </Text>
              </View>
            )}
            
            {/* Statistics */}
            <View style={styles.clientStats}>
              {booking?.renter?.rating !== null && booking?.renter?.rating !== undefined ? (
                <View style={styles.clientStatItem}>
                  <Text style={styles.clientStatValue}>{booking.renter.rating}</Text>
                  <Text style={styles.clientStatLabel}>⭐ Rating</Text>
                </View>
              ) : (
                <View style={styles.clientStatItem}>
                  <Text style={styles.clientStatValue}>0</Text>
                  <Text style={styles.clientStatLabel}>⭐ Rating</Text>
                </View>
              )}
              {booking?.renter?.trips !== null && booking?.renter?.trips !== undefined ? (
                <View style={[styles.clientStatItem, styles.clientStatDivider]}>
                  <Text style={styles.clientStatValue}>{booking.renter.trips}</Text>
                  <Text style={styles.clientStatLabel}>Trips</Text>
                </View>
              ) : (
                <View style={[styles.clientStatItem, styles.clientStatDivider]}>
                  <Text style={styles.clientStatValue}>0</Text>
                  <Text style={styles.clientStatLabel}>Trips</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Client Name */}
          <Text style={styles.clientName}>{booking?.renter?.name || 'Client'}</Text>
          
          {/* Client Details */}
          {(booking?.renter?.email || booking?.renter?.phone || booking?.renter?.bio) && (
            <>
              <Text style={styles.clientDetailsTitle}>Client details</Text>
              {booking?.renter?.email && (
                <Text style={styles.clientDetailText}>{booking.renter.email}</Text>
              )}
              {booking?.renter?.phone && (
                <Text style={styles.clientDetailText}>{booking.renter.phone}</Text>
              )}
              {booking?.renter?.bio && (
                <Text style={styles.clientDetailText}>{booking.renter.bio}</Text>
              )}
            </>
          )}
          
          {/* Message Client Button */}
          <TouchableOpacity
            style={styles.messageClientButton}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Chat', {
                clientId: booking.clientId,
                clientName: booking.renter?.name || 'Client',
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.messageClientButtonText}>Message Client</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Details */}
        {(booking?.driveType || booking?.checkInPreference || booking?.specialRequirements) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            {booking?.driveType && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Drive Type</Text>
                  <Text style={styles.detailValue}>{booking.driveType}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            {booking?.checkInPreference && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Check-in Preference</Text>
                  <Text style={styles.detailValue}>{booking.checkInPreference}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}
            {booking?.specialRequirements && (
              <View style={styles.specialRequirementsContainer}>
                <Text style={styles.detailLabel}>Special Requirements</Text>
                <Text style={styles.specialRequirementsText}>{booking.specialRequirements}</Text>
              </View>
            )}
          </View>
        )}

        {/* Payment breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>
          {booking?.price?.basePrice > 0 && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Base Price ({booking?.price?.days || 0} days)</Text>
                <Text style={styles.value}>{formatCurrency(booking.price.basePrice)}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}
          {booking?.damageWaiverEnabled && booking?.damageWaiverFee && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Damage Waiver</Text>
                <Text style={styles.value}>{booking.damageWaiverFee}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total paid</Text>
            <Text style={styles.value}>{booking?.price?.total || formatCurrency(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Platform commission</Text>
            <Text style={[styles.value, styles.commissionValue]}>- {booking?.price?.commission || formatCurrency(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={[styles.label, styles.bold]}>Your payout</Text>
            <Text style={[styles.value, styles.bold]}>{booking?.price?.payout || formatCurrency(0)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          {booking?.renter?.phone && (
            <>
              <TouchableOpacity
                style={styles.actionLink}
                activeOpacity={0.7}
                onPress={() => {
                  lightHaptic();
                  // TODO: Implement phone call
                }}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="call-outline" size={20} color={COLORS.text} />
                  <Text style={styles.actionLinkText}>Call Client</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
              </TouchableOpacity>
              <View style={styles.actionDivider} />
            </>
          )}
          <TouchableOpacity
            style={styles.actionLink}
            activeOpacity={0.7}
            onPress={() => {
              lightHaptic();
              navigation.navigate('Chat', {
                clientId: booking.clientId,
                clientName: booking.renter?.name || 'Client',
              });
            }}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.text} />
              <Text style={styles.actionLinkText}>Message Client</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
          </TouchableOpacity>
          {(booking?.pickupLocation?.length > 0 || booking?.returnLocation?.length > 0) && (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity
                style={styles.actionLink}
                activeOpacity={0.7}
                onPress={() => {
                  lightHaptic();
                  // TODO: Open map with location
                }}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="map-outline" size={20} color={COLORS.text} />
                  <Text style={styles.actionLinkText}>View on Map</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
              </TouchableOpacity>
            </>
          )}
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionLink}
            activeOpacity={0.7}
            onPress={() => {
              lightHaptic();
              navigation.navigate('ReportIssue', { bookingRef: `${booking?.vehicleName || 'Booking'} • ${booking?.bookingId || booking?.id || ''}` });
            }}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="flag-outline" size={20} color={COLORS.text} />
              <Text style={styles.actionLinkText}>Report Issue</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  floatingBackButton: {
    position: 'absolute',
    left: SPACING.l,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  content: {
    paddingTop: 0,
    paddingBottom: 110,
    flexGrow: 1,
  },
  stickyBackButton: {
    position: 'absolute',
    left: SPACING.l,
    zIndex: 10,
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 0,
  },
  carouselImage: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  carouselImagePlaceholder: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownCard: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    padding: SPACING.m,
    marginHorizontal: SPACING.l,
    marginBottom: 16,
    marginTop: 16,
  },
  countdownContent: {
    alignItems: 'center',
  },
  countdownLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontFamily: 'Nunito-Regular',
  },
  countdownTime: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  countdownUnit: {
    alignItems: 'center',
  },
  countdownValue: {
    ...TYPE.largeTitle,
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Nunito-Bold',
    lineHeight: 38,
  },
  countdownUnitLabel: {
    ...TYPE.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontFamily: 'Nunito-Regular',
  },
  countdownOverdue: {
    ...TYPE.title,
    fontSize: 18,
    color: '#FF3B30',
    fontFamily: 'Nunito-Bold',
  },
  vehicleNameRow: {
    marginBottom: 12,
  },
  vehicleName: {
    ...TYPE.title,
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 6,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plateText: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: SPACING.l,
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPE.title,
    fontSize: 16,
    color: COLORS.text,
  },
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ededed',
  },
  renterName: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 4,
  },
  renterBio: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginBottom: 6,
    lineHeight: 18,
  },
  renterEmail: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginBottom: 2,
  },
  renterPhone: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginBottom: 4,
  },
  renterRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
  },
  ratingValue: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.text,
  },
  tripsText: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Client Profile Styles (matching host profile style)
  clientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  clientAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
  },
  clientAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarInitials: {
    ...TYPE.title,
    fontSize: 24,
    color: COLORS.text,
    fontFamily: 'Nunito-Bold',
  },
  clientStats: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  clientStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  clientStatDivider: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderStrong,
  },
  clientStatValue: {
    ...TYPE.largeTitle,
    fontSize: 24,
    color: COLORS.text,
    fontFamily: 'Nunito-Bold',
    marginBottom: 4,
  },
  clientStatLabel: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
    fontFamily: 'Nunito-Regular',
  },
  clientName: {
    ...TYPE.title,
    fontSize: 20,
    color: COLORS.text,
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
  },
  clientDetailsTitle: {
    ...TYPE.title,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 8,
  },
  clientDetailText: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    fontFamily: 'Nunito-Regular',
    marginBottom: 4,
  },
  messageClientButton: {
    backgroundColor: COLORS.text,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  messageClientButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Nunito-SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
  },
  detailValue: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.text,
    marginVertical: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  value: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
  },
  commissionValue: {
    color: COLORS.danger,
  },
  bold: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
    marginHorizontal: SPACING.l,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: SPACING.m,
  },
  actionLinkText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.text,
    marginHorizontal: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.l,
  },
  emptyTitle: {
    ...TYPE.section,
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
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
  vehicleYear: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    marginTop: 4,
  },
  vehicleMake: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginTop: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationContent: {
    marginBottom: 8,
  },
  locationText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  sameLocationBadge: {
    backgroundColor: '#34C7591A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  sameLocationText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#34C759',
  },
  sameLocationNote: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    marginTop: 8,
    marginBottom: 8,
    fontFamily: 'Nunito-Regular',
  },
  specialRequirementsContainer: {
    marginTop: 8,
  },
  specialRequirementsText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
    lineHeight: 20,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.l,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmPickupButton: {
    backgroundColor: '#007AFF',
  },
  confirmDropoffButton: {
    backgroundColor: '#34C759',
  },
  confirmButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Nunito-SemiBold',
  },
  confirmButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.6,
  },
  confirmButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  disabledHint: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Nunito-Regular',
  },
});
