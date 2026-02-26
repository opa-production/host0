import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { Ionicons } from '@expo/vector-icons';
import { lightHaptic } from '../ui/haptics';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email';
    }
    return '';
  };

  const handleReset = async () => {
    lightHaptic();

    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setEmailError('');
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        Alert.alert(
          'Check your email',
          result.message || 'If an account exists, a password reset link has been sent to your email address.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        const errorMsg = result.error || 'Failed to send reset email. Please try again.';
        const errorLower = errorMsg.toLowerCase();

        if (errorLower.includes('email') && (errorLower.includes('invalid') || errorLower.includes('not found'))) {
          setEmailError(errorMsg);
        } else {
          Alert.alert(
            'Error',
            errorMsg,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
<Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.subtle} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#B0B0B4"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleReset}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Send reset link</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.largeTitle, fontSize: 20, color: COLORS.text },
  content: { paddingHorizontal: SPACING.l, paddingTop: SPACING.m, gap: 20 },
  subtitle: { ...TYPE.body, color: COLORS.subtle },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: SPACING.m,
    backgroundColor: 'transparent',
    height: 54,
  },
  inputIcon: { marginRight: SPACING.s },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    height: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    height: 54,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 15, fontFamily: 'Nunito-Bold', color: '#FFFFFF' },
  primaryButtonDisabled: { opacity: 0.6 },
  errorText: { fontSize: 12, fontFamily: 'Nunito-Regular', color: COLORS.danger, marginLeft: SPACING.m, marginTop: -12 },
});
