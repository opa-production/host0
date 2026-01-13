import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { getUserToken } from '../utils/userStorage';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

const MAX_FEEDBACK_LENGTH = 250;

export default function FeedbackScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert('Feedback needed', 'Please enter your feedback before submitting.');
      return;
    }

    if (feedback.trim().length > MAX_FEEDBACK_LENGTH) {
      Alert.alert('Feedback too long', `Feedback must be ${MAX_FEEDBACK_LENGTH} characters or less.`);
      return;
    }

    setIsSubmitting(true);
    lightHaptic();

    try {
      const token = await getUserToken();
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to submit feedback.');
        setIsSubmitting(false);
        return;
      }

      const url = getApiUrl(API_ENDPOINTS.HOST_FEEDBACK);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: feedback.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to submit feedback';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      Alert.alert('Thank you!', 'Your feedback has been submitted successfully.', [
        {
          text: 'OK',
          onPress: () => {
            setFeedback('');
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Feedback submission error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit feedback. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            lightHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Feedback</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <Text style={styles.subtitle}>Tell us what we can improve or what you love.</Text>
          </View>

        <View style={styles.card}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Your feedback</Text>
            <Text style={[
              styles.characterCount,
              feedback.length > MAX_FEEDBACK_LENGTH && styles.characterCountError
            ]}>
              {feedback.length}/{MAX_FEEDBACK_LENGTH}
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Type your thoughts..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={6}
            value={feedback}
            onChangeText={setFeedback}
            maxLength={MAX_FEEDBACK_LENGTH}
            editable={!isSubmitting}
          />

          <TouchableOpacity 
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]} 
            onPress={submitFeedback} 
            activeOpacity={0.9}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.l,
  },
  scrollContent: {
    paddingTop: SPACING.m,
  },
  headerSection: {
    marginBottom: SPACING.m,
  },
  subtitle: {
    ...TYPE.body,
    fontSize: 13,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    ...TYPE.micro,
    color: '#8E8E93',
  },
  characterCount: {
    ...TYPE.micro,
    color: '#8E8E93',
    fontSize: 11,
  },
  characterCountError: {
    color: '#FF3B30',
  },
  textArea: {
    minHeight: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.card,
    padding: 12,
    ...TYPE.body,
    fontSize: 14,
    color: '#1C1C1E',
    textAlignVertical: 'top',
    backgroundColor: COLORS.surface,
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 48,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
