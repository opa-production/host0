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
  const [uploading, setUploading] = useState(false);
  const isUploading = isSubmitting || uploading;

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
            <TouchableOpacity
              style={styles.removeCoverButton}
              onPress={() => updateFormData({ coverPhoto: null })}
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
              <Text style={styles.videoText}>Video Selected</Text>
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
            disabled={isUploading}
            activeOpacity={0.9}
          >
            <Ionicons name="arrow-back" size={20} color={isUploading ? COLORS.subtle : COLORS.text} />
            <Text style={[styles.backButtonText, isUploading && styles.buttonDisabledText]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, (!canProceed() || isUploading) && styles.nextButtonDisabled]}
            onPress={onSubmit || onNext}
            disabled={!canProceed() || isUploading}
            activeOpacity={0.9}
          >
            {isUploading ? (
              <>
                <AppLoader size="small" color="#ffffff" style={styles.nextSpinner} />
                <Text style={styles.nextButtonText}>Uploading…</Text>
              </>
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
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
});

