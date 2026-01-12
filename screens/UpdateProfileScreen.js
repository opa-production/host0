import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
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

  // Validate form (all fields are optional but validate format if provided)
  const validateForm = () => {
    const newErrors = {};

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.bio && formData.bio.length > 2000) {
      newErrors.bio = 'Bio must not exceed 2000 characters';
    }

    if (formData.mobile_number && formData.mobile_number.replace(/\D/g, '').length < 10) {
      newErrors.mobile_number = 'Please enter a valid phone number';
    }

    if (formData.id_number && formData.id_number.trim().length < 5) {
      newErrors.id_number = 'ID number must be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors before saving.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data - only send non-empty fields
      const updateData = {};
      if (formData.name?.trim()) updateData.name = formData.name.trim();
      if (formData.email?.trim()) updateData.email = formData.email.trim();
      if (formData.bio?.trim()) updateData.bio = formData.bio.trim();
      if (formData.mobile_number?.trim()) updateData.mobile_number = formData.mobile_number.trim();
      if (formData.id_number?.trim()) updateData.id_number = formData.id_number.trim();

      // Call backend API
      const result = await updateHostProfile(updateData);

      if (result.success) {
        // Update context with new profile data
        await updateHost(result.host);
        
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Update Failed', result.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor="#999999"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              autoCapitalize="words"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email address"
              placeholderTextColor="#999999"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Bio Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
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
              maxLength={2000}
            />
            <Text style={styles.characterCount}>{formData.bio.length}/2000 characters</Text>
            {errors.bio && (
              <Text style={styles.errorText}>{errors.bio}</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={[styles.input, errors.mobile_number && styles.inputError]}
              placeholder="Enter your mobile number"
              placeholderTextColor="#999999"
              value={formData.mobile_number}
              onChangeText={(text) => {
                setFormData({ ...formData, mobile_number: text });
                if (errors.mobile_number) {
                  setErrors({ ...errors, mobile_number: '' });
                }
              }}
              keyboardType="phone-pad"
            />
            {errors.mobile_number && (
              <Text style={styles.errorText}>{errors.mobile_number}</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* ID Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ID Number</Text>
            <TextInput
              style={[styles.input, errors.id_number && styles.inputError]}
              placeholder="Enter your ID number"
              placeholderTextColor="#999999"
              value={formData.id_number}
              onChangeText={(text) => {
                setFormData({ ...formData, id_number: text });
                if (errors.id_number) {
                  setErrors({ ...errors, id_number: '' });
                }
              }}
              keyboardType="default"
            />
            {errors.id_number && (
              <Text style={styles.errorText}>{errors.id_number}</Text>
            )}
          </View>
        </View>

        {/* Save Button */}
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
      </ScrollView>
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
});

