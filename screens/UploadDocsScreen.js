import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function UploadDocsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [docType, setDocType] = useState('id'); // 'id' or 'dl'
  const [idFrontImage, setIdFrontImage] = useState(null);
  const [dlImage, setDlImage] = useState(null);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // Handle save
  const handleSave = () => {
    if (docType === 'id' && !idFrontImage) {
      Alert.alert('Missing Image', 'Please upload ID front picture before saving.');
      return;
    }

    if (docType === 'dl' && !dlImage) {
      Alert.alert('Missing Image', 'Please upload Driver\'s License picture before saving.');
      return;
    }

    // TODO: Save to API
    if (docType === 'id') {
      console.log('Saving ID front image:', idFrontImage);
      Alert.alert('Success', 'ID front picture saved successfully!');
    } else {
      console.log('Saving DL image:', dlImage);
      Alert.alert('Success', 'Driver\'s License picture saved successfully!');
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={1}
      >
        <Ionicons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Documents</Text>
          <Text style={styles.subtitle}>Upload your identification documents</Text>
        </View>

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
                    <Ionicons name="close-circle" size={32} color="#FF1577" />
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
                    <Ionicons name="close-circle" size={32} color="#FF1577" />
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
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleOptionActive: {
    backgroundColor: '#FF1577',
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#666666',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  uploadSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
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
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  uploadButtonSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
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
    backgroundColor: '#FF1577',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#FF1577',
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

