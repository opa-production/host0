import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { uploadHostDocument } from '../services/mediaService';
import { useHost } from '../utils/HostContext';
import AppLoader from "../ui/AppLoader";

export default function UploadDocsScreen({ navigation: nav }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useHost();
  const [docType, setDocType] = useState('id');
  const [idFrontImage, setIdFrontImage] = useState(null);
  const [dlImage, setDlImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload documents.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Handle image picker
  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        if (docType === 'id') {
          setIdFrontImage(result.assets[0].uri);
        } else {
          setDlImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const handleSave = async () => {
    if (docType === 'id' && !idFrontImage) {
      Alert.alert('Missing Image', 'Please upload ID front picture before saving.');
      return;
    }

    if (docType === 'dl' && !dlImage) {
      Alert.alert('Missing Image', 'Please upload Driver\'s License picture before saving.');
      return;
    }

    setUploading(true);
    try {
      const file = {
        uri: docType === 'id' ? idFrontImage : dlImage,
        name: docType === 'id' ? 'id_front.jpg' : 'drivers_license.jpg',
        type: 'image/jpeg',
      };

      console.log('Starting document upload...', { documentType: docType, fileUri: file.uri });
      const documentType = docType === 'id' ? 'id' : 'license';
      const result = await uploadHostDocument(file, documentType);

      if (result.success) {
        // Refresh profile to get updated document URLs
        console.log('Upload successful, refreshing profile...');
        await refreshProfile();
        Alert.alert('Success', `${docType === 'id' ? 'ID' : 'Driver\'s License'} uploaded successfully!`);
      } else {
        console.error('Upload failed:', result.error);
        Alert.alert(
          'Upload Failed', 
          result.error || 'Failed to upload document. Please check:\n• Backend is running\n• Network connection\n• File is valid'
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Error',
        `${error.message || 'Failed to upload document'}\n\nPlease check:\n• Backend server is running\n• Network connection\n• Device and server are on the same network`
      );
    } finally {
      setUploading(false);
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    if (docType === 'id') {
      setIdFrontImage(null);
    } else {
      setDlImage(null);
    }
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
            nav.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Documents</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Upload your identification documents</Text>

        {/* Document Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleOption, docType === 'id' && styles.toggleOptionActive]}
            onPress={() => setDocType('id')}
            activeOpacity={1}
          >
            <Ionicons 
              name="card-outline" 
              size={20} 
              color={docType === 'id' ? '#ffffff' : '#666666'} 
            />
            <Text style={[styles.toggleText, docType === 'id' && styles.toggleTextActive]}>
              ID Front
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleOption, docType === 'dl' && styles.toggleOptionActive]}
            onPress={() => setDocType('dl')}
            activeOpacity={1}
          >
            <Ionicons 
              name="document-outline" 
              size={20} 
              color={docType === 'dl' ? '#ffffff' : '#666666'} 
            />
            <Text style={[styles.toggleText, docType === 'dl' && styles.toggleTextActive]}>
              Driver's License
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          {docType === 'id' ? (
            <>
              <Text style={styles.sectionTitle}>ID Front Picture</Text>
              {idFrontImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: idFrontImage }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveImage}
                    activeOpacity={1}
                  >
                    <Ionicons name="close-circle" size={32} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                  activeOpacity={1}
                >
                  <Ionicons name="camera-outline" size={48} color="#666666" />
                  <Text style={styles.uploadButtonText}>Tap to upload ID front picture</Text>
                  <Text style={styles.uploadButtonSubtext}>JPG, PNG up to 5MB</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Driver's License Picture</Text>
              {dlImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: dlImage }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveImage}
                    activeOpacity={1}
                  >
                    <Ionicons name="close-circle" size={32} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                  activeOpacity={1}
                >
                  <Ionicons name="camera-outline" size={48} color="#666666" />
                  <Text style={styles.uploadButtonText}>Tap to upload Driver's License</Text>
                  <Text style={styles.uploadButtonSubtext}>JPG, PNG up to 5MB</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              ((docType === 'id' && !idFrontImage) || (docType === 'dl' && !dlImage)) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            activeOpacity={1}
            disabled={(docType === 'id' && !idFrontImage) || (docType === 'dl' && !dlImage)}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Upload Status</Text>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name={idFrontImage ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={idFrontImage ? "#4CAF50" : "#cccccc"} 
            />
            <Text style={[styles.statusText, idFrontImage && styles.statusTextCompleted]}>
              ID Front Picture {idFrontImage ? 'Uploaded' : 'Pending'}
            </Text>
          </View>

          <View style={styles.statusItem}>
            <Ionicons 
              name={dlImage ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={dlImage ? "#4CAF50" : "#cccccc"} 
            />
            <Text style={[styles.statusText, dlImage && styles.statusTextCompleted]}>
              Driver's License {dlImage ? 'Uploaded' : 'Pending'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  subtitle: {
    ...TYPE.body,
    fontSize: 13,
    color: COLORS.subtle,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 3,
    marginBottom: SPACING.l,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    alignSelf: 'center',
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    gap: 8,
  },
  toggleOptionActive: {
    backgroundColor: '#000000',
  },
  toggleText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  uploadSection: {
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    ...TYPE.section,
    fontSize: 15,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  uploadButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 13,
    color: '#1C1C1E',
  },
  uploadButtonSubtext: {
    ...TYPE.caption,
    fontSize: 12,
    color: '#8E8E93',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f8f8',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  saveButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  statusSection: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  statusTextCompleted: {
    color: '#4CAF50',
    fontFamily: 'Nunito-SemiBold',
  },
});

