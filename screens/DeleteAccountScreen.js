import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { lightHaptic } from '../ui/haptics';
import { deleteHostAccount } from '../services/authService';
import { useHost } from '../utils/HostContext';
import AppLoader from "../ui/AppLoader";

const DeleteAccountScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { logout } = useHost();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleDelete = async () => {
    // Validate inputs
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (confirmText !== 'DELETE') {
      setError('Confirmation must be exactly "DELETE"');
      return;
    }

    setIsDeleting(true);
    setError('');
    lightHaptic();

    try {
      const result = await deleteHostAccount(password);

      if (result.success) {
        // Account deleted successfully - logout user
        await logout();
        // Navigate to landing screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Landing' }],
        });
      } else {
        setError(result.error || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              lightHaptic();
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Warning Card */}
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#F44336" />
            <Text style={styles.warningText}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#8E8E93"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isDeleting}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#8E8E93"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Confirmation Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Type "DELETE" to confirm</Text>
              <TextInput
                style={styles.input}
                placeholder="DELETE"
                placeholderTextColor="#8E8E93"
                value={confirmText}
                onChangeText={(text) => {
                  setConfirmText(text);
                  if (error) setError('');
                }}
                autoCapitalize="characters"
                editable={!isDeleting}
              />
            </View>

            {/* Error Text */}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (!password || confirmText !== 'DELETE' || isDeleting) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            activeOpacity={0.7}
            disabled={!password || confirmText !== 'DELETE' || isDeleting}
          >
            {isDeleting ? (
              <AppLoader size="small" color="#ffffff" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
  },
  headerTitle: {
    ...TYPE.largeTitle,
    fontSize: 20,
    color: COLORS.text,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.m,
    borderRadius: RADIUS.card,
    marginBottom: 24,
    backgroundColor: '#FFEBEE',
    gap: 12,
  },
  warningText: {
    flex: 1,
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 20,
    color: '#D32F2F',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.l,
  },
  inputContainer: {
    paddingVertical: 4,
  },
  label: {
    ...TYPE.bodyStrong,
    fontSize: 12,
    marginBottom: 8,
    color: '#8E8E93',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    height: 44,
    borderWidth: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1E',
    marginVertical: SPACING.m,
  },
  input: {
    flex: 1,
    ...TYPE.body,
    fontSize: 14,
    color: '#1C1C1E',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    ...TYPE.caption,
    fontSize: 11,
    color: '#F44336',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default DeleteAccountScreen;
