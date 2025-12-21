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
import { COLORS, SPACING } from '../../ui/tokens';

export default function BasicInfoMediaScreen({ formData, updateFormData, onNext }) {
  const insets = useSafeAreaInsets();

  const pickImages = async () => {
    try {
      console.log('pickImages called');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      };

      // Try multiple selection if supported
      if (remainingSlots > 1) {
        options.allowsMultipleSelection = true;
        options.selectionLimit = remainingSlots;
      }

      console.log('Launching image picker with options:', options);
      const result = await ImagePicker.launchImageLibraryAsync(options);
      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const updatedImages = [...formData.images, ...newImages].slice(0, 12);
        updateFormData({ images: updatedImages });
        console.log('Images updated, total:', updatedImages.length);
      } else {
        console.log('Image selection was canceled');
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', `Failed to pick images: ${error.message}`);
    }
  };

  const pickVideo = async () => {
    try {
      console.log('pickVideo called');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      console.log('Launching video picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 15,
        quality: 0.8,
      });

      console.log('Video picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoAsset = result.assets[0];
        // Check video duration
        if (videoAsset.duration && videoAsset.duration > 15000) {
          Alert.alert('Video too long', 'Please select a video that is 15 seconds or less');
          return;
        }
        updateFormData({ video: videoAsset.uri });
        console.log('Video selected:', videoAsset.uri);
      } else {
        console.log('Video selection was canceled');
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
      formData.name.trim() !== '' &&
      formData.model.trim() !== '' &&
      formData.images.length >= 4 &&
      formData.description.trim() !== ''
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Car Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Car Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., BMW M3"
          value={formData.name}
          onChangeText={(text) => updateFormData({ name: text })}
          placeholderTextColor="#999999"
        />
      </View>

      {/* Model */}
      <View style={styles.section}>
        <Text style={styles.label}>Model *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 2023 G80"
          value={formData.model}
          onChangeText={(text) => updateFormData({ model: text })}
          placeholderTextColor="#999999"
        />
      </View>

      {/* Images */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Photos *</Text>
          <Text style={styles.counter}>
            {formData.images.length}/12 (min 4)
          </Text>
        </View>
        <Text style={styles.hint}>Add 4-12 photos of your car</Text>
        
        <View style={styles.imageGrid}>
          {formData.images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
                activeOpacity={1}
              >
                <Ionicons name="close-circle" size={24} color="#FF1577" />
              </TouchableOpacity>
            </View>
          ))}
          
          {formData.images.length < 12 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={() => {
                console.log('Add image button pressed');
                pickImages();
              }}
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
              <Ionicons name="trash-outline" size={20} color="#FF1577" />
              <Text style={styles.removeVideoText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addVideoButton}
            onPress={() => {
              console.log('Add video button pressed');
              pickVideo();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-outline" size={32} color="#666666" />
            <Text style={styles.addVideoText}>Add Video</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your car, its features, condition, etc."
          value={formData.description}
          onChangeText={(text) => updateFormData({ description: text })}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholderTextColor="#999999"
        />
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
        onPress={onNext}
        disabled={!canProceed()}
        activeOpacity={1}
      >
        <Text style={styles.nextButtonText}>Next: Specifications</Text>
        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
      </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
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
    color: '#FF1577',
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF1577',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
    gap: 8,
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

