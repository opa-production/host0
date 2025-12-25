import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, StatusBar, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const validateForm = () => {
    const newErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = () => {
    if (validateForm()) {
      // TODO: Make API call to change password
      setShowSuccessModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to login
    navigation.replace('Landing');
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.infoText}>
              Your new password must be at least 8 characters long and different from your current password.
            </Text>
          </View>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#999999"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (errors.currentPassword) {
                    setErrors(prev => ({ ...prev, currentPassword: null }));
                  }
                }}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#999999"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) {
                    setErrors(prev => ({ ...prev, newPassword: null }));
                  }
                }}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#999999"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: null }));
                  }
                }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.changePasswordButtonText}>Change Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.successModalTitle}>Password Changed!</Text>
            <Text style={styles.successModalMessage}>
              Your password has been changed successfully. Please login again with your new password.
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.successModalButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.m,
    borderRadius: RADIUS.card,
    marginBottom: 24,
    backgroundColor: '#FFF3F8',
    gap: 12,
  },
  infoText: {
    flex: 1,
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 20,
    color: '#8E8E93',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    ...TYPE.bodyStrong,
    fontSize: 12,
    marginBottom: 8,
    color: '#8E8E93',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  input: {
    flex: 1,
    ...TYPE.body,
    fontSize: 14,
    color: '#1C1C1E',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    ...TYPE.caption,
    fontSize: 11,
    color: '#F44336',
    marginTop: 4,
  },
  changePasswordButton: {
    backgroundColor: '#000000',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  changePasswordButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  successModalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#4CAF5020',
  },
  successModalTitle: {
    ...TYPE.title,
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
    color: '#1C1C1E',
  },
  successModalMessage: {
    ...TYPE.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    color: '#8E8E93',
  },
  successModalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default ChangePasswordScreen;
