import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function PastBookingDetailScreen({ navigation, route }) {
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  const booking = route?.params?.booking || {
    vehicleName: 'BMW M3',
    vehicleImage: require('../assets/images/bmw.jpg'),
    location: 'Nakuru, Kenya',
    startDate: '2023-12-10',
    endDate: '2023-12-15',
    status: 'Completed',
    payout: 'KSh 30,500',
    totalPaid: 'KSh 38,000',
    renter: {
      name: 'John Doe',
      rating: 4.9,
      trips: 12,
      avatar: null,
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Image source={booking.vehicleImage} style={styles.heroAvatar} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle} numberOfLines={1}>{booking.vehicleName}</Text>
            <Text style={styles.heroSub}>{booking.location}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.pill}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.subtle} />
                <Text style={styles.pillText}>{booking.startDate} – {booking.endDate}</Text>
              </View>
              <View style={[styles.pill, styles.pillOk]}>
                <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                <Text style={[styles.pillText, styles.pillOkText]}>{booking.status}</Text>
              </View>
            </View>
          </View>
        </View>

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
              <Text style={styles.renterMeta} numberOfLines={1}>
                {booking?.renter?.rating ? `${booking.renter.rating}★` : '—'} · {booking?.renter?.trips ?? 0} trips
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payout</Text>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Your payout</Text>
            <Text style={styles.amountValue}>{booking.payout}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Total paid</Text>
            <Text style={styles.rowValue}>{booking.totalPaid}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => Alert.alert('Coming soon', 'Receipts will be available in a future update.')}
          activeOpacity={0.9}
        >
          <Text style={styles.secondaryActionText}>View receipt</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} />
        </TouchableOpacity>
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
  content: {
    padding: SPACING.l,
    paddingTop: 90,
    paddingBottom: 110,
    gap: SPACING.m,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
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
  heroMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  pillText: {
    ...TYPE.caption,
    color: COLORS.text,
  },
  pillOk: {
    backgroundColor: '#EAF8EE',
    borderColor: '#D1EED8',
  },
  pillOkText: {
    color: '#248A3D',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
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
    marginBottom: SPACING.m,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg,
  },
  renterAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  renterName: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  renterMeta: {
    ...TYPE.caption,
    marginTop: 2,
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
    backgroundColor: COLORS.borderStrong,
    marginVertical: SPACING.m,
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
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  secondaryActionText: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
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
});
