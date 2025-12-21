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
      {/* Basic Info */}
      <ReviewSection title="Basic Information">
        <ReviewItem label="Car Name" value={formData.name} />
        <ReviewItem label="Model" value={formData.model} />
        <ReviewItem label="Description" value={formData.description} />
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
        {formData.customPrice && (
          <ReviewItem
            label={formData.customPriceLabel || 'Custom Price'}
            value={`KSh ${formData.customPrice}`}
          />
        )}
        <ReviewItem label="Minimum Rental Days" value={formData.minimumRentalDays} />
        <ReviewItem label="Pickup Location" value={formData.pickupLocation} />
        <ReviewItem label="Age Restriction" value={formData.ageRestriction} />
        {formData.carRules && (
          <ReviewItem label="Car Rules" value={formData.carRules} />
        )}
        <View style={styles.switchItem}>
          <Text style={styles.reviewLabel}>Cross Country Travel</Text>
          <View style={styles.switchValue}>
            <Ionicons
              name={formData.crossCountryAllowed ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={formData.crossCountryAllowed ? '#4CAF50' : '#F44336'}
            />
            <Text
              style={[
                styles.reviewValue,
                { color: formData.crossCountryAllowed ? '#4CAF50' : '#F44336' },
              ]}
            >
              {formData.crossCountryAllowed ? 'Allowed' : 'Not Allowed'}
            </Text>
          </View>
        </View>
        {formData.crossCountryAllowed &&
          formData.allowedCountries &&
          formData.allowedCountries.length > 0 && (
            <View style={styles.countriesList}>
              <Text style={styles.reviewLabel}>Allowed Countries</Text>
              <View style={styles.countriesContainer}>
                {formData.allowedCountries.map((country, index) => (
                  <View key={index} style={styles.countryTag}>
                    <Text style={styles.countryTagText}>{country}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
      </ReviewSection>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={1}>
          <Ionicons name="arrow-back" size={20} color="#000000" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={onSubmit} activeOpacity={1}>
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text style={styles.submitButtonText}>List Car</Text>
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
    backgroundColor: '#FF157715',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: '#FF1577',
  },
  countryTagText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#FF1577',
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
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 18,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: COLORS.text,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF1577',
    borderRadius: 12,
    padding: 18,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#ffffff',
  },
});

