import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const PERKS = [
  { icon: 'shield-checkmark-outline', text: 'Business verification badge on your profile' },
  { icon: 'car-sport-outline', text: 'List more than 10 vehicles with no cap' },
  { icon: 'headset-outline', text: 'Priority support and a dedicated account manager' },
  { icon: 'analytics-outline', text: 'Advanced fleet analytics and reporting tools' },
];

export default function SupaHostScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { lightHaptic(); navigation.goBack(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>For Business</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Coming soon</Text>
        <Text style={styles.title}>Ardena for Business</Text>
        <Text style={styles.body}>
          We're building dedicated tools for verified business operators. Once live, your account can be verified as a business to unlock a wider set of features and support.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>What to expect</Text>
        {PERKS.map((p, i) => (
          <View key={i} style={styles.perkRow}>
            <Ionicons name={p.icon} size={17} color={COLORS.subtle} style={styles.perkIcon} />
            <Text style={styles.perkText}>{p.text}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.9}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.section, fontSize: 16, color: COLORS.text },
  content: { paddingHorizontal: SPACING.l, paddingTop: SPACING.m },
  eyebrow: {
    ...TYPE.micro,
    fontSize: 11,
    color: COLORS.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: { ...TYPE.largeTitle, fontSize: 28, color: COLORS.text, marginBottom: 14 },
  body: { ...TYPE.body, fontSize: 15, color: COLORS.muted, lineHeight: 22, marginBottom: 32 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.15)', marginBottom: 24 },
  sectionLabel: {
    ...TYPE.micro,
    fontSize: 11,
    color: COLORS.subtle,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 18,
  },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  perkIcon: { marginTop: 1 },
  perkText: { ...TYPE.body, fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 20 },
  button: {
    backgroundColor: COLORS.text,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonText: { ...TYPE.bodyStrong, color: '#FFF', fontSize: 15 },
});
