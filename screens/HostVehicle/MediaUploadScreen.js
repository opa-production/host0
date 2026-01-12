import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING } from '../../ui/tokens';
import { uploadVehicleImages, uploadVehicleVideo } from '../../services/mediaService';

export default function MediaUploadScreen({ formData, updateFormData, onNext, onBack, onSubmit }) {
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);

  const pickCoverPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateFormData({ coverPhoto: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
      Alert.alert('Error', `Failed to pick cover photo: ${error.message}`);
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const remainingSlots = 12 - formData.images.length;
      if (remainingSlots <= 0) {
        Alert.alert('Limit reached', 'You can only add up to 12 images');
        return;
      }

      const options = {
        mediaTypes: ['images'],
        quality: 0.8,
      };

      if (remainingSlots > 1) {
        options.allowsMultipleSelection = true;
        options.selectionLimit = remainingSlots;
      }

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const updatedImages = [...formData.images, ...newImages].slice(0, 12);
        updateFormData({ images: updatedImages });
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', `Failed to pick images: ${error.message}`);
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 15,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoAsset = result.assets[0];
        if (videoAsset.duration && videoAsset.duration > 15000) {
          Alert.alert('Video too long', 'Please select a video that is 15 seconds or less');
          return;
        }
        updateFormData({ video: videoAsset.uri });
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', `Failed to pick video: ${error.message}`);
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData({ images: newImages });
  };

  const removeVideo = () => {
    updateFormData({ video: null });
  };

  const canProceed = () => {
    return (
      formData.coverPhoto !== null &&
      formData.coverPhoto !== undefined &&
      formData.coverPhoto !== '' &&
      formData.images.length >= 4
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover Photo */}
      <View style={styles.section}>
        <Text style={styles.label}>Cover Photo *</Text>
        <Text style={styles.hint}>This will be the main photo displayed in listings</Text>
        
        {formData.coverPhoto ? (
          <View style={styles.coverPhotoContainer}>
            <Image source={{ uri: formData.coverPhoto }} style={styles.coverPhoto} />
            <TouchableOpacity
              style={styles.removeCoverButton}
              onPress={() => updateFormData({ coverPhoto: null })}
              activeOpacity={1}
            >
              <Ionicons name="close-circle" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addCoverButton}
            onPress={pickCoverPhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={48} color="#666666" />
            <Text style={styles.addCoverText}>Add Cover Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Images */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Photos *</Text>
          <Text style={styles.counter}>
            {formData.images.length}/12 (min 4)
          </Text>
        </View>
        <Text style={styles.hint}>Add 4-12 additional photos of your car</Text>
        
        <View style={styles.imageGrid}>
          {formData.images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
                activeOpacity={1}
              >
                <Ionicons name="close-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ))}
          
          {formData.images.length < 12 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImages}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={32} color="#666666" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Video */}
      <View style={styles.section}>
        <Text style={styles.label}>Video</Text>
        <Text style={styles.hint}>Optional (up to 15 seconds)</Text>
        
        {formData.video ? (
          <View style={styles.videoContainer}>
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={48} color="#666666" />
              <Text style={styles.videoText}>Video Selected</Text>
            </View>
            <TouchableOpacity
              style={styles.removeVideoButton}
              onPress={removeVideo}
              activeOpacity={1}
            >
              <Ionicons name="trash-outline" size={20} color="#007AFF" />
              <Text style={styles.removeVideoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addVideoButton}
            onPress={pickVideo}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-outline" size={32} color="#666666" />
            <Text style={styles.addVideoText}>Add Video</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.9}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={onSubmit || onNext}
          disabled={!canProceed()}
          activeOpacity={0.9}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.l,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counter: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#8E8E93',
    marginBottom: 12,
  },
  coverPhotoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  removeCoverButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  addCoverButton: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  addCoverText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    marginTop: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  addImageButton: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    marginTop: 4,
  },
  videoContainer: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.bg,
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  videoText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    marginTop: 8,
  },
  removeVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderStrong,
  },
  removeVideoText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#007AFF',
    marginLeft: 6,
  },
  addVideoButton: {
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  addVideoText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  nextButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 18,
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
});

