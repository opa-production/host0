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

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Dojah;
if (!isExpoGo) {
  try {
    Dojah = require('dojah-kyc-sdk-react-expo').default;
  } catch (e) {
    console.warn('Dojah SDK missing');
  }
}

const ID_TYPES = [
  { label: 'National ID', value: 'NATIONAL_ID' },
  { label: 'Passport', value: 'PASSPORT' },
];

export default function KycIntroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [statusLoading, setStatusLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  
  const [step, setStep] = useState(1); // 1: Select Type, 2: Enter Number, 3: Review, 4: Dojah
  const [idType, setIdType] = useState(null);
  const [idNumber, setIdNumber] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupData, setLookupData] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [widgetCreds, setWidgetCreds] = useState(null);

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
    if (!idNumber.trim()) return;
    lightHaptic();
    setIsLookingUp(true);
    try {
      const result = await lookupKycDetails(idType, idNumber);
      if (result.success) {
        setLookupData(result.data);
        setStep(3);
      } else {
        Alert.alert('Verification', result.error || 'Could not verify details.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
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
        setStep(4);
      } else {
        Alert.alert('Error', result.error || 'Could not initialize.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not start verification.');
    } finally {
      setIsInitializing(false);
    }
  };

  const renderContent = () => {
    if (statusLoading) return <View style={styles.center}><AppLoader size="small" color={COLORS.brand} /></View>;

    if (kycStatus) {
      return (
        <View style={styles.minimalContent}>
          <Text style={styles.titleSmall}>Verification Complete</Text>
          <Text style={styles.subtitleSmall}>Your identity is verified. You're all set to host!</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('KycResult')}>
            <Text style={styles.primaryButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={styles.minimalContent}>
          <Text style={styles.stepLabel}>Document Type</Text>
          <Text style={styles.stepHeading}>Choose your ID</Text>

          <View style={styles.listContainer}>
            {ID_TYPES.map((type, index) => (
              <React.Fragment key={type.value}>
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => {
                    lightHaptic();
                    setIdType(type.value);
                    setStep(2);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.circle, idType === type.value && styles.circleActive]}>
                    {idType === type.value && <View style={styles.circleInner} />}
                  </View>
                  <Text style={[styles.listLabel, idType === type.value && styles.listLabelActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
                {index === 0 && <View style={styles.listDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.minimalContent}>
          <Text style={styles.stepLabel}>{idType === 'NATIONAL_ID' ? 'National ID' : 'Passport'}</Text>
          <Text style={styles.stepHeading}>Enter your number</Text>

          <TextInput
            style={styles.minimalInput}
            placeholder="ID number"
            placeholderTextColor={COLORS.borderVisible}
            value={idNumber}
            onChangeText={setIdNumber}
            autoFocus
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.primaryButton, !idNumber.trim() && styles.primaryButtonDisabled]}
            onPress={handleLookup}
            disabled={isLookingUp || !idNumber.trim()}
          >
            {isLookingUp ? <AppLoader size="small" color="#FFF" /> : <Text style={styles.primaryButtonText}>Look up</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep(1)} style={styles.textLink}>
            <Text style={styles.textLinkText}>Change document type</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 3) {
      return (
        <View style={styles.minimalContent}>
          <Text style={styles.titleSmall}>Confirm Identity</Text>
          <Text style={styles.subtitleSmall}>Review the details found in records</Text>

          <View style={styles.reviewList}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Full Name</Text>
              <Text style={styles.reviewValue}>{lookupData?.verified_name}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Date of Birth</Text>
              <Text style={styles.reviewValue}>{lookupData?.date_of_birth}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartVerification} disabled={isInitializing}>
            {isInitializing ? <AppLoader size="small" color="#FFF" /> : <Text style={styles.primaryButtonText}>Proceed to Face Match</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setStep(2)} style={styles.textLink}>
            <Text style={[styles.textLinkText, { color: COLORS.danger }]}>This is not me</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 4 && widgetCreds) {
      if (isExpoGo) {
        return (
          <View style={styles.minimalContent}>
            <Text style={styles.titleSmall}>Native Build Required</Text>
            <Text style={styles.subtitleSmall}>Face Match requires a development build to run the Dojah SDK.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
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
          config={{ widget_id: widgetCreds.widget_id, reference_id: widgetCreds.reference_id }}
          onSuccess={() => navigation.replace('KycResult')}
          onError={() => setStep(3)}
          onClose={() => setStep(3)}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>{renderContent()}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.l, alignItems: 'flex-end' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.l, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  minimalContent: { paddingTop: 10 },
  stepLabel: { ...TYPE.micro, fontSize: 11, color: COLORS.subtle, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  stepHeading: { ...TYPE.body, fontSize: 15, color: COLORS.text, marginBottom: 32 },
  titleSmall: { ...TYPE.section, fontSize: 18, color: COLORS.text, marginBottom: 4 },
  subtitleSmall: { ...TYPE.body, fontSize: 14, color: COLORS.subtle, marginBottom: 32 },
  listContainer: { marginTop: 4 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 20 },
  listLabel: { ...TYPE.body, fontSize: 15, color: COLORS.text },
  listLabelActive: { fontFamily: 'Nunito-SemiBold', color: COLORS.text },
  listDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.18)' },
  circle: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.borderVisible, alignItems: 'center', justifyContent: 'center' },
  circleActive: { borderColor: COLORS.text, backgroundColor: COLORS.text },
  circleInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  minimalInput: { ...TYPE.bodyStrong, fontSize: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.2)', paddingVertical: 14, marginBottom: 44, color: COLORS.text },
  primaryButton: { backgroundColor: COLORS.text, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryButtonDisabled: { opacity: 0.3 },
  primaryButtonText: { ...TYPE.bodyStrong, color: '#FFF', fontSize: 15 },
  textLink: { marginTop: 24, alignItems: 'center' },
  textLinkText: { ...TYPE.caption, color: COLORS.subtle, textDecorationLine: 'underline' },
  reviewList: { marginBottom: 32, gap: 16 },
  reviewItem: { backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12 },
  reviewLabel: { ...TYPE.micro, color: COLORS.subtle, marginBottom: 4, textTransform: 'uppercase' },
  reviewValue: { ...TYPE.bodyStrong, fontSize: 15, color: COLORS.text },
});
