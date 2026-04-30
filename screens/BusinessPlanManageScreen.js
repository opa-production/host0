import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

export default function BusinessPlanManageScreen({ navigation }) {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.headerTitle}>Ardena for Business</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="business-outline" size={48} color={COLORS.brand} />
          </View>
          <Text style={styles.title}>Business Verification</Text>
          <Text style={styles.blurb}>
            We are simplifying our platform for the launch phase. All host accounts can now list up to 10 cars for free.
          </Text>
          
          <View style={styles.divider} />
          
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>COMING SOON</Text>
          </View>
          
          <Text style={styles.description}>
            Formal business verification and expanded fleet management tools are coming soon. This will allow verified businesses to post more than 10 vehicles and access advanced analytics.
          </Text>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
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
  content: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  card: {
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: SPACING.m,
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  blurb: {
    ...TYPE.body,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.borderStrong,
    marginVertical: SPACING.l,
  },
  comingSoonBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: SPACING.m,
  },
  comingSoonText: {
    color: '#007AFF',
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  description: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.subtle,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
