import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';

export default function FeedbackScreen({ navigation }) {
  const [feedback, setFeedback] = useState('');

  const submitFeedback = () => {
    if (!feedback.trim()) {
      Alert.alert('Feedback needed', 'Please enter your feedback before submitting.');
      return;
    }
    Alert.alert('Thank you!', 'Your feedback has been submitted.');
    setFeedback('');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <Ionicons name="arrow-back" size={22} color="#000000" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Share feedback</Text>
          <Text style={styles.subtitle}>Tell us what we can improve or what you love.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Your feedback</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type your thoughts..."
            multiline
            numberOfLines={6}
            value={feedback}
            onChangeText={setFeedback}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={submitFeedback} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: 90,
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.borderStrong,
  },
  header: {
    marginBottom: 16,
    gap: 6,
  },
  title: {
    ...TYPE.title,
    fontSize: 20,
    color: '#1C1C1E',
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
  label: {
    ...TYPE.micro,
    color: '#8E8E93',
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
    marginTop: 4,
  },
  primaryButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
});
