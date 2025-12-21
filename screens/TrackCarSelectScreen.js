import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function TrackCarSelectScreen({ navigation }) {
  const activeTrips = [
    {
      id: 'b1',
      vehicleName: 'BMW M3 Competition',
      plate: 'KDA 452M',
      location: 'Nakuru, Kenya',
      image: require('../assets/images/bmw.jpg'),
      region: {
        latitude: -0.3031,
        longitude: 36.08,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      },
    },
  ];

  const handleSelect = (trip) => {
    navigation.navigate('Map', {
      title: trip.vehicleName,
      plate: trip.plate,
      initialRegion: trip.region,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Track your car</Text>
          <Text style={styles.subtitle}>Choose an active rental to view its live location.</Text>
        </View>

        {activeTrips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="car-outline" size={26} color={COLORS.subtle} />
            <Text style={styles.emptyTitle}>No active rentals</Text>
            <Text style={styles.emptySub}>When a renter is on a trip, you’ll be able to track the vehicle here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {activeTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.card}
                onPress={() => handleSelect(trip)}
                activeOpacity={1}
              >
                <Image source={trip.image} style={styles.avatar} />
                <View style={styles.info}>
                  <Text style={styles.name}>{trip.vehicleName}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.pill}>
                      <Ionicons name="car-sport-outline" size={14} color={COLORS.text} />
                      <Text style={styles.pillText}>{trip.plate}</Text>
                    </View>
                    <View style={[styles.pill, styles.pillAlt]}>
                      <Ionicons name="radio-button-on-outline" size={14} color="#34C759" />
                      <Text style={[styles.pillText, styles.pillTextAlt]}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.location}>{trip.location}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingBottom: 120,
    gap: 16,
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  header: {
    marginBottom: 4,
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
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.m,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bg,
    marginRight: 12,
  },
  info: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    ...TYPE.title,
    fontSize: 16,
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  pill: {
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
  pillAlt: {
    backgroundColor: '#E8F5E9',
    borderColor: '#D7F0DC',
  },
  pillText: {
    ...TYPE.micro,
    color: COLORS.text,
  },
  pillTextAlt: {
    color: '#1F7A35',
  },
  location: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.l,
    alignItems: 'center',
  },
  emptyTitle: {
    ...TYPE.section,
    marginTop: 10,
    color: COLORS.text,
  },
  emptySub: {
    ...TYPE.body,
    color: COLORS.subtle,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
});
