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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerHost, loginHost, googleAuthHost } from '../services/authService';
import { useHost } from '../utils/HostContext';
import { GoogleSignin, statusCodes } from '../utils/googleSignIn';
import AppLoader from "../ui/AppLoader";

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
        Alert.alert('Google Sign-Up Failed', 'Unable to get authentication token. Please try again.');
        return;
      }
      const result = await googleAuthHost(idToken);
      if (result.success) {
        await login(result.host);
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Google Sign-Up Failed', result.error || 'Unable to sign up with Google. Please try again.');
      }
    } catch (error) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        // already in progress
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services is not available on this device.');
      } else {
        console.error('🔐 [SignUpScreen] Google sign-in error:', error);
        Alert.alert('Google Sign-Up Error', error?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsGoogleLoading(false);
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
<View style={styles.inputCard}>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#B0B0B4"
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
            <View style={styles.separator} />
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.subtle} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#B0B0B4"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.subtle} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} activeOpacity={0.85} disabled={isLoading}>
            {isLoading ? (
              <AppLoader color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
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
              onPress={handleGoogleSignUp}
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

            <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignUp} activeOpacity={0.85}>
              <Image source={require('../assets/images/apple.png')} style={styles.socialIcon} resizeMode="contain" />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
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
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.subtle,
    fontFamily: 'Nunito-Regular',
  },
  loginLinkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: COLORS.brand,
  },
});
