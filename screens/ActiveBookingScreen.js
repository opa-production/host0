import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function ActiveBookingScreen({ navigation }) {
  const booking = {
    vehicleName: 'BMW M3 Competition',
    vehicleImage: require('../assets/images/bmw.jpg'),
    plate: 'KDA 452M',
    location: 'Nakuru, Kenya',
    startDate: 'Jan 15, 2024 • 09:00',
    endDate: 'Jan 20, 2024 • 11:00',
    status: 'Active',
    renter: {
      name: 'John Doe',
      bio: 'Loves road trips, 5-star renter rating.',
      avatar: null,
    },
    price: {
      daily: 'KSh 9,000',
      days: 5,
      commission: 'KSh 8,750',
      total: 'KSh 45,000',
      payout: 'KSh 36,250',
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <Image source={booking.vehicleImage} style={styles.heroAvatar} resizeMode="cover" />
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{booking.vehicleName}</Text>
            <Text style={styles.heroSubtitle}>{booking.location}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="car-sport-outline" size={14} color={COLORS.text} />
                <Text style={styles.badgeText}>{booking.plate}</Text>
              </View>
              <View style={[styles.badge, styles.badgeAlt]}>
                <Ionicons name="radio-button-on-outline" size={14} color="#34C759" />
                <Text style={[styles.badgeText, styles.badgeTextAlt]}>{booking.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Renter profile */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Renter</Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Messages')}
              activeOpacity={0.9}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#222222" />
              <Text style={styles.secondaryButtonText}>Message renter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.renterRow}>
            {booking.renter.avatar ? (
              <Image source={{ uri: booking.renter.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color="#999999" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.renterName}>{booking.renter.name}</Text>
              <Text style={styles.renterBio}>{booking.renter.bio}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="call-outline" size={20} color="#222222" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking details</Text>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={18} color="#222222" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Start</Text>
              <Text style={styles.detailValue}>{booking.startDate}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={18} color="#222222" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>End</Text>
              <Text style={styles.detailValue}>{booking.endDate}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.timelineRow}>
            <View style={styles.timelineChip}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.timelineText}>{booking.location}</Text>
            </View>
            <View style={styles.timelineChip}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.timelineText}>On trip</Text>
            </View>
          </View>
        </View>

        {/* Payment breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payments</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Daily rate</Text>
            <Text style={styles.value}>{booking.price.daily}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Days</Text>
            <Text style={styles.value}>{booking.price.days}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Platform commission</Text>
            <Text style={[styles.value, styles.valueMuted]}>- {booking.price.commission}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={[styles.label, styles.bold]}>Total paid</Text>
            <Text style={[styles.value, styles.bold]}>{booking.price.total}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={[styles.label, styles.accent]}>Your payout</Text>
            <Text style={[styles.value, styles.accent]}>{booking.price.payout}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.card, styles.actionsCard]}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ExtendBooking', { bookingRef: `${booking.vehicleName} • ${booking.plate}` })}
          >
            <Text style={styles.primaryButtonText}>Extend booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ReportIssue', { bookingRef: `${booking.vehicleName} • ${booking.plate}` })}
          >
            <Text style={styles.outlineButtonText}>Report issue</Text>
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
  content: {
    padding: SPACING.l,
    paddingTop: 90,
    paddingBottom: 110,
    gap: 16,
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
    shadowRadius: 8,
    elevation: 2,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bg,
    marginRight: 14,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    ...TYPE.title,
    fontSize: 18,
    color: COLORS.text,
  },
  heroSubtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  badgeAlt: {
    backgroundColor: '#EAF8EE',
    borderColor: '#D1EED8',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  badgeTextAlt: {
    color: '#248A3D',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    ...TYPE.title,
    fontSize: 16,
    color: COLORS.text,
  },
  renterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  },
  renterBio: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
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
    borderColor: COLORS.borderStrong,
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
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderStrong,
    marginVertical: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  timelineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  timelineText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.subtle,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  valueMuted: {
    color: COLORS.subtle,
  },
  bold: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  accent: {
    color: COLORS.text,
  },
  actionsCard: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111111',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  outlineButton: {
    borderColor: COLORS.borderStrong,
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  outlineButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
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
});
