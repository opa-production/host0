import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter the email associated with your account.');
      return;
    }
    // TODO: call API to send reset email
    Alert.alert('Check your email', 'If an account exists, a reset link has been sent.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <Ionicons name="arrow-back" size={22} color="#000000" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleReset} activeOpacity={0.9}>
              <Text style={styles.primaryButtonText}>Send reset link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    position: 'absolute',
    top: 32,
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xl + SPACING.xl,
    gap: SPACING.m,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    marginTop: SPACING.l,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    gap: 6,
    marginBottom: 12,
  },
  title: {
    ...TYPE.title,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPE.body,
    color: COLORS.muted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.card,
    paddingHorizontal: SPACING.m,
    backgroundColor: '#FAFAFC',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
});
