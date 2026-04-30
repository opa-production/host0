import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../../ui/tokens';
import { lightHaptic } from '../../ui/haptics';
import { lookupKycDetails, initializeKycWidget, getKycStatus } from '../../services/kycService';
import AppLoader from "../../ui/AppLoader";
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safely import Dojah only if not in Expo Go (though imports are static, we handle usage)
let Dojah;
if (!isExpoGo) {
  try {
    Dojah = require('dojah-kyc-sdk-react-expo').default;
  } catch (e) {
    console.warn('Dojah SDK not found or native module missing');
  }
}

const ID_TYPES = [
  { label: 'National ID', value: 'NATIONAL_ID' },
  { label: 'Passport', value: 'PASSPORT' },
  { label: 'Driver\'s License', value: 'DRIVERS_LICENSE' },
];

export default function KycIntroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [statusLoading, setStatusLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  
  // Step 1: Lookup State
  const [step, setStep] = useState(1); // 1: Lookup, 2: Review/Initialize, 3: Dojah
  const [idType, setIdType] = useState('NATIONAL_ID');
  const [idNumber, setIdNumber] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupData, setLookupData] = useState(null);
  
  // Step 2: Widget State
  const [widgetCreds, setWidgetCreds] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await getKycStatus();
      if (cancelled) return;
      setStatusLoading(false);
      if (result.success && result.status != null) {
        const status = result.status.status;
        if (status === 'approved' || status === 'verified') {
          setKycStatus(result.status);
        } else if (status === 'pending') {
          navigation.replace('KycResult');
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [navigation]);

  const handleLookup = async () => {
    if (!idNumber.trim()) {
      Alert.alert('Required', 'Please enter your ID number');
      return;
    }
    
    lightHaptic();
    setIsLookingUp(true);
    try {
      const result = await lookupKycDetails(idType, idNumber);
      if (result.success) {
        setLookupData(result.data);
        setStep(2);
      } else {
        Alert.alert('Lookup Failed', result.error || 'Could not verify ID details. Please check the number and type.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred during lookup.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleStartVerification = async () => {
    lightHaptic();
    setIsInitializing(true);
    try {
      const result = await initializeKycWidget();
      if (result.success) {
        setWidgetCreds(result.data);
        setStep(3);
      } else {
        Alert.alert('Error', result.error || 'Could not initialize verification.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not start verification. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDojahSuccess = (data) => {
    console.log('Dojah Success:', data);
    navigation.replace('KycResult');
  };

  const handleDojahError = (error) => {
    console.error('Dojah Error:', error);
    Alert.alert('Verification Error', 'The verification process encountered an error. Please try again.');
    setStep(2);
  };

  const renderContent = () => {
    if (statusLoading) {
      return (
        <View style={styles.loadingWrap}>
          <AppLoader size="large" color={COLORS.brand} />
          <Text style={styles.loadingText}>Checking verification status…</Text>
        </View>
      );
    }

    if (kycStatus) {
      return (
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={48} color="#34C759" />
          </View>
          <Text style={[styles.title, { color: '#34C759' }]}>You're verified</Text>
          <Text style={styles.body}>
            Your identity has been verified. You don't need to verify again.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { lightHaptic(); navigation.navigate('KycResult'); }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>View verification details</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="id-card-outline" size={40} color={COLORS.brand} />
          </View>
          <Text style={styles.title}>ID Lookup</Text>
          <Text style={styles.body}>
            Enter your ID details to verify your identity with government records.
          </Text>

          <Text style={styles.inputLabel}>ID Type</Text>
          <View style={styles.idTypeContainer}>
            {ID_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.idTypeOption, idType === type.value && styles.idTypeOptionActive]}
                onPress={() => setIdType(type.value)}
              >
                <Text style={[styles.idTypeText, idType === type.value && styles.idTypeTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>ID Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter ID number"
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="default"
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLookup}
            activeOpacity={0.85}
            disabled={isLookingUp}
          >
            {isLookingUp ? (
              <AppLoader size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Verify ID</Text>
                <Ionicons name="search-outline" size={18} color="#FFF" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="person-circle-outline" size={48} color={COLORS.brand} />
          </View>
          <Text style={styles.title}>Review Details</Text>
          <Text style={styles.body}>
            Government records found the following details. Please review them before proceeding.
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{lookupData?.verified_name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>{lookupData?.date_of_birth}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{lookupData?.gender}</Text>
            </View>
          </View>

          <Text style={styles.infoNote}>
            Verified by government database.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartVerification}
            activeOpacity={0.85}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <AppLoader size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Continue to Face Match</Text>
                <Ionicons name="camera-outline" size={18} color="#FFF" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(1)}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 3 && widgetCreds) {
      if (isExpoGo) {
        return (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="construct-outline" size={48} color={COLORS.brand} />
            </View>
            <Text style={styles.title}>Native Build Required</Text>
            <Text style={styles.body}>
              The Face Match verification uses a native Dojah SDK which is not supported in Expo Go.
            </Text>
            <Text style={[styles.body, { color: COLORS.subtle, fontSize: 13 }]}>
              To test this specific step, please use the Ardena Host Development Build.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setStep(2)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <Dojah
          appId={widgetCreds.app_id}
          pKey={widgetCreds.p_key}
          type="custom"
          config={{
            widget_id: widgetCreds.widget_id,
            reference_id: widgetCreds.reference_id,
            metadata: { platform: 'mobile_host' },
          }}
          onSuccess={handleDojahSuccess}
          onError={handleDojahError}
          onClose={() => setStep(2)}
        />
      );
    }

    return null;
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
        <Text style={styles.headerTitle}>Host Verification</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
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
  inputLabel: { ...TYPE.bodyStrong, fontSize: 14, marginBottom: 8, color: COLORS.text },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    marginBottom: 20,
    color: COLORS.text,
  },
  idTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  idTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  idTypeOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: COLORS.brand,
  },
  idTypeText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.subtle,
  },
  idTypeTextActive: {
    color: COLORS.brand,
  },
  detailsContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.subtle,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderStrong,
    marginVertical: 4,
  },
  infoNote: {
    fontSize: 12,
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Nunito-SemiBold',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#1C1C1E',
    borderRadius: RADIUS.button,
  },
  primaryButtonText: { ...TYPE.bodyStrong, color: '#FFF', fontSize: 16 },
  secondaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { ...TYPE.body, color: COLORS.subtle, fontSize: 15 },
  buttonIcon: { marginLeft: 6 },
  loadingWrap: { alignItems: 'center', paddingVertical: SPACING.l },
  loadingText: { ...TYPE.body, marginTop: SPACING.m, color: COLORS.muted },
});
