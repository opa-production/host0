import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <Image source={booking.vehicleImage} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{booking.vehicleName}</Text>
            <Text style={styles.heroSubtitle}>{booking.location}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="car-sport-outline" size={14} color="#222222" />
                <Text style={styles.badgeText}>{booking.plate}</Text>
              </View>
              <View style={[styles.badge, styles.badgeAlt]}>
                <Ionicons name="radio-button-on-outline" size={14} color="#32CD32" />
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
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Extend booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} activeOpacity={0.9}>
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
    backgroundColor: '#fdfdfd',
  },
  content: {
    padding: 20,
    paddingTop: 90,
    paddingBottom: 100,
    gap: 16,
  },
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 220,
    backgroundColor: '#f0f0f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#f1f1f1',
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeAlt: {
    backgroundColor: '#d8f5dd',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#222222',
  },
  badgeTextAlt: {
    color: '#2e8b57',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efefef',
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
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
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
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  renterBio: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF4FA',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#777777',
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#f7f7f7',
  },
  timelineText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#444444',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  value: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  valueMuted: {
    color: '#888888',
  },
  bold: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  accent: {
    color: '#111111',
  },
  actionsCard: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF1577',
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
    borderColor: '#d3d3d3',
    borderWidth: 2,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  outlineButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#444444',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
