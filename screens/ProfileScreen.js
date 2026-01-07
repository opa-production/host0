import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { uploadHostProfilePicture } from '../services/mediaService';
import { useHost } from '../utils/HostContext';
import { logoutHost } from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const { host, logout, refreshProfile, updateHost } = useHost();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadProfile = async () => {
        setIsRefreshing(true);
        await refreshProfile();
        setIsRefreshing(false);
      };
      loadProfile();
    }, [])
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to update your profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      
      try {
        if (!host?.id) {
          Alert.alert('Error', 'Unable to upload. Please try logging in again.');
          return;
        }

        const file = {
          uri: uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        };

        const uploadResult = await uploadHostProfilePicture(file, host.id.toString());
        if (uploadResult.success) {
          // Refresh profile from backend to get new avatar_url
          const refreshResult = await refreshProfile();
          if (refreshResult.success) {
            Alert.alert('Success', 'Profile picture updated successfully!');
          } else {
            // Upload succeeded but refresh failed - still show success
            Alert.alert('Success', 'Profile picture uploaded! Refresh the screen to see changes.');
          }
        } else {
          Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload profile picture');
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
      }
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    lightHaptic();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      // Call backend logout and clear storage
      await logoutHost();
      // Clear context
      await logout();
      // Navigate to landing
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if backend call fails
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('UpdateProfile', { hostData: host });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Floating Settings Button */}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card with Image and Details */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {host?.avatar_url ? (
              <Image 
                source={{ uri: host.avatar_url }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#999999" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={() => { lightHaptic(); pickImage(); }} activeOpacity={0.85}>
              <Ionicons name="camera" size={18} color="#111111" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{host?.full_name || 'Host User'}</Text>
            <Text style={styles.profileEmail}>{host?.email || ''}</Text>
            <Text style={styles.profilePhone}>{host?.phone || ''}</Text>
            {isRefreshing && (
              <ActivityIndicator size="small" color={COLORS.text} style={{ marginTop: 8 }} />
            )}
          </View>
        </View>

        {/* Account Information Link */}
        <View style={styles.section}>
          <View style={styles.sectionDivider} />
          
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => {
              lightHaptic();
              handleEditProfile();
            }}
          >
            <Ionicons name="person-outline" size={22} color="#666666" style={styles.linkIcon} />
            <Text style={styles.linkText}>Account Information</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        {/* All Links Section */}
        <View style={styles.section}>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>More</Text>
          
          <View style={styles.linkGroup}>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('Settings'); }}
            >
              <Ionicons name="settings-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Settings</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('AddPaymentMethod'); }}
            >
              <Ionicons name="card-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Add Payment Method</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('UploadDocs'); }}
            >
              <Ionicons name="document-text-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Upload Documents</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('SupaHost'); }}
            >
              <Ionicons name="ribbon-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Become a SupaHost</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('OpaClientDownload'); }}
            >
              <Ionicons name="download-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Download Opa Client</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => { lightHaptic(); navigation.navigate('Feedback'); }}
            >
              <Ionicons name="chatbox-ellipses-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Share Feedback</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      {showLogoutConfirm && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalBody}>You’ll need to sign in again to access your account.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalConfirm]} onPress={handleConfirmLogout}>
                <Text style={styles.modalConfirmText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  settingsButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.l,
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
    paddingVertical: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  profileName: {
    ...TYPE.title,
    fontSize: 17,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  profileEmail: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  profilePhone: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  section: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.l,
  },
  linkGroup: {
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  linkIcon: {
    marginRight: 16,
  },
  linkText: {
    flex: 1,
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginBottom: SPACING.s,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingVertical: 16,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    ...TYPE.subhead,
    color: '#FF3B30',
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  modalTitle: {
    ...TYPE.title,
    marginBottom: SPACING.s,
  },
  modalBody: {
    ...TYPE.body,
    color: COLORS.muted,
    marginBottom: SPACING.l,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.s,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: RADIUS.button,
  },
  modalCancel: {
    backgroundColor: '#F2F2F7',
  },
  modalCancelText: {
    ...TYPE.subhead,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  modalConfirmText: {
    ...TYPE.subhead,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  modalConfirm: {
    backgroundColor: '#007AFF',
  },
});
