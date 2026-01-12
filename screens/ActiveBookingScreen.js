import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ActiveBookingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef(null);
  
  const booking = {
    vehicleName: 'BMW M3 Competition',
    vehicleImages: [
      require('../assets/images/bmw.jpg'),
      require('../assets/images/bmw.jpg'), // Add more images when available
    ],
    plate: 'KDA 452M',
    startDate: 'Jan 15, 2024 • 09:00',
    endDate: 'Jan 20, 2024 • 11:00',
    renter: {
      name: 'John Doe',
      phone: '+254 712 345 678',
      avatar: null,
      rating: 4.8,
      trips: 12,
    },
    price: {
      days: 5,
      commission: 'KSh 8,750',
      total: 'KSh 45,000',
      payout: 'KSh 36,250',
    },
  };

  const renderCarouselItem = ({ item, index }) => (
    <View style={styles.carouselItem}>
      <Image source={item} style={styles.carouselImage} resizeMode="cover" />
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Car Image Carousel */}
      <View style={styles.carouselContainer}>
        {/* Floating Back Button */}
        <TouchableOpacity
          style={[styles.floatingBackButton, { top: insets.top + 10 }]}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </View>
        </TouchableOpacity>
        <FlatList
          ref={carouselRef}
          data={booking.vehicleImages}
          renderItem={renderCarouselItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
        {booking.vehicleImages.length > 1 && (
          <View style={styles.carouselIndicators}>
            {booking.vehicleImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.vehicleNameRow}>
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
            <View style={styles.plateRow}>
              <Ionicons name="car-sport-outline" size={14} color={COLORS.text} />
              <Text style={styles.plateText}>{booking.plate}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking.price.days} days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start</Text>
            <Text style={styles.detailValue}>{booking.startDate}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End</Text>
            <Text style={styles.detailValue}>{booking.endDate}</Text>
          </View>
        </View>

        {/* Renter profile */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Renter</Text>
          <View style={styles.renterRow}>
            {booking.renter.avatar ? (
              <Image source={{ uri: booking.renter.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={COLORS.subtle} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.renterName}>{booking.renter.name}</Text>
              {booking.renter.rating && (
                <View style={styles.renterRating}>
                  <Text style={styles.ratingText}>⭐</Text>
                  <Text style={styles.ratingValue}>{booking.renter.rating}</Text>
                  {booking.renter.trips && (
                    <Text style={styles.tripsText}>• {booking.renter.trips} trips</Text>
                  )}
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                lightHaptic();
                navigation.navigate('Messages');
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
            {booking.renter.phone && (
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

        {/* Payment breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Total paid</Text>
            <Text style={styles.value}>{booking.price.total}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Platform commission</Text>
            <Text style={[styles.value, styles.commissionValue]}>- {booking.price.commission}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={[styles.label, styles.bold]}>Your payout</Text>
            <Text style={[styles.value, styles.bold]}>{booking.price.payout}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionLink}
            activeOpacity={0.7}
            onPress={() => {
              lightHaptic();
              navigation.navigate('ReportIssue', { bookingRef: `${booking.vehicleName} • ${booking.plate}` });
            }}
          >
            <Text style={styles.actionLinkText}>Report</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
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
    paddingTop: 16,
    paddingBottom: 110,
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: 280,
    position: 'relative',
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    height: 250,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
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
});
