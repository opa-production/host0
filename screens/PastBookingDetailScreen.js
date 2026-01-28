import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { fetchCarImagesFromSupabase } from '../services/carService';
import { getUserId } from '../utils/userStorage';

export default function PastBookingDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [vehicleImage, setVehicleImage] = useState(null);

  const routeBooking = route?.params?.booking || {};

  // Fetch car image if not provided
  useEffect(() => {
    const loadCarImage = async () => {
      // If vehicleImage is already provided and is a URL string, use it
      if (routeBooking.vehicleImage && typeof routeBooking.vehicleImage === 'string') {
        setVehicleImage(routeBooking.vehicleImage);
        return;
      }

      // Otherwise, try to fetch from Supabase
      if (routeBooking.carId) {
        const userId = await getUserId();
        if (userId) {
          const imageResult = await fetchCarImagesFromSupabase(routeBooking.carId, userId);
          if (imageResult.coverPhoto) {
            setVehicleImage(imageResult.coverPhoto);
          }
        }
      }
    };

    loadCarImage();
  }, [routeBooking.vehicleImage, routeBooking.carId]);
  
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
  
  const booking = {
    vehicleName: routeBooking.vehicleName || '',
    vehicleImage: vehicleImage || routeBooking.vehicleImage || null,
    plate: routeBooking.plate || '',
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
    renter: {
      name: routeBooking.renter?.name || '',
      bio: routeBooking.renter?.bio || '',
      rating: routeBooking.renter?.rating || 0,
      trips: routeBooking.renter?.trips || 0,
      avatar: routeBooking.renter?.avatar || null,
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

  const submitRating = () => {
    if (!rating) {
      Alert.alert('Select a rating', 'Please tap a star to rate your renter.');
      return;
    }

    lightHaptic();
    Alert.alert('Thanks!', `You rated ${booking?.renter?.name || 'the renter'} ${rating}★.`);
    setRateOpen(false);
    setRating(0);
    setNote('');
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
                <Text style={styles.heroTitle} numberOfLines={1}>{booking.vehicleName}</Text>
                {booking.location && <Text style={styles.heroSub}>{booking.location}</Text>}
                {booking.plate && (
                  <View style={styles.plateRow}>
                    <Ionicons name="car-sport-outline" size={14} color={COLORS.subtle} />
                    <Text style={styles.plateText}>{booking.plate}</Text>
                  </View>
                )}
              </View>
            </View>

        {/* Booking Dates */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking details</Text>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Start</Text>
              <Text style={styles.detailValue}>
                {booking.startDate || ''}{booking.startTime ? ` • ${booking.startTime}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>End</Text>
              <Text style={styles.detailValue}>
                {booking.endDate || ''}{booking.endTime ? ` • ${booking.endTime}` : ''}
              </Text>
            </View>
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

          <View style={styles.renterRow}>
            {booking?.renter?.avatar ? (
              <Image source={{ uri: booking.renter.avatar }} style={styles.renterAvatar} />
            ) : (
              <View style={styles.renterAvatarPlaceholder}>
                <Ionicons name="person" size={22} color={COLORS.subtle} />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.renterName} numberOfLines={1}>{booking?.renter?.name || 'Renter'}</Text>
              {booking?.renter?.bio && (
                <Text style={styles.renterBio} numberOfLines={2}>{booking.renter.bio}</Text>
              )}
              <View style={styles.renterMetaRow}>
                {booking?.renter?.rating ? (
                  <Text style={styles.renterMeta}>{booking.renter.rating}★</Text>
                ) : null}
                <Text style={styles.renterMeta}> · {booking?.renter?.trips ?? 0} trips</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payout */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payout</Text>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Your payout</Text>
            <Text style={styles.amountValue}>KSh {formatCurrency(booking.payout)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Total paid</Text>
            <Text style={styles.rowValue}>KSh {formatCurrency(booking.totalPaid)}</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.receiptLink}
            onPress={() => Alert.alert('Coming soon', 'Receipts will be available in a future update.')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={18} color={COLORS.brand} />
            <Text style={styles.receiptLinkText}>View receipt</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.brand} />
          </TouchableOpacity>
        </View>
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
                  style={[styles.modalButton, styles.modalPrimary]}
                  onPress={submitRating}
                  activeOpacity={0.9}
                >
                  <Text style={styles.modalPrimaryText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
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
  },
  heroSub: {
    ...TYPE.caption,
    marginTop: 2,
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
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
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  renterBio: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginTop: 4,
    lineHeight: 18,
  },
  renterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  renterMeta: {
    ...TYPE.caption,
    color: COLORS.subtle,
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
});
