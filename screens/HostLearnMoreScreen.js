import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function HostLearnMoreScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={require('../assets/images/host.png')} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroText}>
            <Text style={styles.title}>Become a host</Text>
            <Text style={styles.subtitle}>Earn with your car. Stay in control. Start in minutes.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why host on Opa?</Text>
          <View style={styles.featureRow}>
            <Ionicons name="wallet-outline" size={22} color={COLORS.text} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Extra income</Text>
              <Text style={styles.featureSub}>Get paid for days your car is on trip.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureRow}>
            <Ionicons name="umbrella-outline" size={22} color={COLORS.text} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Peace of mind</Text>
              <Text style={styles.featureSub}>Identity checks, rules, and support when you need it.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureRow}>
            <Ionicons name="options-outline" size={22} color={COLORS.text} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>You set the terms</Text>
              <Text style={styles.featureSub}>Choose pricing, availability, and trip requirements.</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Add your vehicle details and photos.</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Set your pricing and availability.</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Approve trips and start earning.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('HostVehicle')} activeOpacity={1}>
          <Text style={styles.primaryButtonText}>Start hosting</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.disclaimer}>Hosting availability and requirements may vary by location.</Text>
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
    padding: SPACING.l,
    paddingTop: 90,
    paddingBottom: 120,
    gap: 16,
  },
  hero: {
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    height: 210,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroText: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  title: {
    ...TYPE.largeTitle,
    color: '#FFFFFF',
  },
  subtitle: {
    ...TYPE.body,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    padding: SPACING.l,
  },
  sectionTitle: {
    ...TYPE.section,
    color: COLORS.text,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...TYPE.bodyStrong,
    color: COLORS.text,
  },
  featureSub: {
    ...TYPE.body,
    color: COLORS.subtle,
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  stepNumberText: {
    ...TYPE.micro,
    color: COLORS.text,
  },
  stepText: {
    ...TYPE.body,
    color: COLORS.text,
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1D1D1D',
    borderRadius: RADIUS.button,
    paddingVertical: 14,
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    color: '#FFFFFF',
    fontSize: 15,
  },
  disclaimer: {
    ...TYPE.micro,
    color: COLORS.subtle,
    textAlign: 'center',
    marginTop: 4,
  },
});
