import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { isBiometricEnabled, setupBiometric, disableBiometric, isBiometricAvailable } from '../utils/biometric';

// Simple Toggle Component
const Toggle = ({ value, onValueChange, disabled = false }) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
    thumbColor={value ? '#ffffff' : '#f4f3f4'}
  />
);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Load biometric preference on mount
  useEffect(() => {
    const loadBiometricPreference = async () => {
      const enabled = await isBiometricEnabled();
      setBiometricsEnabled(enabled);
      
      const availability = await isBiometricAvailable();
      setBiometricAvailable(availability.available);
    };
    
    loadBiometricPreference();
  }, []);

  // Handle biometric toggle
  const handleBiometricToggle = async (value) => {
    lightHaptic();
    
    if (value) {
      // User wants to enable biometrics - set up biometric authentication
      const availability = await isBiometricAvailable();
      
      if (!availability.available) {
        Alert.alert(
          'Biometric Unavailable',
          availability.error || 'Biometric authentication is not available on this device. Please ensure you have biometric credentials set up in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await setupBiometric();
      
      if (result.success) {
        setBiometricsEnabled(true);
        Alert.alert(
          'Biometric Enabled',
          'Biometric login has been enabled. You will be prompted to authenticate with your fingerprint or face ID on your next login.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Setup Failed',
          result.error || 'Failed to set up biometric authentication. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      // User wants to disable biometrics
      const result = await disableBiometric();
      if (result.success) {
        setBiometricsEnabled(false);
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to disable biometric authentication.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleCustomerSupport = () => {
    navigation.navigate('CustomerSupport');
  };

  const handlePrivacy = () => {
    navigation.navigate('Privacy');
  };

  const handleNotificationPreference = () => {
    navigation.navigate('NotificationPreferences');
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  const handleLegal = () => {
    navigation.navigate('Legal');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmText.toLowerCase() === 'delete') {
      // TODO: Implement account deletion
      console.log('Account deletion confirmed');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } else {
      Alert.alert('Invalid Confirmation', 'Please type "delete" exactly to confirm.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  const SettingItem = ({ icon, title, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={1}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color="#666666" />
        <Text style={styles.settingItemTitle}>{title}</Text>
      </View>
      <View style={styles.settingItemRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Account Section */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          <SettingItem
            icon="lock-closed-outline"
            title="Change Password"
            onPress={handleChangePassword}
          />
          <SettingItem
            icon="finger-print-outline"
            title="Biometric Login"
            onPress={null}
            showArrow={false}
            rightComponent={
              <Toggle
                value={biometricsEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricAvailable}
              />
            }
          />
          <SettingItem
            icon="notifications-outline"
            title="Notification Preferences"
            onPress={handleNotificationPreference}
          />
        </View>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* Support & Info Section */}
        <SectionHeader title="Support & Information" />
        <View style={styles.section}>
          <SettingItem
            icon="headset-outline"
            title="Customer Support"
            onPress={handleCustomerSupport}
          />
          <SettingItem
            icon="hand-left-outline"
            title="Privacy"
            onPress={handlePrivacy}
          />
          <SettingItem
            icon="information-circle-outline"
            title="About"
            onPress={handleAbout}
          />
          <SettingItem
            icon="document-text-outline"
            title="Legal"
            onPress={handleLegal}
          />
        </View>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* Danger Zone */}
        <SectionHeader title="Account Actions" />
        <View style={styles.section}>
          <SettingItem
            icon="trash-outline"
            title="Delete Account"
            onPress={handleDeleteAccount}
            rightComponent={
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            }
          />
        </View>

        {/* App Version Section */}
        {/* <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0 Beta</Text>
          <Text style={styles.versionDescription}>
            This app is currently under development. We are working to have all features up based on user feedback.
          </Text>
        </View> */}

        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={handleDeleteCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalMessage}>
                Type "delete" to confirm account deletion. This action cannot be undone.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Type 'delete' to confirm"
                placeholderTextColor="#999999"
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={handleDeleteCancel}
                  activeOpacity={1}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonDelete,
                    deleteConfirmText.toLowerCase() !== 'delete' && { opacity: 0.5 },
                  ]}
                  onPress={handleDeleteConfirm}
                  activeOpacity={1}
                  disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                >
                  <Text style={styles.modalButtonTextDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: SPACING.m,
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  sectionHeader: {
    ...TYPE.micro,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: SPACING.l,
    color: '#8E8E93',
  },
  section: {
    marginHorizontal: SPACING.l,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  sectionSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginHorizontal: SPACING.l,
    marginTop: 8,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingItemTitle: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemValue: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  versionSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 8,
    color: '#000000',
  },
  versionDescription: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    color: '#666666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  logoutIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#007AFF20',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
    color: '#000000',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    color: '#666666',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    marginBottom: 24,
    width: '100%',
    borderColor: '#e0e0e0',
    color: '#000000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtonLogout: {
    backgroundColor: '#007AFF',
  },
  modalButtonDelete: {
    backgroundColor: '#F44336',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#666666',
  },
  modalButtonTextLogout: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
  modalButtonTextDelete: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#ffffff',
  },
});

export default SettingsScreen;
