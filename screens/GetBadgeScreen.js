import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

const carCounts = [1, 2, 3, 4, 5];

export default function GetBadgeScreen({ navigation }) {
  const [selectedCount, setSelectedCount] = useState(1);

  const pricePerCar = 4500;
  const total = selectedCount * pricePerCar;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Get SupaHost badge</Text>
        <Text style={styles.subtitle}>Choose how many cars you want to elevate, then checkout securely.</Text>

        <View style={styles.selectorCard}>
          <Text style={styles.sectionLabel}>Number of cars</Text>
          <View style={styles.selectorRow}>
            {carCounts.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.selectorPill,
                  selectedCount === count && styles.selectorPillActive,
                ]}
                onPress={() => setSelectedCount(count)}
                activeOpacity={0.85}
              >
                <Text style={[styles.selectorText, selectedCount === count && styles.selectorTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>{`KES ${total.toLocaleString()}`}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>Proceed to checkout</Text>
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Secure checkout</Text>
          <Text style={styles.noteText}>We support mobile money, card, and bank transfer.</Text>
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
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
  content: {
    padding: SPACING.l,
    paddingTop: 90,
    paddingBottom: 120,
    gap: 16,
  },
  title: {
    ...TYPE.largeTitle,
    lineHeight: 34,
  },
  subtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginTop: 6,
  },
  selectorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.m,
    gap: 12,
  },
  sectionLabel: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: COLORS.subtle,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectorPill: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  selectorPillActive: {
    backgroundColor: '#1D1D1D',
  },
  selectorText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#8E8E93',
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  priceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.l,
    alignItems: 'center',
    gap: 6,
  },
  priceLabel: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
  priceValue: {
    ...TYPE.largeTitle,
    fontSize: 32,
    color: '#1D1D1D',
  },
  primaryButton: {
    backgroundColor: '#FF1577',
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
    fontSize: 15,
  },
  noteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.m,
    gap: 6,
  },
  noteTitle: {
    ...TYPE.bodyStrong,
    fontSize: 13,
  },
  noteText: {
    ...TYPE.body,
    color: COLORS.subtle,
  },
});
