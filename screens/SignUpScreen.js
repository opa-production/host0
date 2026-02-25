import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, RADIUS } from '../ui/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerHost, loginHost, googleAuthHost } from '../services/authService';
import { useHost } from '../utils/HostContext';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_REDIRECT_URI, GOOGLE_ANDROID_CLIENT_ID } from '../config/api';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Make sure WebBrowser is warmed up for better performance
WebBrowser.maybeCompleteAuthSession();

const useAndroidClient = Platform.OS === 'android' && Constants.appOwnership === 'standalone' && !!GOOGLE_ANDROID_CLIENT_ID;

export default function SignUpScreen({ navigation }) {
  const { login } = useHost();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // Google Sign-In: Web client (Expo Go / web), Android client (standalone preview/production)
  const [request, googleResponse, promptAsync] = Google.useAuthRequest(
    {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      ...(useAndroidClient ? { androidClientId: GOOGLE_ANDROID_CLIENT_ID } : {}),
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      ...(useAndroidClient ? {} : { redirectUri: GOOGLE_REDIRECT_URI }),
    },
    {}
  );

  const handleGoogleAuth = useCallback(async (idToken) => {
    setIsGoogleLoading(true);
    console.log('🔐 [SignUpScreen] Starting Google auth with id_token...');

    try {
      const result = await googleAuthHost(idToken);
      console.log('🔐 [SignUpScreen] Google auth result:', result.success ? 'SUCCESS' : 'FAILED', result.error || '');

      if (result.success) {
        console.log('🔐 [SignUpScreen] Google auth successful, storing profile and navigating...');
        await login(result.host);
        navigation.replace('MainTabs');
      } else {
        console.error('🔐 [SignUpScreen] Google auth failed:', result.error);
        Alert.alert(
          'Google Sign-Up Failed',
          result.error || 'Unable to sign up with Google. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('🔐 [SignUpScreen] Google auth error:', error);
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  }, [login, navigation]);

  // Handle Google auth response (id_token from params or from code exchange)
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleAuth(idToken);
      } else {
        setIsGoogleLoading(false);
        Alert.alert(
          'Google Sign-Up Failed',
          'Unable to get authentication token. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else if (googleResponse?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert(
        'Google Sign-Up Failed',
        'Unable to sign up with Google. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [googleResponse, handleGoogleAuth]);

  const validateName = (name) => {
    if (!name) return 'Full name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const handleSignUp = async () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);

    setErrors({ 
      name: nameError, 
      email: emailError, 
      password: passwordError, 
      confirmPassword: confirmPasswordError 
    });

    if (nameError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the actual API registration endpoint
      const result = await registerHost(name, email, password, confirmPassword);

      if (result.success) {
        // Registration successful - auto-login the user
        if (result.host) {
          // If API returns host data directly, use it
          await login(result.host);
          navigation.replace('MainTabs');
        } else {
          // Otherwise, auto-login with the credentials
          const loginResult = await loginHost(email, password);
          if (loginResult.success) {
            await login(loginResult.host);
            navigation.replace('MainTabs');
          } else {
            // Login failed, navigate to login screen
            Alert.alert(
              'Account Created',
              'Your account has been created successfully! Please sign in to continue.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Login'),
                },
              ]
            );
          }
        }
      } else {
        // Registration failed - show error
        Alert.alert(
          'Registration Failed',
          result.error || 'Failed to create account. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Error',
        'Failed to connect to server. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (isGoogleLoading) return;
    const needsWeb = !useAndroidClient;
    if (needsWeb && (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID === 'YOUR_GOOGLE_WEB_CLIENT_ID')) {
      Alert.alert(
        'Google Sign-Up Not Configured',
        'Add GOOGLE_WEB_CLIENT_ID in config/api.js and set redirect URI: ' + GOOGLE_REDIRECT_URI,
        [{ text: 'OK' }]
      );
      return;
    }
    if (useAndroidClient && !GOOGLE_ANDROID_CLIENT_ID) {
      Alert.alert(
        'Google Sign-Up Not Configured',
        'Add GOOGLE_ANDROID_CLIENT_ID in config/api.js for standalone Android.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      setIsGoogleLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('🔐 [SignUpScreen] Error prompting Google sign-in:', error);
      setIsGoogleLoading(false);
      Alert.alert(
        'Google Sign-Up Error',
        ((error?.message || '').includes('400') || (error?.message || '').includes('redirect_uri')
          ? 'OAuth config error. Check Google Console and config/api.js (client IDs and redirect URI).'
          : 'Unable to open Google sign-in. Please try again.'),
        [{ text: 'OK' }]
      );
    }
  };

  const handleAppleSignUp = () => {
    // TODO: Implement Apple signup
    console.log('Apple signup');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#C7C7CC"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                autoCapitalize="words"
              />
            </View>
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

            <View style={styles.separator} />

            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#C7C7CC"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            <View style={styles.separator} />

            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#C7C7CC"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <View style={styles.separator} />

            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#C7C7CC"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} activeOpacity={1} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity 
              style={[styles.socialButton, isGoogleLoading && styles.socialButtonDisabled]} 
              onPress={handleGoogleSignUp} 
              activeOpacity={1}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={COLORS.text} size="small" />
              ) : (
                <>
                  <Image 
                    source={require('../assets/images/google.png')} 
                    style={styles.socialIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.socialButtonText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignUp} activeOpacity={1}>
              <Image 
                source={require('../assets/images/apple.png')} 
                style={styles.socialIcon}
                resizeMode="contain"
              />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg, // iOS System Background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...TYPE.largeTitle,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    fontFamily: 'Nunito-Regular',
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Nunito-Regular',
    color: '#000000',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  signUpButton: {
    backgroundColor: '#000000',
    borderRadius: RADIUS.button,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  signUpButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: 'Nunito-SemiBold',
  },
  socialButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.button,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#000000',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Nunito-Regular',
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#007AFF',
  },
});
