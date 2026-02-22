import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../../ui/tokens';
import { lightHaptic } from '../../ui/haptics';
import { createKycSession } from '../../services/kycService';

export default function KycIntroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [startingSession, setStartingSession] = useState(false);

  const handleStartVerification = async () => {
    lightHaptic();
    setStartingSession(true);
    try {
      const result = await createKycSession();
      if (!result.success) {
        Alert.alert('Verification', result.error || 'Could not start verification. Please try again.');
        return;
      }
      const url = result.verification_url;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open verification page.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open verification page. Please try again.');
    } finally {
      setStartingSession(false);
    }
  };

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
        <Text style={styles.headerTitle}>Identity verification</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="scan" size={40} color={COLORS.brand} />
          </View>
          <Text style={styles.title}>Verify your identity</Text>
          <Text style={styles.body}>
            We use our partner Veriff for fast, secure verification. You’ll complete a short flow in your browser: ID check and a quick selfie to confirm it’s you.
          </Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
              <Text style={styles.bulletText}>Automated identity verification</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
              <Text style={styles.bulletText}>ID document + liveness check</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.brand} />
              <Text style={styles.bulletText}>Usually takes under 2 minutes</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartVerification}
            activeOpacity={0.85}
            disabled={startingSession}
          >
            {startingSession ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Continue to verification</Text>
                <Ionicons name="open-outline" size={18} color="#FFF" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
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
    backgroundColor: COLORS.bg,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.title, fontSize: 18, color: COLORS.text },
  content: { padding: SPACING.l, paddingTop: SPACING.m },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: { marginBottom: SPACING.m },
  title: { ...TYPE.title, fontSize: 20, marginBottom: SPACING.s },
  body: { ...TYPE.body, marginBottom: SPACING.l, lineHeight: 22 },
  bulletList: { marginBottom: SPACING.l },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.s },
  bulletText: { ...TYPE.body, marginLeft: 8 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#1C1C1E',
    borderRadius: RADIUS.button,
  },
  primaryButtonText: { ...TYPE.bodyStrong, color: '#FFF', fontSize: 16 },
  buttonIcon: { marginLeft: 6 },
});
