import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import StatusModal from '../ui/StatusModal';
import { useHost } from '../utils/HostContext';
import { updateHostProfile } from '../services/authService';

export default function UpdateProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { host, updateHost } = useHost();
  
  // Get initial data from route params (hostData) or fall back to context
  const initialData = route?.params?.hostData || host || {};

  const [formData, setFormData] = useState({
    name: initialData.name || initialData.full_name || '',
    email: initialData.email || '',
    bio: initialData.bio || '',
    mobile_number: initialData.mobile_number || '',
    id_number: initialData.id_number || '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });

  const initiallyComplete =
    !!(initialData.bio && initialData.bio.trim()) &&
    !!(initialData.mobile_number && initialData.mobile_number.trim()) &&
    !!(initialData.id_number && initialData.id_number.trim());

  const showSaveButton = !initiallyComplete && !savedSuccessfully;

  // Validate form (all fields are optional but validate format if provided)
  const validateForm = () => {
    const newErrors = {};

    // Bio validation: max 200 characters (per API requirement)
    if (formData.bio && formData.bio.length > 200) {
      newErrors.bio = 'Bio must not exceed 200 characters';
    }

    if (formData.mobile_number) {
      const num = formData.mobile_number.trim();
      if (num.length !== 10) {
        newErrors.mobile_number = 'Mobile number must be 10 digits';
      } else if (!/^0[17]/.test(num)) {
        newErrors.mobile_number = 'Mobile number must start with 01 or 07';
      }
    }

    if (formData.id_number) {
      const stripped = formData.id_number.trim();
      if (!/^\d+$/.test(stripped)) {
        newErrors.id_number = 'ID number must contain only digits';
      } else if (stripped.length < 7 || stripped.length > 8) {
        newErrors.id_number = 'ID number must be 7 or 8 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Validation error',
        message: 'Please correct the errors before saving.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data - only send fields that are allowed by the API
      // API accepts: bio (optional, max 200), mobile_number (optional, max 14), id_number (optional)
      const updateData = {};
      
      // Send bio if provided (can be empty string to clear it)
      if (formData.bio !== undefined && formData.bio !== null) {
        updateData.bio = formData.bio.trim();
      }
      
      // Send mobile_number if provided
      if (formData.mobile_number !== undefined && formData.mobile_number !== null) {
        updateData.mobile_number = formData.mobile_number.trim();
      }
      
      // Send id_number if provided
      if (formData.id_number !== undefined && formData.id_number !== null) {
        updateData.id_number = formData.id_number.trim();
      }

      // Call backend API
      const result = await updateHostProfile(updateData);

      if (result.success) {
        await updateHost(result.host);
        setSavedSuccessfully(true);
        setStatusModal({
          visible: true,
          type: 'success',
          title: 'Profile updated',
          message: 'Your profile details have been saved.',
          onClose: () => navigation.goBack(),
        });
      } else {
        setStatusModal({
          visible: true,
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Failed to update profile. Please try again.',
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setStatusModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text style={styles.headerTitle}>Update Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Name Display (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.readOnlyText}>{formData.name || 'Not set'}</Text>
            <Text style={styles.readOnlyHint}>Name cannot be changed here</Text>
          </View>

          <View style={styles.divider} />

          {/* Email Display (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.readOnlyText}>{formData.email || 'Not set'}</Text>
            <Text style={styles.readOnlyHint}>Email cannot be changed here</Text>
          </View>

          <View style={styles.divider} />

          {/* Bio Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            {!showSaveButton ? (
              <Text style={styles.readOnlyText}>{formData.bio || 'Not set'}</Text>
            ) : (
              <>
                <TextInput
                  style={[styles.textArea, errors.bio && styles.inputError]}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor="#999999"
                  value={formData.bio}
                  onChangeText={(text) => {
                    setFormData({ ...formData, bio: text });
                    if (errors.bio) {
                      setErrors({ ...errors, bio: '' });
                    }
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={styles.characterCount}>{formData.bio.length}/200 characters</Text>
                {errors.bio && (
                  <Text style={styles.errorText}>{errors.bio}</Text>
                )}
              </>
            )}
          </View>

          <View style={styles.divider} />

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            {!showSaveButton ? (
              <Text style={styles.readOnlyText}>{formData.mobile_number || 'Not set'}</Text>
            ) : (
              <>
                <TextInput
                  style={[styles.input, errors.mobile_number && styles.inputError]}
                  placeholder="07XXXXXXXX"
                  placeholderTextColor="#999999"
                  value={formData.mobile_number}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
                    setFormData({ ...formData, mobile_number: digits });
                    if (errors.mobile_number) {
                      setErrors({ ...errors, mobile_number: '' });
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                {errors.mobile_number && (
                  <Text style={styles.errorText}>{errors.mobile_number}</Text>
                )}
              </>
            )}
          </View>

          <View style={styles.divider} />

          {/* ID Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID Number</Text>
            {!showSaveButton ? (
              <Text style={styles.readOnlyText}>{formData.id_number || 'Not set'}</Text>
            ) : (
              <>
                <TextInput
                  style={[styles.input, errors.id_number && styles.inputError]}
                  placeholder="Enter your ID number"
                  placeholderTextColor="#999999"
                  value={formData.id_number}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '').slice(0, 8);
                    setFormData({ ...formData, id_number: digits });
                    if (errors.id_number) {
                      setErrors({ ...errors, id_number: '' });
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={8}
                />
                {errors.id_number ? (
                  <Text style={styles.errorText}>{errors.id_number}</Text>
                ) : null}
              </>
            )}
          </View>
        </View>

        {showSaveButton && (
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type || 'success'}
        title={statusModal.title}
        message={statusModal.message}
        primaryLabel="OK"
        onPrimary={() => {
          setStatusModal((prev) => ({ ...prev, visible: false }));
          if (statusModal.onClose) {
            statusModal.onClose();
          }
        }}
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
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.l,
  },
  inputGroup: {
    paddingVertical: 4,
  },
  label: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 44,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...TYPE.body,
    fontSize: 15,
    color: '#1C1C1E',
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1E',
    marginVertical: SPACING.m,
  },
  textArea: {
    width: '100%',
    minHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    ...TYPE.body,
    fontSize: 14,
    color: '#1C1C1E',
    textAlignVertical: 'top',
  },
  characterCount: {
    ...TYPE.caption,
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    ...TYPE.caption,
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
  },
  saveButton: {
    width: '100%',
    height: 46,
    backgroundColor: '#000000',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  readOnlyText: {
    ...TYPE.body,
    fontSize: 15,
    color: '#1C1C1E',
    marginTop: 4,
  },
  readOnlyHint: {
    ...TYPE.caption,
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
});

