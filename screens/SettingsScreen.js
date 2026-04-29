import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, StatusBar, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import {
  isBiometricEnabled,
  setupBiometric,
  disableBiometric,
  isBiometricAvailable,
  getBiometricDeviceToken,
  clearBiometricDeviceToken,
} from '../utils/biometric';
import StatusModal from '../ui/StatusModal';
import { useHost } from '../utils/HostContext';
import { revokeHostBiometrics } from '../services/authService';
import AppLoader from "../ui/AppLoader";

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
  const { logout } = useHost();
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricSuccessVisible, setBiometricSuccessVisible] = useState(false);
  const [biometricError, setBiometricError] = useState(null);

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
        setBiometricError(
          availability.error ||
            'Biometric authentication is not available on this device. Please ensure you have biometric credentials set up in your device settings.'
        );
        return;
      }

      const result = await setupBiometric();
      
      if (result.success) {
        setBiometricsEnabled(true);
        setBiometricSuccessVisible(true);
        setBiometricError(null);
      } else {
        setBiometricError(result.error || 'Failed to set up biometric authentication. Please try again.');
      }
    } else {
      // User wants to disable biometrics
      try {
        const deviceToken = await getBiometricDeviceToken();
        const revokeResult = await revokeHostBiometrics(deviceToken || undefined);

        if (!revokeResult.success) {
          setBiometricError(
            revokeResult.error || 'Failed to disable biometric authentication on the server.'
          );
          return;
        }

        const localResult = await disableBiometric();
        await clearBiometricDeviceToken();

        if (localResult.success) {
          setBiometricsEnabled(false);
        } else {
          setBiometricError(localResult.error || 'Failed to disable biometric authentication.');
        }
      } catch (error) {
        setBiometricError(error?.message || 'Failed to disable biometric authentication.');
      }
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
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
    lightHaptic();
    navigation.navigate('DeleteAccount');
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
      </ScrollView>

      {/* Biometric success modal */}
      <StatusModal
        visible={biometricSuccessVisible}
        type="success"
        title="Biometric enabled"
        message="Biometric login has been enabled. You’ll be able to use your fingerprint or face ID the next time you sign in."
        primaryLabel="Got it"
        onPrimary={() => setBiometricSuccessVisible(false)}
      />

      {/* Biometric error modal */}
      <StatusModal
        visible={!!biometricError}
        type="error"
        title="Biometric issue"
        message={biometricError}
        primaryLabel="OK"
        onPrimary={() => setBiometricError(null)}
      />
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
});

export default SettingsScreen;
