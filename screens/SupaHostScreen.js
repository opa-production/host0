import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Become a SupaHost</Text>
        <Text style={styles.subtitle}>Unlock boosted earnings and visibility with the premium host badge.</Text>

        <View style={styles.toggleRow}>
          {['monthly', 'yearly'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.toggle,
                billing === option && styles.toggleActive,
              ]}
              activeOpacity={0.9}
              onPress={() => setBilling(option)}
            >
              <Text style={[styles.toggleText, billing === option && styles.toggleTextActive]}>
                {option === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SupaHost</Text>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#111111" />
              <Text style={styles.badgeText}>Premium</Text>
            </View>
          </View>
          <Text style={styles.price}>{pricing.range}</Text>
          <Text style={styles.note}>Pricing varies by number of cars.</Text>

          <View style={styles.divider} />

          <Text style={styles.benefitsTitle}>Benefits</Text>
          <View style={styles.benefitsList}>
            {benefits.map((item) => (
              <View style={styles.benefitItem} key={item}>
                <Ionicons name="checkmark-circle" size={18} color="#2e8b57" />
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={handleGetBadge}>
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
    backgroundColor: '#fdfdfd',
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 90,
    paddingBottom: 80,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggle: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  toggleActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
  },
  toggleTextActive: {
    color: '#ffffff',
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
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
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
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  note: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  benefitsTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
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
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#333333',
  },
  primaryButton: {
    backgroundColor: '#111111',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
});
