import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Switch, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [allCarsAvailable, setAllCarsAvailable] = useState(true);

  // TODO: Replace with actual data from API/context
  const userName = 'Deon';
  const upcomingBookings = [
    {
      id: '1',
      carName: 'BMW M3',
      startTime: '10:00 AM',
      renterName: 'John Doe',
      isToday: true,
    },
    {
      id: '2',
      carName: 'Mercedes C-Class',
      startTime: '2:00 PM',
      renterName: 'Jane Smith',
      isToday: true,
    },
  ];

  const quickStats = {
    activeBookings: 3,
    totalCars: 5,
    unreadMessages: 2,
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const SkeletonBox = ({ width, height, style }) => {
    const [pulseAnim] = useState(new Animated.Value(0.3));

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, []);

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            backgroundColor: '#e8e8e8',
            borderRadius: 8,
            opacity: pulseAnim,
          },
          style,
        ]}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonBox width={200} height={32} style={{ marginBottom: 8 }} />
          <SkeletonBox width={150} height={16} style={{ marginBottom: 32 }} />
          <SkeletonBox width="100%" height={80} style={{ marginBottom: 16, borderRadius: 12 }} />
          <SkeletonBox width="100%" height={120} style={{ marginBottom: 16, borderRadius: 12 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={1}
            >
              <Ionicons name="map-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <View style={styles.availabilityInfo}>
              <Ionicons 
                name={allCarsAvailable ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color="#000000" 
              />
              <View style={styles.availabilityText}>
                <Text style={styles.availabilityTitle}>
                  {allCarsAvailable ? 'All cars available' : 'Some cars unavailable'}
                </Text>
                <Text style={styles.availabilitySubtitle}>
                  {allCarsAvailable 
                    ? 'Your cars are ready for booking' 
                    : 'Some cars are currently rented'}
                </Text>
              </View>
            </View>
            <Switch
              value={allCarsAvailable}
              onValueChange={setAllCarsAvailable}
              trackColor={{ false: '#e0e0e0', true: '#666666' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Bookings</Text>
            {upcomingBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('Bookings')}
                activeOpacity={1}
              >
                <View style={styles.bookingIcon}>
                  <Ionicons name="time-outline" size={20} color="#000000" />
                </View>
                <View style={styles.bookingContent}>
                  <Text style={styles.bookingText}>
                    <Text style={styles.bookingCarName}>{booking.carName}</Text>
                    {' starts at '}
                    <Text style={styles.bookingTime}>{booking.startTime}</Text>
                  </Text>
                  <Text style={styles.bookingRenter}>Renter: {booking.renterName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Bookings')}
              activeOpacity={1}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="calendar-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionTitle}>Manage Bookings</Text>
              {quickStats.activeBookings > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{quickStats.activeBookings}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('MyListings')}
              activeOpacity={1}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="car-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionTitle}>Manage Cars</Text>
              <Text style={styles.actionSubtitle}>{quickStats.totalCars} listed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Messages')}
              activeOpacity={1}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="chatbubbles-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionTitle}>Messages</Text>
              {quickStats.unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{quickStats.unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Host')}
              activeOpacity={1}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="add-circle-outline" size={24} color="#000000" />
              </View>
              <Text style={styles.actionTitle}>Add Listing</Text>
              <Text style={styles.actionSubtitle}>Car or service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{quickStats.activeBookings}</Text>
            <Text style={styles.statLabel}>Active Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{quickStats.totalCars}</Text>
            <Text style={styles.statLabel}>Total Cars</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{quickStats.unreadMessages}</Text>
            <Text style={styles.statLabel}>Unread Messages</Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f8f8',
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
  availabilityCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  availabilityText: {
    marginLeft: 12,
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  availabilitySubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 12,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingContent: {
    flex: 1,
  },
  bookingText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  bookingCarName: {
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  bookingTime: {
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  bookingRenter: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#000000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
});
