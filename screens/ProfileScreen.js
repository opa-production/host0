import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function ProfileScreen({ navigation }) {
  // TODO: Replace with actual user data
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    idNumber: '1234567890',
    profileImage: null, // Will be replaced with actual image
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to update your profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setUserData((prev) => ({ ...prev, profileImage: uri }));
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  const handleEditProfile = () => {
    navigation.navigate('UpdateProfile', { userData });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Floating Settings Button */}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Section - Profile Image, Name, Email */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {userData.profileImage ? (
              <Image 
                source={{ uri: userData.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#999999" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage} activeOpacity={0.85}>
              <Ionicons name="camera" size={18} color="#111111" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{userData.name}</Text>
          <Text style={styles.profileEmail}>{userData.email}</Text>
        </View>

        {/* Personal Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity 
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#666666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{userData.phone}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={20} color="#666666" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ID Number</Text>
              <Text style={styles.infoValue}>{userData.idNumber}</Text>
            </View>
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.linkGroup}>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Settings</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => navigation.navigate('Finance')}
            >
              <Ionicons name="wallet-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Finances</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => navigation.navigate('AddPaymentMethod')}
            >
              <Ionicons name="card-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Add Payment Method</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => navigation.navigate('UploadDocs')}
            >
              <Ionicons name="document-text-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Upload Documents</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hosting</Text>
          
          <View style={styles.linkGroup}>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => navigation.navigate('SupaHost')}
            >
              <Ionicons name="ribbon-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Become a SupaHost</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => navigation.navigate('OpaClientDownload')}
            >
              <Ionicons name="download-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Download Opa Client</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.linkGroup}>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => navigation.navigate('Feedback')}
            >
              <Ionicons name="chatbox-ellipses-outline" size={22} color="#666666" style={styles.linkIcon} />
              <Text style={styles.linkText}>Share Feedback</Text>
              <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={22} color="#FF1577" style={styles.linkIcon} />
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
    paddingTop: 70,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.l,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 20,
    color: '#1C1C1E',
    marginBottom: 6,
  },
  profileEmail: {
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
  },
  editButton: {
    padding: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...TYPE.micro,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    borderBottomColor: '#E5E5EA',
  },
  logoutText: {
    ...TYPE.subhead,
    color: '#FF1577',
    fontFamily: 'Nunito-Bold',
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
  modalConfirm: {
    backgroundColor: COLORS.brand,
  },
  modalCancelText: {
    ...TYPE.subhead,
    color: COLORS.text,
  },
  modalConfirmText: {
    ...TYPE.subhead,
    color: '#FFFFFF',
  },
});
