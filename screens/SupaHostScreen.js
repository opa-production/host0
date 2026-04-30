import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function SupaHostScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
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
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="business-outline" size={64} color={COLORS.brand} />
          </View>
          <Text style={styles.title}>Simplified for Launch</Text>
          <Text style={styles.subtitle}>
            To make the platform more accessible during our launch phase, we have temporarily disabled paid subscription plans.
          </Text>

          <View style={styles.divider} />

          <View style={styles.benefitItem}>
            <View style={styles.benefitTick}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Free for Everyone</Text>
              <Text style={styles.benefitText}>All host accounts now include features previously reserved for paid plans.</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitTick}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>10 Car Limit</Text>
              <Text style={styles.benefitText}>You can list up to 10 vehicles on your account at no cost.</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.benefitTick}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Smart Calendar</Text>
              <Text style={styles.benefitText}>Manage your fleet availability with our advanced calendar tools.</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Formal business verification and expanded fleet limits (>10 cars) will be introduced soon.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>Got it</Text>
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
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: SPACING.m,
  },
  title: {
    ...TYPE.section,
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 15,
    color: COLORS.subtle,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.l,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.borderVisible,
    marginVertical: SPACING.m,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    marginBottom: SPACING.m,
  },
  benefitTick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  benefitText: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.subtle,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: SPACING.m,
    borderRadius: 12,
    gap: 10,
    marginTop: SPACING.s,
    marginBottom: SPACING.l,
    width: '100%',
  },
  infoText: {
    flex: 1,
    ...TYPE.body,
    fontSize: 13,
    color: '#007AFF',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.brand,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
