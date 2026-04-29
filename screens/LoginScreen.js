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
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, RADIUS, SPACING } from '../ui/tokens';
import {
  isBiometricEnabled,
  isBiometricAvailable,
  authenticateWithBiometric,
  getBiometricDeviceToken,
  saveBiometricDeviceToken,
} from '../utils/biometric';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setUserId, setUserToken, getUserProfile } from '../utils/userStorage';
import { loginHost, googleAuthHost, biometricLoginHost } from '../services/authService';
import { useHost } from '../utils/HostContext';
import { GoogleSignin, statusCodes } from '../utils/googleSignIn';
import AppLoader from "../ui/AppLoader";

export default function LoginScreen({ navigation }) {
  const { login } = useHost();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  // Check for biometric authentication when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let timeoutId = null;
      let isMounted = true;

      const checkAndPromptBiometric = async () => {
        setCheckingBiometric(true);
        const enabled = await isBiometricEnabled();

        if (!isMounted) return;

        if (!enabled) {
          setCheckingBiometric(false);
          return;
        }

        // Require a stored device token to attempt backend biometric login
        const deviceToken = await getBiometricDeviceToken();

        if (!isMounted) return;

        if (!deviceToken) {
          setCheckingBiometric(false);
          return;
        }

        // Small delay to ensure UI is ready
        timeoutId = setTimeout(async () => {
          if (!isMounted) return;

          const result = await authenticateWithBiometric();

          if (!isMounted) return;

          if (!result.success) {
            // Authentication failed or cancelled - allow manual login
            setCheckingBiometric(false);
            return;
          }

          // Local biometric auth passed; hit backend biometric-login
          const apiResult = await biometricLoginHost(deviceToken);

          if (!isMounted) return;

          if (apiResult.success && apiResult.host) {
            await login(apiResult.host);
            navigation.replace('MainTabs');
          } else {
            // If token invalid/revoked, stop trying biometric on next launch
            console.warn('🔐 [LoginScreen] Biometric login failed:', apiResult.error);
            setCheckingBiometric(false);
          }
        }, 500);
      };

      checkAndPromptBiometric();
      
      // Reset check when leaving screen
      return () => {
        isMounted = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setCheckingBiometric(false);
      };
    }, [navigation])
  );

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);
    console.log('🔐 [LoginScreen] Starting login process...');

    try {
      // Determine if we should request a backend device_token for biometrics
      const biometricPrefEnabled = await isBiometricEnabled();
      const availability = await isBiometricAvailable();
      const shouldEnableBiometrics =
        biometricPrefEnabled && availability.available;

      // Call the actual API login endpoint
      console.log('🔐 [LoginScreen] Calling loginHost API...');
      const result = await loginHost(email, password, {
        enableBiometrics: shouldEnableBiometrics,
        deviceName: Platform.OS === 'ios' ? 'Host iOS device' : 'Host Android device',
      });
      console.log('🔐 [LoginScreen] loginHost result:', result.success ? 'SUCCESS' : 'FAILED', result.error || '');

      if (result.success) {
        console.log('🔐 [LoginScreen] Login successful, storing profile and navigating...');
        // Login successful - store host profile and navigate
        await login(result.host);
        // Persist biometric device token when provided
        if (result.deviceToken) {
          await saveBiometricDeviceToken(result.deviceToken);
        }
        navigation.replace('MainTabs');
      } else {
        console.error('🔐 [LoginScreen] Login failed:', result.error);
        // Login failed - show error
        Alert.alert(
          'Login Failed',
          result.error || 'Invalid email or password. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('🔐 [LoginScreen] Login error:', error);
      // Error should already be handled by the service, but catch any unexpected errors
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    if (!GoogleSignin) {
      Alert.alert('Not Available', 'Google Sign-In is only available in standalone builds.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken ?? userInfo?.idToken;
      if (!idToken) {
        Alert.alert('Google Sign-In Failed', 'Unable to get authentication token. Please try again.');
        return;
      }
      const result = await googleAuthHost(idToken);
      if (result.success) {
        await login(result.host);
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Google Sign-In Failed', result.error || 'Unable to sign in with Google. Please try again.');
      }
    } catch (error) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        // already in progress
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services is not available on this device.');
      } else {
        console.error('🔐 [LoginScreen] Google sign-in error:', error);
        Alert.alert('Google Sign-In Error', error?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = () => {
    // TODO: Implement Apple login
    console.log('Apple login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {checkingBiometric ? (
        <View style={styles.loadingContainer}>
          <AppLoader size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>Checking biometric authentication...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

        <View style={styles.form}>
          <View style={styles.inputCard}>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B0B0B4"
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
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#B0B0B4"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.subtle} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.85} disabled={isLoading}>
            {isLoading ? (
              <AppLoader color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.85}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <AppLoader color={COLORS.subtle} size="small" />
              ) : (
                <>
                  <Image source={require('../assets/images/google.png')} style={styles.socialIcon} resizeMode="contain" />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin} activeOpacity={0.85}>
              <Image source={require('../assets/images/apple.png')} style={styles.socialIcon} resizeMode="contain" />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signUpLink}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLinkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    ...TYPE.largeTitle,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPE.body,
    color: COLORS.subtle,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    gap: 20,
  },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    fontFamily: 'Nunito-Regular',
    marginTop: 4,
    marginBottom: 8,
    marginLeft: SPACING.m,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: SPACING.m,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginLeft: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.text,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.brand,
    fontFamily: 'Nunito-SemiBold',
  },
  primaryButton: {
    backgroundColor: COLORS.text,
    borderRadius: RADIUS.button,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  dividerText: {
    marginHorizontal: SPACING.m,
    fontSize: 13,
    color: COLORS.subtle,
    fontFamily: 'Nunito-SemiBold',
  },
  socialButtonsContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: RADIUS.button,
    height: 52,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: COLORS.text,
  },
  signUpLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: COLORS.subtle,
    fontFamily: 'Nunito-Regular',
  },
  signUpLinkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: COLORS.brand,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  loadingText: {
    marginTop: SPACING.m,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    textAlign: 'center',
  },
});
