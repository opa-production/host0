import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getBookingDetails, confirmPickup, confirmDropoff } from '../services/bookingService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ActiveBookingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [isConfirmingPickup, setIsConfirmingPickup] = useState(false);
  const [isConfirmingDropoff, setIsConfirmingDropoff] = useState(false);
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
    switch (statusLower) {
      case 'confirmed':
      case 'active':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'pending':
      case 'upcoming':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

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
        
        // Map API response to UI format
        const mappedBooking = {
          id: bookingData.id,
          bookingId: bookingData.booking_id,
          vehicleName: bookingData.car_name || 'Unknown Car',
          vehicleModel: bookingData.car_model || '',
          vehicleYear: bookingData.car_year,
          vehicleMake: bookingData.car_make || '',
          vehicleImages: bookingData.car_image_urls || [],
          plate: '', // Not in API response
          clientId: bookingData.client_id,
          renter: {
            name: bookingData.client_name || 'Client',
            email: bookingData.client_email,
            phone: bookingData.client_mobile_number,
            avatar: null, // Not in API response
            rating: null,
            trips: null,
          },
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
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
          <Text style={styles.headerTitle}>Booking</Text>
          <View style={styles.backButton} />
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
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
          <Text style={styles.headerTitle}>Booking</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.subtle} />
          <Text style={styles.emptyTitle}>No booking found</Text>
          <Text style={styles.emptySubtitle}>Booking details will appear here</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header with Back Button */}
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
        <Text style={styles.headerTitle}>Booking</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Car Cover Image */}
        <View style={styles.carouselContainer}>
          {booking?.vehicleImages && booking.vehicleImages.length > 0 ? (
            <Image 
              source={{ uri: booking.vehicleImages[0] }} 
              style={styles.carouselImage} 
              resizeMode="cover"
              defaultSource={require('../assets/images/logo.png')}
            />
          ) : (
            <View style={styles.carouselImagePlaceholder}>
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

        {/* Confirm Pickup/Dropoff Actions */}
        {shouldShowConfirmPickup() && (
          <View style={styles.confirmActionCard}>
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
                  <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {shouldShowConfirmDropoff() && (
          <View style={styles.confirmActionCard}>
            <TouchableOpacity
              style={[
                styles.confirmButton, 
                styles.confirmDropoffButton,
                !canConfirmDropoff() && styles.confirmButtonDisabled
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
                    size={24} 
                    color={canConfirmDropoff() ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"} 
                  />
                  <Text style={[
                    styles.confirmButtonText,
                    !canConfirmDropoff() && styles.confirmButtonTextDisabled
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
              {booking?.vehicleName || ''} {booking?.vehicleModel ? `• ${booking.vehicleModel}` : ''}
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

        {/* Pickup Details */}
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
          {booking?.pickupTime && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{booking.pickupTime}</Text>
              </View>
            </>
          )}
        </View>

        {/* Dropoff Details */}
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
          {booking?.returnTime && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{booking.returnTime}</Text>
              </View>
            </>
          )}
        </View>

        {/* Renter profile */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Renter</Text>
          <View style={styles.renterRow}>
            {booking?.renter?.avatar ? (
              <Image source={{ uri: booking.renter.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={COLORS.subtle} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.renterName}>{booking?.renter?.name || ''}</Text>
              {booking?.renter?.email && (
                <Text style={styles.renterEmail}>{booking.renter.email}</Text>
              )}
              {booking?.renter?.phone && (
                <Text style={styles.renterPhone}>{booking.renter.phone}</Text>
              )}
              {booking?.renter?.rating && (
                <View style={styles.renterRating}>
                  <Text style={styles.ratingText}>⭐</Text>
                  <Text style={styles.ratingValue}>{booking.renter.rating}</Text>
                  {booking?.renter?.trips && (
                    <Text style={styles.tripsText}>• {booking.renter.trips} trips</Text>
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                lightHaptic();
                navigation.navigate('Chat', {
                  clientId: booking.clientId,
                  clientName: booking.renter?.name || 'Client',
                });
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
            {booking?.renter?.phone && (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => {
                  lightHaptic();
                  // TODO: Implement phone call
                }}
              >
                <Ionicons name="call-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
            )}
          </View>
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
            <Text style={styles.value}>{booking?.price?.total || ''}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Platform commission</Text>
            <Text style={[styles.value, styles.commissionValue]}>- {booking?.price?.commission || formatCurrency(0)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={[styles.label, styles.bold]}>Your payout</Text>
            <Text style={[styles.value, styles.bold]}>{booking?.price?.payout || ''}</Text>
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
              navigation.navigate('ReportIssue', { bookingRef: `${booking?.vehicleName || ''} • ${booking?.bookingId || ''}` });
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
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: 280,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  carouselImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
  confirmActionCard: {
    marginHorizontal: SPACING.l,
    marginBottom: 16,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: SPACING.l,
    borderRadius: 12,
    gap: 10,
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
