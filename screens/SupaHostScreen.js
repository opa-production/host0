import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function SupaHostScreen({ navigation }) {
  const [billing, setBilling] = useState('monthly'); // monthly | yearly

  const pricing = useMemo(() => {
    const monthly = { label: 'Monthly', range: 'KES 1,500 – 5,000 / mo' };
    const yearly = { label: 'Yearly', range: 'KES 18,000 – 60,000 / yr' };
    return billing === 'monthly' ? monthly : yearly;
  }, [billing]);

  const benefits = [
    '0% commission on rentals',
    '0% booking fee for users (when booking a premium host car)',
    'Cars get boosted visibility',
    'Enable pay on-site',
    'Priority support',
    'Premium host badge',
    'Discounts on Opa marketing',
    'Free professional listing photos (optional future perk)',
  ];

  const handleGetBadge = () => {
    // TODO: hook into payment using saved methods
    Alert.alert('Payment initiated', 'Processing payment with your saved method for SupaHost.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Become a SupaHost</Text>
        <Text style={styles.subtitle}>Unlock boosted earnings and visibility with the premium host badge.</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleOption, billing === 'monthly' && styles.toggleOptionActive]}
            onPress={() => setBilling('monthly')}
            activeOpacity={0.9}
          >
            <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleOption, billing === 'yearly' && styles.toggleOptionActive]}
            onPress={() => setBilling('yearly')}
            activeOpacity={0.9}
          >
            <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SupaHost</Text>
            {/* <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#111111" />
              <Text style={styles.badgeText}>Premium</Text>
            </View> */}
          </View>
          <Text style={styles.price}>{pricing.range}</Text>
          <Text style={styles.note}>Pricing varies by number of cars.</Text>

          <View style={styles.divider} />

          <Text style={styles.benefitsTitle}>Benefits</Text>
          <View style={styles.benefitsList}>
            {benefits.map((item) => (
              <View style={styles.benefitItem} key={item}>
                <Ionicons name="checkmark" size={18} color="#111111" />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('GetBadge')}
          >
            <Text style={styles.primaryButtonText}>Get badge</Text>
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
  content: {
    paddingHorizontal: SPACING.l,
    paddingTop: 90,
    paddingBottom: 80,
    gap: 14,
  },
  title: {
    ...TYPE.title,
    fontSize: 20,
    color: '#1C1C1E',
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    alignSelf: 'center',
    width: '68%',
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  toggleOptionActive: {
    backgroundColor: '#111111',
  },
  toggleText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#ffffff',
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
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f3f3f3',
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
  },
  price: {
    ...TYPE.section,
    fontSize: 20,
    color: '#1C1C1E',
  },
  note: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  benefitsTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    flex: 1,
    ...TYPE.body,
    fontSize: 13,
    color: '#1C1C1E',
  },
  primaryButton: {
    backgroundColor: '#111111',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
