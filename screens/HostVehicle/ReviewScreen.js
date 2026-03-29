import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../ui/tokens';

export default function ReviewScreen({ formData, onBack, onSubmit }) {
  const insets = useSafeAreaInsets();

  const ReviewSection = ({ title, children }) => (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const ReviewItem = ({ label, value }) => (
    <View style={styles.reviewItem}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || 'Not specified'}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Listing area */}
      {formData.hostCityName ? (
        <ReviewSection title="Your listing area">
          <ReviewItem label="City" value={formData.hostCityName} />
        </ReviewSection>
      ) : null}

      {/* Basic Info */}
      <ReviewSection title="Basic Information">
        <ReviewItem label="Car Name" value={formData.name} />
        <ReviewItem label="Model" value={formData.model} />
        <ReviewItem label="Body Type" value={formData.body} />
        <ReviewItem label="Year" value={formData.year} />
        <ReviewItem label="Description" value={formData.description} />
      </ReviewSection>

      {/* Media */}
      <ReviewSection title="Media">
        {formData.coverPhoto && (
          <View style={styles.coverPhotoPreview}>
            <Text style={styles.reviewLabel}>Cover Photo</Text>
            <Image source={{ uri: formData.coverPhoto }} style={styles.coverPreviewImage} />
          </View>
        )}
        <View style={styles.imagesPreview}>
          <Text style={styles.reviewLabel}>Photos ({formData.images.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {formData.images.slice(0, 6).map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.previewImage} />
            ))}
            {formData.images.length > 6 && (
              <View style={styles.moreImages}>
                <Text style={styles.moreImagesText}>+{formData.images.length - 6}</Text>
              </View>
            )}
          </ScrollView>
        </View>
        {formData.video && (
          <View style={styles.videoPreview}>
            <Ionicons name="videocam" size={20} color="#666666" />
            <Text style={styles.reviewValue}>Video uploaded</Text>
          </View>
        )}
      </ReviewSection>

      {/* Specifications */}
      <ReviewSection title="Specifications">
        <ReviewItem label="Seats" value={formData.seats} />
        <ReviewItem label="Fuel Type" value={formData.fuelType} />
        <ReviewItem label="Transmission" value={formData.transmission} />
        <ReviewItem label="Colour" value={formData.colour} />
        {formData.mileage && (
          <ReviewItem label="Mileage" value={`${formData.mileage} km`} />
        )}
        {formData.features && formData.features.length > 0 && (
          <View style={styles.featuresList}>
            <Text style={styles.reviewLabel}>Features</Text>
            <View style={styles.featuresContainer}>
              {formData.features.map((feature, index) => (
                <View key={index} style={styles.featureTag}>
                  <Text style={styles.featureTagText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ReviewSection>

      {/* Rental Info */}
      <ReviewSection title="Rental Information">
        <ReviewItem label="Price per Day" value={`KSh ${formData.pricePerDay}`} />
        {formData.pricePerWeek && (
          <ReviewItem label="Price per Week" value={`KSh ${formData.pricePerWeek}`} />
        )}
        {formData.pricePerMonth && (
          <ReviewItem label="Price per Month" value={`KSh ${formData.pricePerMonth}`} />
        )}
        <ReviewItem label="Minimum Rental Days" value={formData.minimumRentalDays} />
        {formData.maxRentalDays && (
          <ReviewItem label="Maximum Rental Days" value={formData.maxRentalDays} />
        )}
        <ReviewItem label="Pickup Location" value={formData.pickupLocation} />
        {formData.pickupLat && formData.pickupLong && (
          <ReviewItem 
            label="Coordinates" 
            value={`${formData.pickupLat.toFixed(6)}, ${formData.pickupLong.toFixed(6)}`} 
          />
        )}
        <ReviewItem label="Age Restriction" value={formData.ageRestriction} />
        {formData.carRules && Array.isArray(formData.carRules) && formData.carRules.length > 0 && (
          <View style={styles.rulesList}>
            <Text style={styles.reviewLabel}>Car Rules</Text>
            <View style={styles.rulesContainer}>
              {formData.carRules.map((rule, index) => (
                <View key={index} style={styles.ruleTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.ruleTagText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ReviewSection>

      {/* Verification Note */}
      <View style={styles.verificationNote}>
        <Ionicons name="information-circle" size={20} color="#FF9500" />
        <View style={styles.verificationNoteContent}>
          <Text style={styles.verificationNoteTitle}>Verification Required</Text>
          <Text style={styles.verificationNoteText}>
            Ardena verifies all cars in person before they go live. After listing your car, our team will contact you to schedule a quick verification visit.
          </Text>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.9}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={onSubmit} activeOpacity={0.9}>
          <Text style={styles.submitButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    padding: SPACING.l,
  },
  reviewSection: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderStrong,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  reviewItem: {
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  imagesPreview: {
    marginTop: 12,
  },
  imageScroll: {
    marginTop: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: COLORS.border,
  },
  moreImages: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreImagesText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: COLORS.subtle,
  },
  coverPhotoPreview: {
    marginBottom: 16,
  },
  coverPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: COLORS.border,
  },
  videoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  featuresList: {
    marginTop: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  featureTag: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureTagText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countriesList: {
    marginTop: 12,
  },
  countriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  countryTag: {
    backgroundColor: '#007AFF15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  countryTagText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#007AFF',
  },
  rulesList: {
    marginTop: 12,
  },
  rulesContainer: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  ruleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  ruleTagText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
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
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 18,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
  verificationNote: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  verificationNoteContent: {
    flex: 1,
  },
  verificationNoteTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#E65100',
    marginBottom: 6,
  },
  verificationNoteText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: '#BF360C',
    lineHeight: 18,
  },
});

