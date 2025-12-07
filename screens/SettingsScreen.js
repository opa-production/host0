import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Simple Toggle Component
const Toggle = ({ value, onValueChange, disabled = false }) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#e0e0e0', true: '#FF1577' }}
    thumbColor={value ? '#ffffff' : '#f4f3f4'}
  />
);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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

  const handleLanguage = () => {
    navigation.navigate('Language', {
      currentLanguage: selectedLanguage,
      onLanguageSelect: (language) => {
        setSelectedLanguage(language);
      },
    });
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

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    // TODO: Implement logout logic
    navigation.replace('Landing');
  };

  const SettingItem = ({ icon, title, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Back Button */}
      <TouchableOpacity 
        style={styles.floatingBackButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.backButtonCircle}>
          <Ionicons name="arrow-back" size={20} color="#000000" />
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

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
                onValueChange={setBiometricsEnabled}
              />
            }
          />
        </View>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        <View style={styles.section}>
          <SettingItem
            icon="notifications-outline"
            title="Notification Preferences"
            onPress={handleNotificationPreference}
          />
          <SettingItem
            icon="language-outline"
            title="Language"
            onPress={handleLanguage}
            rightComponent={
              <Text style={styles.settingItemValue}>{selectedLanguage}</Text>
            }
          />
        </View>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* Support & Info Section */}
        <SectionHeader title="Support & Information" />
        <View style={styles.section}>
          <SettingItem
            icon="help-circle-outline"
            title="Customer Support"
            onPress={handleCustomerSupport}
          />
          <SettingItem
            icon="shield-checkmark-outline"
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

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF1577" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* App Version Section */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0 Beta</Text>
          <Text style={styles.versionDescription}>
            This app is currently under development. We are working to have all features up based on user feedback.
          </Text>
        </View>

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.logoutIconCircle}>
                <Ionicons name="log-out-outline" size={64} color="#FF1577" />
              </View>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to log out? You'll need to sign in again to access your account.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowLogoutModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonLogout]}
                  onPress={handleConfirmLogout}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextLogout}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Account Modal */}
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalButtonDelete,
                    deleteConfirmText.toLowerCase() !== 'delete' && { opacity: 0.5 }
                  ]}
                  onPress={handleDeleteConfirm}
                  activeOpacity={0.7}
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
    backgroundColor: '#ffffff',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 24,
    color: '#999999',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  sectionSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingItemTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemValue: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginHorizontal: 24,
    gap: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF1577',
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
    backgroundColor: '#FF157720',
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
    backgroundColor: '#FF1577',
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
