import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout pressed');
    // navigation.replace('Landing');
  };

  const handleEditProfile = () => {
    navigation.navigate('UpdateProfile', { userData });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Settings Button */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <View style={styles.settingsButtonCircle}>
          <Ionicons name="settings-outline" size={22} color="#000000" />
        </View>
      </TouchableOpacity>

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

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => navigation.navigate('OpaClientDownload')}
          >
            <Ionicons name="download-outline" size={22} color="#666666" style={styles.linkIcon} />
            <Text style={styles.linkText}>Download Opa Client</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => navigation.navigate('SupaHost')}
          >
            <Ionicons name="star-outline" size={22} color="#666666" style={styles.linkIcon} />
            <Text style={styles.linkText}>Become a SupaHost</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => navigation.navigate('Feedback')}
          >
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#666666" style={styles.linkIcon} />
            <Text style={styles.linkText}>Share Feedback</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
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
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  editButton: {
    padding: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkIcon: {
    marginRight: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
});
