import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../../ui/tokens';
import { lightHaptic } from '../../ui/haptics';
import { getKycStatus } from '../../services/kycService';

export default function KycResultScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let pollInterval;
    
    const fetchStatus = async () => {
      try {
        const res = await getKycStatus();
        if (res.success && res.status) {
          setStatus(res.status);
          setLoading(false);
          
          if (res.status.status === 'approved' || res.status.status === 'verified' || res.status.status === 'declined' || res.status.status === 'failed') {
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    fetchStatus();
    pollInterval = setInterval(fetchStatus, 3000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const renderResult = () => {
    if (loading || (status && (status.status === 'pending' || status.status === 'started'))) {
      return (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={COLORS.brand} style={styles.loader} />
          <Text style={styles.title}>Verification in Progress</Text>
          <Text style={styles.body}>
            We're confirming your details with our verification partner. This usually takes less than a minute.
          </Text>
          <Text style={styles.waitText}>Please wait on this screen...</Text>
        </View>
      );
    }

    const isApproved = status?.status === 'approved' || status?.status === 'verified';
    
    if (isApproved) {
      return (
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={64} color="#34C759" />
          </View>
          <Text style={[styles.title, { color: '#34C759' }]}>Identity Verified</Text>
          <Text style={styles.body}>
            Great news! Your identity has been successfully verified. You can now continue hosting on Ardena.
          </Text>
          
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Verified Name</Text>
              <Text style={styles.detailValue}>{status.verified_name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Verified At</Text>
              <Text style={styles.detailValue}>
                {status.verified_at ? new Date(status.verified_at).toLocaleDateString() : 'Just now'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { lightHaptic(); navigation.navigate('MainTabs', { screen: 'Profile' }); }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Continue to Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Declined or Failed
    return (
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="close-circle" size={64} color="#FF3B30" />
        </View>
        <Text style={[styles.title, { color: '#FF3B30' }]}>Verification Failed</Text>
        <Text style={styles.body}>
          Unfortunately, we couldn't verify your identity. {status?.decision_reason || 'Please ensure your ID details are correct and your selfie is clear.'}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => { lightHaptic(); navigation.replace('KycIntro'); }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => { lightHaptic(); navigation.navigate('CustomerSupport'); }}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { lightHaptic(); navigation.navigate('MainTabs', { screen: 'Profile' }); }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderResult()}
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
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loader: { marginBottom: 20 },
  iconWrap: { marginBottom: 20 },
  title: { ...TYPE.title, fontSize: 22, textAlign: 'center', marginBottom: 12 },
  body: { ...TYPE.body, textAlign: 'center', marginBottom: 24, lineHeight: 22, color: COLORS.subtle },
  waitText: { fontSize: 13, color: COLORS.brand, fontFamily: 'Nunito-SemiBold' },
  detailsList: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailItem: { paddingVertical: 8 },
  detailLabel: { fontSize: 11, color: COLORS.subtle, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 15, fontFamily: 'Nunito-Bold', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.borderStrong, marginVertical: 4 },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#1C1C1E',
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { ...TYPE.bodyStrong, color: '#FFF', fontSize: 16 },
  secondaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { ...TYPE.body, color: COLORS.subtle, fontSize: 15 },
});
