import React, { useState, useMemo, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

/** Display pricing & benefits (checkout still posts plan code; server charges configured KES). */
const PLANS = {
  starter: {
    id: 'starter',
    code: 'starter',
    name: 'Starter',
    price: 3500,
    blurb: 'Essential tools for small fleets',
    features: [
      'Up to 10 car listings',
      'Smart calendar',
      '10% platform commission',
      'Priority in search results',
    ],
  },
  premium: {
    id: 'premium',
    code: 'premium',
    name: 'Premium',
    price: 6500,
    blurb: 'Full business toolkit & visibility',
    features: [
      'Up to 50 car listings',
      'Smart calendar',
      '8% platform commission',
      'Priority in search results',
      'Advanced analytics dashboard',
      'Verified badge',
      'Corporate branding',
    ],
  },
};

export default function SupaHostScreen({ navigation: nav }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('starter'); // starter | premium

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const plan = useMemo(() => {
    const p = PLANS[selectedPlan];
    return { ...p, code: p.code };
  }, [selectedPlan]);

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
        <Text style={styles.headerTitle}>Ardena for Business</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          For fleets, NGOs, and corporates: list more cars, pay lower commission, and stand out with a verified business profile.
        </Text>

        <View style={styles.toggleWrapper}>
          <BlurView intensity={72} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.toggleContainer} pointerEvents="box-none">
            <TouchableOpacity
              style={[styles.toggleOption, selectedPlan === 'starter' && styles.toggleOptionActive]}
              onPress={() => {
                lightHaptic();
                setSelectedPlan('starter');
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.toggleText, selectedPlan === 'starter' && styles.toggleTextActive]}
              >
                Starter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleOption, selectedPlan === 'premium' && styles.toggleOptionActive]}
              onPress={() => {
                lightHaptic();
                setSelectedPlan('premium');
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.toggleText, selectedPlan === 'premium' && styles.toggleTextActive]}
              >
                Premium
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTextBlock}>
              {plan.id === 'premium' ? (
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>Premium</Text>
                  <Image
                    source={require('../assets/images/badge.png')}
                    style={styles.cardPremiumBadge}
                    resizeMode="contain"
                    accessibilityLabel="Verified premium"
                    accessibilityRole="image"
                  />
                </View>
              ) : (
                <Text style={styles.cardTitle}>{plan.name}</Text>
              )}
              <Text style={styles.cardBlurb}>{plan.blurb}</Text>
            </View>
            {selectedPlan === 'premium' && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            )}
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.currentPriceRow}>
              <Text style={styles.currentPrice}>KSh {plan.price.toLocaleString()}</Text>
              <Text style={styles.pricePeriod}>/ month</Text>
            </View>
            <Text style={styles.billingNote}>Billed monthly · cancel anytime</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.benefitsTitle}>{"What's included"}</Text>
          <View style={styles.benefitsList}>
            {plan.features.map((item) => (
              <View style={styles.benefitItem} key={item}>
                <View style={styles.benefitTick}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => {
              lightHaptic();
              nav.navigate('BusinessPlanCheckout', {
                planCode: plan.code || plan.id,
                planName: plan.name,
                price: plan.price,
              });
            }}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
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
    lineHeight: 19,
  },
  toggleWrapper: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 400,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.pill,
    padding: 4,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.45)' : 'transparent',
    minHeight: 48,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: 'transparent',
  },
  toggleOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  toggleText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: 'rgba(0,0,0,0.55)',
  },
  toggleTextActive: {
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardHeaderTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /** Transparent PNG — sits to the right of “Premium” */
  cardPremiumBadge: {
    width: 28,
    height: 28,
    marginTop: 1,
  },
  cardTitle: {
    ...TYPE.section,
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    color: '#1C1C1E',
  },
  cardBlurb: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginTop: 4,
    lineHeight: 18,
  },
  popularBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderRadius: 999,
  },
  popularBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.brand,
  },
  priceContainer: {
    marginVertical: 4,
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
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
  billingNote: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderVisible,
  },
  benefitsTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitTick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    ...TYPE.body,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    paddingTop: 1,
  },
  primaryButton: {
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
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
