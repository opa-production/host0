import React from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function PastBookingsScreen({ navigation }) {
  const bookings = [
    {
      id: 'past-1',
      vehicleName: 'BMW M3',
      vehicleImage: require('../assets/images/bmw.jpg'),
      startDate: '2023-12-10',
      endDate: '2023-12-15',
      status: 'completed',
      totalAmount: 'KSh 38,000',
      location: 'Nakuru, Kenya',
    },
    {
      id: 'past-2',
      vehicleName: 'Toyota Corolla',
      vehicleImage: require('../assets/images/bm.jpg'),
      startDate: '2023-11-02',
      endDate: '2023-11-04',
      status: 'completed',
      totalAmount: 'KSh 14,000',
      location: 'Nakuru, Kenya',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'upcoming':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'upcoming':
        return 'Upcoming';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Past bookings</Text>
          <Text style={styles.subtitle}>Your completed trips</Text>
        </View>

        <View style={styles.list}>
          {bookings.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.listCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('PastBookingDetail', { booking: {
                vehicleName: b.vehicleName,
                vehicleImage: b.vehicleImage,
                location: b.location,
                startDate: b.startDate,
                endDate: b.endDate,
                status: getStatusText(b.status),
                totalPaid: typeof b.totalAmount === 'string' ? parseInt(b.totalAmount.replace(/[^\d]/g, ''), 10) || 0 : b.totalAmount,
              } })}
            >
              <View style={styles.listLeft}>
                <Image source={b.vehicleImage} style={styles.avatar} resizeMode="cover" />
              </View>

              <View style={styles.listMiddle}>
                <View style={styles.rowTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{b.vehicleName}</Text>
                  <View style={[styles.statusPill, { backgroundColor: getStatusColor(b.status) + '1A' }]}>
                    <Text style={[styles.statusPillText, { color: getStatusColor(b.status) }]}>
                      {getStatusText(b.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>
                  {b.startDate} - {b.endDate}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  header: {
    marginBottom: 16,
  },
  title: {
    ...TYPE.largeTitle,
  },
  subtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginTop: 6,
  },
  list: {
    marginTop: 10,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  listLeft: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bg,
  },
  listMiddle: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    ...TYPE.section,
    flex: 1,
  },
  statusPill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
  },
  cardSub: {
    ...TYPE.caption,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    ...TYPE.caption,
    color: COLORS.subtle,
    flex: 1,
  },
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
});
