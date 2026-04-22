import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import {
  addMpesaPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
} from '../services/paymentService';
import { formatPhoneNumber } from '../utils/phoneUtils';
import StatusModal from '../ui/StatusModal';
import { addPaymentMethodScreenCache } from '../utils/screenDataCache';

export default function AddPaymentMethodScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [savedMethods, setSavedMethods] = useState(() =>
    addPaymentMethodScreenCache.savedMethods.length > 0
      ? addPaymentMethodScreenCache.savedMethods.map((m) => ({ ...m }))
      : []
  );

  // Show the form immediately only when there are no saved methods yet
  const [showForm, setShowForm] = useState(
    () => addPaymentMethodScreenCache.savedMethods.length === 0
  );

  const [mpesaForm, setMpesaForm] = useState({ name: '', mobileNumber: '', isDefault: false });
  const [mpesaErrors, setMpesaErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(
    () => !addPaymentMethodScreenCache.loadedOnce && addPaymentMethodScreenCache.savedMethods.length === 0
  );
  const fetchGenRef = useRef(0);
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });

  const formatMobileNumber = (text) => text.replace(/\D/g, '').slice(0, 15);

  const validateMpesaForm = () => {
    const errors = {};
    if (!mpesaForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (mpesaForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!mpesaForm.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else {
      const cleaned = mpesaForm.mobileNumber.replace(/\D/g, '');
      if (cleaned.length < 9 || cleaned.length > 15) {
        errors.mobileNumber = 'M-Pesa number must be between 9 and 15 digits';
      }
    }
    setMpesaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMpesaSubmit = async () => {
    if (!validateMpesaForm()) return;
    setIsSubmitting(true);
    lightHaptic();
    try {
      const result = await addMpesaPaymentMethod(
        mpesaForm.name.trim(),
        mpesaForm.mobileNumber.replace(/\D/g, ''),
        mpesaForm.isDefault
      );
      if (result.success) {
        setMpesaForm({ name: '', mobileNumber: '', isDefault: false });
        setMpesaErrors({});
        setShowForm(false);
        await loadPaymentMethods({ silent: true });
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Payment method added',
          message: 'M-Pesa payment method added successfully.',
          onClose: () => navigation.goBack(),
        });
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Failed to add',
          message: result.error || 'Failed to add M-Pesa payment method. Please try again.',
        });
      }
    } catch {
      setStatusModal({ visible: true, type: 'error', title: 'Error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPaymentMethods = useCallback(async ({ silent = false } = {}) => {
    const gen = ++fetchGenRef.current;
    const hadCache = addPaymentMethodScreenCache.savedMethods.length > 0;
    if (!silent && !addPaymentMethodScreenCache.loadedOnce && !hadCache) {
      setIsLoadingMethods(true);
    }
    try {
      const result = await getPaymentMethods();
      if (gen !== fetchGenRef.current) return;
      if (result.success) {
        let methods = [];
        if (Array.isArray(result.data)) {
          methods = result.data[0] && Array.isArray(result.data[0].payment_methods)
            ? result.data[0].payment_methods
            : result.data;
        } else if (result.data && Array.isArray(result.data.payment_methods)) {
          methods = result.data.payment_methods;
        }
        const transformed = methods
          .map((method, index) => {
            const methodType = method.method_type?.toLowerCase() || method.type?.toLowerCase();
            if (methodType === 'mpesa' || method.mpesa_number) {
              return {
                id: method.id,
                idString: method.id?.toString() || `mpesa-${index}`,
                type: 'mpesa',
                name: method.name || '',
                mobileNumber: method.mpesa_number || method.mobile_number || method.phone_number || '',
                logo: require('../assets/images/mpesa.png'),
                isDefault: method.is_default || false,
              };
            }
            return null;
          })
          .filter(Boolean);
        addPaymentMethodScreenCache.savedMethods = transformed;
        addPaymentMethodScreenCache.loadedOnce = true;
        setSavedMethods(transformed);
        // Auto-hide form once methods are loaded
        if (transformed.length > 0) setShowForm(false);
      }
    } catch {
      // silent
    } finally {
      if (gen === fetchGenRef.current) setIsLoadingMethods(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPaymentMethods({ silent: addPaymentMethodScreenCache.loadedOnce });
    }, [loadPaymentMethods])
  );

  const handleRemoveMethod = async (id) => {
    lightHaptic();
    setStatusModal({
      visible: true,
      type: 'info',
      title: 'Delete payment method',
      message: 'Are you sure you want to delete this payment method?',
      primaryLabel: 'Delete',
      onPrimary: async () => {
        try {
          const result = await deletePaymentMethod(id);
          if (result.success) {
            await loadPaymentMethods({ silent: true });
            setStatusModal((prev) => ({ ...prev, visible: false }));
          } else {
            setStatusModal({ visible: true, type: 'error', title: 'Delete failed', message: result.error || 'Failed to delete.' });
          }
        } catch {
          setStatusModal({ visible: true, type: 'error', title: 'Error', message: 'An unexpected error occurred.' });
        }
      },
      secondaryLabel: 'Cancel',
      onSecondary: () => setStatusModal((prev) => ({ ...prev, visible: false })),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { lightHaptic(); navigation.goBack(); }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment methods</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoadingMethods && savedMethods.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.text} />
          </View>
        ) : (
          <>
            {/* Saved methods list */}
            {savedMethods.length > 0 && (
              <View style={styles.savedSection}>
                {savedMethods.map((method) => (
                  <View key={method.idString} style={styles.savedCard}>
                    <View style={styles.savedCardLeft}>
                      <Image source={method.logo} style={styles.savedLogo} resizeMode="contain" />
                      <View>
                        <Text style={styles.savedName}>{method.name}</Text>
                        <Text style={styles.savedDetail}>
                          {method.mobileNumber ? formatPhoneNumber(method.mobileNumber) : 'M-Pesa'}
                          {method.isDefault ? '  ·  Default' : ''}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveMethod(method.id)} activeOpacity={1} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add another button — only visible when form is hidden */}
                {!showForm && (
                  <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={() => { lightHaptic(); setShowForm(true); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={18} color={COLORS.text} />
                    <Text style={styles.addMoreText}>Add payment method</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Form — shown when no saved methods or user tapped Add */}
            {(showForm || savedMethods.length === 0) && (
              <View style={styles.formCard}>
                <View style={styles.formRow}>
                  <Text style={styles.label}>Name on Account</Text>
                  <TextInput
                    style={[styles.formInput, mpesaErrors.name && styles.inputError]}
                    placeholder="Enter full name"
                    placeholderTextColor="#999999"
                    value={mpesaForm.name}
                    onChangeText={(text) => {
                      setMpesaForm({ ...mpesaForm, name: text });
                      if (mpesaErrors.name) setMpesaErrors({ ...mpesaErrors, name: '' });
                    }}
                    autoCapitalize="words"
                  />
                  {mpesaErrors.name ? <Text style={styles.errorText}>{mpesaErrors.name}</Text> : null}
                </View>

                <View style={styles.divider} />

                <View style={styles.formRow}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <TextInput
                    style={[styles.formInput, mpesaErrors.mobileNumber && styles.inputError]}
                    placeholder="07XX XXX XXX or 2547XX XXX XXX"
                    placeholderTextColor="#999999"
                    value={mpesaForm.mobileNumber}
                    onChangeText={(text) => {
                      setMpesaForm({ ...mpesaForm, mobileNumber: formatMobileNumber(text) });
                      if (mpesaErrors.mobileNumber) setMpesaErrors({ ...mpesaErrors, mobileNumber: '' });
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                  {mpesaErrors.mobileNumber ? <Text style={styles.errorText}>{mpesaErrors.mobileNumber}</Text> : null}
                </View>

                <View style={styles.divider} />

                <View style={styles.formRow}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Text style={styles.toggleLabel}>Set as default</Text>
                      <Text style={styles.toggleHint}>Used for withdrawals by default</Text>
                    </View>
                    <Switch
                      value={mpesaForm.isDefault}
                      onValueChange={(value) => setMpesaForm({ ...mpesaForm, isDefault: value })}
                      trackColor={{ false: '#E5E5EA', true: COLORS.text }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.formRow}>
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleMpesaSubmit}
                    activeOpacity={0.9}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Add M-Pesa</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type || 'success'}
        title={statusModal.title}
        message={statusModal.message}
        primaryLabel={statusModal.primaryLabel || 'OK'}
        secondaryLabel={statusModal.secondaryLabel}
        onPrimary={() => {
          if (statusModal.onPrimary) statusModal.onPrimary();
          else if (statusModal.onClose) statusModal.onClose();
          setStatusModal((prev) => ({ ...prev, visible: false, onPrimary: undefined, onClose: undefined, onSecondary: undefined }));
        }}
        onSecondary={statusModal.onSecondary}
        onRequestClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
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
    gap: 16,
  },
  loadingWrap: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  savedSection: {
    gap: 10,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    padding: SPACING.m,
  },
  savedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  savedLogo: {
    width: 56,
    height: 18,
  },
  savedName: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  savedDetail: {
    ...TYPE.caption,
    fontSize: 13,
    color: COLORS.subtle,
  },
  deleteBtn: {
    padding: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.borderVisible,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  addMoreText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
  },
  formRow: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderStrong,
  },
  label: {
    ...TYPE.micro,
    color: '#8E8E93',
    marginBottom: 6,
  },
  formInput: {
    width: '100%',
    height: 44,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    paddingHorizontal: 0,
  },
  inputError: {
    borderBottomWidth: 1,
    borderBottomColor: '#FF3B30',
  },
  errorText: {
    ...TYPE.caption,
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 3,
  },
  toggleHint: {
    ...TYPE.caption,
    fontSize: 12,
    color: COLORS.subtle,
  },
  submitButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: 'Nunito-Bold',
  },
});
