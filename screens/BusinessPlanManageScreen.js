import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Switch,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getHostSubscription, clearMockSubscriptionPlan } from '../services/subscriptionService';
import {
  getHidePremiumBadgePreference,
  setHidePremiumBadgePreference,
} from '../utils/userStorage';
import { ARDENA_COMMUNITY_URL } from '../config/publicLinks';
import AppLoader from "../ui/AppLoader";

function parseDaysRemaining(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isNaN(n) && n >= 0) return n;
  const s = String(raw).trim();
  return s || null;
}

function formatCountdown(days) {
  if (days == null) return null;
  const n = Number(days);
  if (Number.isNaN(n)) return null;
  if (n === 0) return 'Renews today';
  if (n === 1) return '1 day left';
  return `${n} days left`;
}

export default function BusinessPlanManageScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [planCode, setPlanCode] = useState(null);
  const [planLabel, setPlanLabel] = useState(null);
  const [countdownText, setCountdownText] = useState(null);
  const [blurb, setBlurb] = useState('');
  const [hidePremiumBadge, setHidePremiumBadge] = useState(false);

  const [isTrial, setIsTrial] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHostSubscription();
      if (!res.success || !res.subscription) {
        navigation.replace('SupaHost');
        return;
      }
      const s = res.subscription;
      const plan = String(s.plan || 'free').toLowerCase();
      const paid = s.is_paid_active === true;
      const trial = s.is_trial === true;

      if (!paid && !trial) {
        navigation.replace('SupaHost');
        return;
      }
      setIsTrial(trial && !paid);
      setPlanCode(plan);
      setPlanLabel(plan === 'premium' ? 'Premium' : 'Starter');
      const days = parseDaysRemaining(s.days_remaining);
      setCountdownText(trial ? 'Free trial' : formatCountdown(days));
      setBlurb(
        trial
          ? 'You\'re on a free 30-day Starter trial. Upgrade to a paid plan to keep access after it ends.'
          : plan === 'premium'
            ? 'Lower commission, higher listing limits, and a verified badge on your profile.'
            : 'More listings, smart calendar, and reduced commission vs. free hosting.'
      );
      const hidePref = await getHidePremiumBadgePreference();
      setHidePremiumBadge(hidePref);
    } catch {
      navigation.replace('SupaHost');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openChangePlan = () => {
    lightHaptic();
    navigation.navigate('SupaHost', { activePlanCode: planCode });
  };

  const openAnalytics = () => {
    lightHaptic();
    navigation.navigate('HostStats');
  };

  const openCommunity = async () => {
    lightHaptic();
    try {
      await Linking.openURL(ARDENA_COMMUNITY_URL);
    } catch {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const onToggleHideBadge = async (value) => {
    lightHaptic();
    setHidePremiumBadge(value);
    await setHidePremiumBadgePreference(value);
  };

  const onClearDevPremium = () => {
    lightHaptic();
    Alert.alert(
      'Clear premium (Dev)',
      'This removes the local mock premium/starter plan on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearMockSubscriptionPlan();
            await setHidePremiumBadgePreference(false);
            setHidePremiumBadge(false);
            navigation.replace('SupaHost');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your plan</Text>
        <View style={styles.headerIcon} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <AppLoader size="small" color={COLORS.text} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>Ardena for Business</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Current plan</Text>
            <View style={styles.planRow}>
              <Text style={styles.planName}>{planLabel}</Text>
              {planCode === 'premium' ? (
                <Image
                  source={require('../assets/images/badge.png')}
                  style={styles.badge}
                  resizeMode="contain"
                  accessibilityLabel="Premium"
                />
              ) : null}
            </View>

            {isTrial && (
              <View style={styles.trialBadge}>
                <Text style={styles.trialBadgeText}>Free Trial</Text>
              </View>
            )}
            {countdownText ? (
              <Text style={[styles.countdown, isTrial && styles.countdownTrial]}>{countdownText}</Text>
            ) : (
              <Text style={styles.countdownMuted}>Active</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.blurb}>{blurb}</Text>

            {planCode === 'premium' ? (
              <>
                <View style={styles.divider} />
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={styles.rowTitle}>Hide verified badge</Text>
                    <Text style={styles.rowSub}>
                      You stay on Premium; the badge won’t show next to your name on Home or Profile.
                    </Text>
                  </View>
                  <Switch
                    value={hidePremiumBadge}
                    onValueChange={onToggleHideBadge}
                    trackColor={{ false: COLORS.borderStrong, true: '#99C7FF' }}
                    thumbColor={
                      Platform.OS === 'ios'
                        ? '#FFFFFF'
                        : hidePremiumBadge
                          ? COLORS.brand
                          : '#F4F4F5'
                    }
                    ios_backgroundColor={COLORS.borderStrong}
                  />
                </View>
              </>
            ) : null}

            <View style={styles.divider} />

            <TouchableOpacity style={styles.inCardRow} onPress={openAnalytics} activeOpacity={0.75}>
              <View style={styles.inCardRowLeft}>
                <Ionicons name="bar-chart-outline" size={22} color={COLORS.text} />
                <Text style={styles.inCardRowLabel}>Analytics</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.inCardRow} onPress={openCommunity} activeOpacity={0.75}>
              <View style={styles.inCardRowLeft}>
                <Ionicons name="people-outline" size={22} color={COLORS.text} />
                <Text style={styles.inCardRowLabel}>Ardena community</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {isTrial ? (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={openChangePlan}
                activeOpacity={0.9}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to paid plan</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.inCardRow} onPress={openChangePlan} activeOpacity={0.75}>
                <View style={styles.inCardRowLeft}>
                  <Ionicons name="swap-horizontal-outline" size={22} color={COLORS.text} />
                  <Text style={styles.inCardRowLabel}>Change plan</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.subtle} />
              </TouchableOpacity>
            )}

            {__DEV__ ? (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.inCardRow} onPress={onClearDevPremium} activeOpacity={0.75}>
                  <View style={styles.inCardRowLeft}>
                    <Ionicons name="close-circle-outline" size={22} color={COLORS.danger} />
                    <Text style={styles.devDangerLabel}>Clear premium (Dev)</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : null}

            <Text style={styles.hintInside}>
              Upgrade or switch anytime—you’ll confirm payment on the next screen.
            </Text>
          </View>
        </ScrollView>
      )}
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
    paddingBottom: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 18,
    color: COLORS.text,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
  },
  kicker: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: SPACING.m,
  },
  card: {
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    padding: SPACING.l,
    backgroundColor: COLORS.surface,
  },
  cardLabel: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginBottom: 6,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  planName: {
    ...TYPE.largeTitle,
    fontSize: 26,
    color: COLORS.text,
  },
  badge: {
    width: 32,
    height: 32,
  },
  countdown: {
    fontSize: 17,
    fontFamily: 'Nunito-Bold',
    color: COLORS.countdownOrange,
    letterSpacing: 0.2,
  },
  countdownMuted: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.subtle,
  },
  countdownTrial: {
    color: '#34C759',
  },
  trialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  trialBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
    color: '#34C759',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderStrong,
    marginVertical: SPACING.m,
  },
  blurb: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.m,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: SPACING.s,
  },
  rowTitle: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 4,
  },
  rowSub: {
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.subtle,
  },
  inCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  inCardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inCardRowLabel: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: COLORS.text,
  },
  devDangerLabel: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: COLORS.danger,
  },
  hintInside: {
    ...TYPE.body,
    fontSize: 12,
    color: COLORS.subtle,
    lineHeight: 17,
    marginTop: SPACING.m,
  },
});
