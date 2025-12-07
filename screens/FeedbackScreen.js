import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

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
    backgroundColor: '#fdfdfd',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 90,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#efefef',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#444444',
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  primaryButton: {
    backgroundColor: '#111111',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
});
