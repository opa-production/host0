import React, { useState, useMemo, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function SupaHostScreen({ navigation: nav }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [billing, setBilling] = useState('monthly'); // monthly | yearly

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const pricing = useMemo(() => {
    const monthly = { 
      label: 'Monthly', 
      originalPrice: 'KES 5,000',
      currentPrice: 'KES 3,500',
      period: '/ mo'
    };
    const yearly = { 
      label: 'Yearly', 
      originalPrice: 'KES 60,000',
      currentPrice: 'KES 45,000',
      period: '/ yr'
    };
    return billing === 'monthly' ? monthly : yearly;
  }, [billing]);

  const benefits = [
    'Reduced commission on cars',
    'Boosted visibility',
    'Unlimited number of listings',
    'Verified badge',
    'Instant payouts',
    'Smart calendar access',
    'Enable pay on site',
  ];

  const handleGetBadge = () => {
    lightHaptic();
    nav.navigate('GetBadge');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            nav.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a SupaHost</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Unlock boosted earnings and visibility with the premium host badge.</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleOption, billing === 'monthly' && styles.toggleOptionActive]}
            onPress={() => {
              lightHaptic();
              setBilling('monthly');
            }}
            activeOpacity={0.9}
          >
            <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleOption, billing === 'yearly' && styles.toggleOptionActive]}
            onPress={() => {
              lightHaptic();
              setBilling('yearly');
            }}
            activeOpacity={0.9}
          >
            <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SupaHost</Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>{pricing.originalPrice}</Text>
            <View style={styles.currentPriceRow}>
              <Text style={styles.currentPrice}>{pricing.currentPrice}</Text>
              <Text style={styles.pricePeriod}>{pricing.period}</Text>
            </View>
          </View>

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
            onPress={handleGetBadge}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    gap: 20,
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    padding: 3,
    alignSelf: 'center',
    width: '68%',
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.text,
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
    gap: 16,
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
  priceContainer: {
    marginVertical: 4,
  },
  originalPrice: {
    ...TYPE.body,
    fontSize: 16,
    color: COLORS.subtle,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentPrice: {
    ...TYPE.largeTitle,
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  pricePeriod: {
    ...TYPE.body,
    fontSize: 16,
    color: COLORS.subtle,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
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
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
