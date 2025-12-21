import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function HostScreen({ navigation }) {
  const handleHostVehicle = () => {
    navigation.navigate('HostVehicle');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Host</Text>
              <Text style={styles.subtitle}>Add cars and services</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyListings')}
              style={styles.headerIconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="list-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsList}>
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={handleHostVehicle}
            activeOpacity={0.85}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="car-sport-outline" size={24} color={styles.iconMono.color} />
              <Text style={styles.actionText}>Host vehicle</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
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
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerIconButton: {
    padding: 6,
  },
  title: {
    ...TYPE.largeTitle,
    marginBottom: 6,
  },
  subtitle: {
    ...TYPE.body,
    color: '#8E8E93',
  },
  actionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#1C1C1E',
  },
  iconMono: {
    color: '#1C1C1E',
  },
});
