import React from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function PastBookingDetailScreen({ navigation, route }) {
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
              onPress={() => Alert.alert('Rate renter', 'Rating flow coming soon.')}
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
});
