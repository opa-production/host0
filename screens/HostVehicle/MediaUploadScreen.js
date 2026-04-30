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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS } from '../../ui/tokens';
import {
  hostVehicleFormShared as HV,
  hostVehicleInputRuleColor,
  hostVehicleFormOutlineColor,
} from './formFieldStyles';
import { uploadVehicleImages, uploadVehicleVideo } from '../../services/mediaService';
import AppLoader from "../../ui/AppLoader";

export default function MediaUploadScreen({ formData, updateFormData, onNext, onBack, onSubmit, isSubmitting }) {
  const insets = useSafeAreaInsets();
  const [uploadingAssets, setUploadingAssets] = useState({}); // { uri: boolean }
  const [uploadErrors, setUploadErrors] = useState({}); // { uri: string }
  
  const isUploadingAny = Object.values(uploadingAssets).some(v => v === true);
  const isUploading = isSubmitting || isUploadingAny;

  const handleUpload = async (uri, type, isCover = false) => {
    if (!uri || !formData.carId) return;

    setUploadingAssets(prev => ({ ...prev, [uri]: true }));
    setUploadErrors(prev => ({ ...prev, [uri]: null }));

    try {
      if (type === 'image') {
        const result = await uploadVehicleImages([{
          uri: uri,
          name: isCover ? `cover_${formData.carId}.jpg` : `image_${formData.carId}_${Date.now()}.jpg`,
          type: 'image/jpeg',
        }], formData.carId);

        if (result.success && result.urls && result.urls.length > 0) {
          const uploadedUrl = result.urls[0];
          if (isCover) {
            updateFormData({ coverPhotoUrl: uploadedUrl });
          } else {
            const currentUrls = formData.imageUrls || [];
            // We need to match the uploaded URL with the local URI
            // Since we upload one by one here, it's the first one in result.urls
            // We should store a mapping or just append to imageUrls
            // To keep it simple and robust, let's store them in an object mapping uri -> url
            const newImageUrlsMap = { ...(formData.imageUrlsMap || {}), [uri]: uploadedUrl };
            updateFormData({ 
              imageUrlsMap: newImageUrlsMap,
              // Also keep the array for backward compatibility/simplicity in other screens
              imageUrls: Object.values(newImageUrlsMap) 
            });
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } else if (type === 'video') {
        const result = await uploadVehicleVideo({
          uri: uri,
          name: `video_${formData.carId}.mp4`,
          type: 'video/mp4',
        }, formData.carId);

        if (result.success && result.url) {
          updateFormData({ videoUrl: result.url });
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      }
    } catch (error) {
      console.error(`Upload error for ${type}:`, error);
      setUploadErrors(prev => ({ ...prev, [uri]: error.message }));
    } finally {
      setUploadingAssets(prev => ({ ...prev, [uri]: false }));
    }
  };

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
        const uri = result.assets[0].uri;
        updateFormData({ coverPhoto: uri });
        handleUpload(uri, 'image', true);
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
        
        // Trigger background uploads for new images
        newImages.forEach(uri => handleUpload(uri, 'image', false));
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
        videoMaxDuration: 30,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoAsset = result.assets[0];
        if (videoAsset.duration && videoAsset.duration > 30000) {
          Alert.alert('Video too long', 'Please select a video that is 30 seconds or less');
          return;
        }
        updateFormData({ video: videoAsset.uri });
        handleUpload(videoAsset.uri, 'video');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', `Failed to pick video: ${error.message}`);
    }
  };

  const removeImage = (index) => {
    const uriToRemove = formData.images[index];
    const newImages = formData.images.filter((_, i) => i !== index);
    
    // Also remove from imageUrlsMap if it exists
    const newImageUrlsMap = { ...(formData.imageUrlsMap || {}) };
    delete newImageUrlsMap[uriToRemove];
    
    updateFormData({ 
      images: newImages,
      imageUrlsMap: newImageUrlsMap,
      imageUrls: Object.values(newImageUrlsMap)
    });
  };

  const removeVideo = () => {
    updateFormData({ video: null, videoUrl: null });
  };

  const uploadedCount = formData.images.reduce(
    (n, uri) => n + (formData.imageUrlsMap?.[uri] ? 1 : 0), 0
  );

  const canProceed = () => {
    return formData.coverPhoto !== null && formData.images.length >= 4;
  };

  return (
    <ScrollView
      style={HV.scroll}
      contentContainerStyle={[HV.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={HV.formOutline}>
      {/* Cover Photo */}
      <View style={HV.inputSection}>
        <Text style={HV.fieldLabel}>Cover photo *</Text>
        <Text style={styles.hint}>This will be the main photo displayed in listings</Text>
        
        {formData.coverPhoto ? (
          <View style={styles.coverPhotoContainer}>
            <Image source={{ uri: formData.coverPhoto }} style={styles.coverPhoto} />
            {uploadingAssets[formData.coverPhoto] && (
              <View style={styles.overlayLoader}>
                <AppLoader size="small" color="#ffffff" />
              </View>
            )}
            {uploadErrors[formData.coverPhoto] && (
              <TouchableOpacity 
                style={styles.errorOverlay}
                onPress={() => handleUpload(formData.coverPhoto, 'image', true)}
              >
                <Ionicons name="refresh" size={24} color="#ffffff" />
                <Text style={styles.errorText}>Retry</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.removeCoverButton}
              onPress={() => updateFormData({ coverPhoto: null, coverPhotoUrl: null })}
              activeOpacity={1}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.brand} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addCoverButton}
            onPress={pickCoverPhoto}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={48} color={COLORS.subtle} />
            <Text style={styles.addCoverText}>Add Cover Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={HV.sectionDivider} />

      {/* Images */}
      <View style={HV.inputSection}>
        <View style={styles.labelRow}>
          <Text style={HV.fieldLabel}>Photos *</Text>
          <Text style={styles.counter}>
            {formData.images.length}/12 (min 4)
          </Text>
        </View>
        <Text style={styles.hint}>Add 4-12 additional photos of your car</Text>
        
        <View style={styles.imageGrid}>
          {formData.images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              {uploadingAssets[uri] && (
                <View style={styles.overlayLoader}>
                  <AppLoader size="small" color="#ffffff" />
                </View>
              )}
              {uploadErrors[uri] && (
                <TouchableOpacity 
                  style={styles.errorOverlay}
                  onPress={() => handleUpload(uri, 'image', false)}
                >
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
                activeOpacity={1}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.brand} />
              </TouchableOpacity>
            </View>
          ))}
          
          {formData.images.length < 12 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImages}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={32} color={COLORS.subtle} />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={HV.sectionDivider} />

      {/* Video */}
      <View style={HV.inputSection}>
        <Text style={HV.fieldLabel}>Video</Text>
        <Text style={styles.hint}>Optional (up to 30 seconds)</Text>
        
        {formData.video ? (
          <View style={styles.videoContainer}>
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={48} color={COLORS.subtle} />
              {uploadingAssets[formData.video] ? (
                <View style={styles.videoUploadStatus}>
                  <AppLoader size="small" color={COLORS.brand} />
                  <Text style={styles.videoText}>Uploading...</Text>
                </View>
              ) : uploadErrors[formData.video] ? (
                <TouchableOpacity 
                  style={styles.videoUploadStatus}
                  onPress={() => handleUpload(formData.video, 'video')}
                >
                  <Ionicons name="refresh" size={20} color={COLORS.error} />
                  <Text style={[styles.videoText, { color: COLORS.error }]}>Retry Upload</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.videoText}>Video Selected & Uploaded</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeVideoButton}
              onPress={removeVideo}
              activeOpacity={1}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.brand} />
              <Text style={styles.removeVideoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addVideoButton}
            onPress={pickVideo}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-outline" size={32} color={COLORS.subtle} />
            <Text style={styles.addVideoText}>Add Video</Text>
          </TouchableOpacity>
        )}
      </View>

        <View style={[HV.formActions, styles.buttonRow]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            <Ionicons name="arrow-back" size={20} color={isSubmitting ? COLORS.subtle : COLORS.text} />
            <Text style={[styles.backButtonText, isSubmitting && styles.buttonDisabledText]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, (!canProceed() || isSubmitting) && styles.nextButtonDisabled]}
            onPress={onSubmit || onNext}
            disabled={!canProceed() || isSubmitting}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <>
                <AppLoader size="small" color="#ffffff" style={styles.nextSpinner} />
                <Text style={styles.nextButtonText}>Processing…</Text>
              </>
            ) : (
              <Text style={styles.nextButtonText}>
                {isUploadingAny
                  ? `Next  (${uploadedCount}/${formData.images.length} saved)`
                  : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  counter: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.muted,
    marginBottom: 12,
  },
  coverPhotoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.card - 4,
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
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: hostVehicleFormOutlineColor,
    borderStyle: 'dashed',
    borderRadius: RADIUS.card - 4,
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
    borderRadius: RADIUS.card - 4,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hostVehicleInputRuleColor,
    borderStyle: 'dashed',
    borderRadius: RADIUS.card - 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    marginTop: 4,
  },
  videoContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: hostVehicleInputRuleColor,
    paddingTop: 16,
    backgroundColor: 'transparent',
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: hostVehicleInputRuleColor,
  },
  removeVideoText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.brand,
    marginLeft: 6,
  },
  addVideoButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    borderStyle: 'dashed',
    borderRadius: RADIUS.card - 4,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hostVehicleInputRuleColor,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  nextSpinner: {
    marginRight: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  buttonDisabledText: {
    color: COLORS.subtle,
  },
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.card - 4,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.card - 4,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    marginTop: 4,
  },
  videoUploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
});

