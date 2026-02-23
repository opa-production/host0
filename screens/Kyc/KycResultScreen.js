import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../../ui/tokens';
import { lightHaptic } from '../../ui/haptics';
import { getKycStatus } from '../../services/kycService';

const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS = 5;

function formatVerifiedAt(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return isoString;
  }
}

function getStatusDisplay(status) {
  if (!status) return { label: 'Processing…', color: '#8E8E93', icon: 'time-outline' };
  const s = (status.status || '').toLowerCase();
  if (s === 'approved' || s === 'verified') return { label: 'Verified', color: '#34C759', icon: 'checkmark-circle' };
  if (s === 'declined' || s === 'rejected') return { label: 'Declined', color: '#FF3B30', icon: 'close-circle' };
  if (s === 'resubmission_requested') return { label: 'Resubmission requested', color: '#FF9500', icon: 'refresh-circle' };
  return { label: status.status || 'Pending', color: '#FF9500', icon: 'hourglass-outline' };
}

export default function KycResultScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    const result = await getKycStatus();
    if (!result.success) {
      setError(result.error || 'Failed to load status');
      setLoading(false);
      return null;
    }
    setError(null);
    return result.status;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    const run = async (attempt) => {
      const data = await fetchStatus();
      if (cancelled) return;
      setStatus(data);
      setLoading(false);

      const s = (data?.status || '').toLowerCase();
      const isFinal = s === 'approved' || s === 'verified' || s === 'declined' || s === 'rejected';
      if (!isFinal && attempt < POLL_ATTEMPTS) {
        timeoutId = setTimeout(() => run(attempt + 1), POLL_INTERVAL_MS);
      }
    };

    run(0);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchStatus]);

  const handleBack = () => {
    lightHaptic();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  const display = getStatusDisplay(status);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.card}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Checking verification status…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name={display.icon} size={56} color={display.color} />
            </View>
            <Text style={[styles.title, { color: display.color }]}>{display.label}</Text>
            {status?.document_type && (
              <Text style={styles.detail}>Document: {status.document_type}</Text>
            )}
            {status?.verified_at && (
              <Text style={styles.detail}>Verified on {formatVerifiedAt(status.verified_at)}</Text>
            )}
            {status?.decision_reason && (status?.status || '').toLowerCase() !== 'approved' && (status?.status || '').toLowerCase() !== 'verified' && (
              <Text style={styles.detail}>Reason: {status.decision_reason}</Text>
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleBack}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Back to app</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingWrap: { alignItems: 'center', paddingVertical: SPACING.l },
  loadingText: { ...TYPE.body, marginTop: SPACING.m, color: COLORS.muted },
  errorWrap: { alignItems: 'center', paddingVertical: SPACING.l },
  errorText: { ...TYPE.body, marginTop: SPACING.m, color: COLORS.muted, textAlign: 'center' },
  iconWrap: { marginBottom: SPACING.m },
  title: { ...TYPE.title, fontSize: 22, marginBottom: SPACING.s },
  detail: { ...TYPE.body, fontSize: 14, color: COLORS.muted, marginTop: 4 },
  primaryButton: {
    height: 50,
    backgroundColor: '#1C1C1E',
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { ...TYPE.bodyStrong, color: '#FFF', fontSize: 16 },
});
