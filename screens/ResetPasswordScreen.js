import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { Ionicons } from '@expo/vector-icons';
import { lightHaptic } from '../ui/haptics';
import { resetPasswordWithToken } from '../services/authService';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const token = route.params?.token ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validate = () => {
    let valid = true;
    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      valid = false;
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      valid = false;
    } else {
      setPasswordError('');
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    } else {
      setConfirmError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    lightHaptic();
    if (!validate()) return;

    setIsLoading(true);
    setPasswordError('');
    setConfirmError('');

    try {
      const result = await resetPasswordWithToken(token, newPassword, confirmPassword);

      if (result.success) {
        Alert.alert(
          'Password reset',
          result.message || 'Your password has been reset. You can now sign in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
            },
          ]
        );
      } else {
        setPasswordError(result.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setPasswordError(error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    lightHaptic();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleRequestNewLink = () => {
    lightHaptic();
    navigation.navigate('ForgotPassword');
  };

  const hasNoToken = !token || typeof token !== 'string' || !token.trim();

  if (hasNoToken) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.backButton} />
        </View>
        <View style={[styles.content, styles.centered, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.card}>
            <Ionicons name="link-outline" size={48} color={COLORS.subtle} style={styles.invalidIcon} />
            <Text style={styles.subtitle}>Invalid or expired link</Text>
            <Text style={styles.body}>
              This reset link is invalid or has expired. Request a new link or go back to sign in.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleRequestNewLink} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Request new link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBackToLogin} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.subtitle}>Enter your new password below.</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={COLORS.subtle}
                value={newPassword}
                onChangeText={(text) => { setNewPassword(text); if (passwordError) setPasswordError(''); }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isLoading}
              />
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={COLORS.subtle}
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); if (confirmError) setConfirmError(''); }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isLoading}
              />
            </View>
            {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={handleRequestNewLink} disabled={isLoading}>
              <Text style={styles.linkButtonText}>Request new link</Text>
            </TouchableOpacity>
          </View>
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
  content: { padding: SPACING.l, paddingTop: SPACING.m },
  centered: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  invalidIcon: { alignSelf: 'center', marginBottom: SPACING.m },
  subtitle: { ...TYPE.body, color: COLORS.subtle, marginBottom: SPACING.l },
  body: { ...TYPE.body, color: COLORS.subtle, marginBottom: SPACING.l, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.bg,
    marginBottom: SPACING.s,
  },
  inputIcon: { marginRight: SPACING.s },
  input: {
    flex: 1,
    ...TYPE.body,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  primaryButtonText: { ...TYPE.bodyStrong, fontSize: 16, color: '#FFFFFF' },
  primaryButtonDisabled: { opacity: 0.6 },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    marginTop: SPACING.s,
    backgroundColor: COLORS.border,
  },
  secondaryButtonText: { ...TYPE.bodyStrong, fontSize: 16, color: COLORS.text },
  linkButton: { alignItems: 'center', paddingVertical: SPACING.m, marginTop: SPACING.s },
  linkButtonText: { ...TYPE.body, fontSize: 14, color: COLORS.brand },
  errorText: { ...TYPE.caption, fontSize: 12, color: '#F44336', marginBottom: SPACING.s, marginLeft: SPACING.m },
});
