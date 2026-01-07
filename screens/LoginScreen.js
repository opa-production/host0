import React, { useState, useRef } from 'react';
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
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE, RADIUS } from '../ui/tokens';
import { isBiometricEnabled, authenticateWithBiometric } from '../utils/biometric';
import { useFocusEffect } from '@react-navigation/native';
import { setUserId, setUserToken, getUserProfile } from '../utils/userStorage';
import { loginHost } from '../services/authService';
import { useHost } from '../utils/HostContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useHost();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  // Check for biometric authentication when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const checkAndPromptBiometric = async () => {
        setCheckingBiometric(true);
        const enabled = await isBiometricEnabled();
        
        if (enabled) {
          // Check if we have stored profile for biometric login
          const storedProfile = await getUserProfile();
          
          if (storedProfile) {
            // Small delay to ensure UI is ready
            setTimeout(async () => {
              const result = await authenticateWithBiometric();
              
              if (result.success) {
                // Biometric authentication successful - navigate to main app
                navigation.replace('MainTabs');
              } else {
                // Authentication failed or cancelled - allow manual login
                setCheckingBiometric(false);
              }
            }, 500);
          } else {
            // No stored profile, skip biometric
            setCheckingBiometric(false);
          }
        } else {
          setCheckingBiometric(false);
        }
      };

      checkAndPromptBiometric();
      
      // Reset check when leaving screen
      return () => {
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

    // Bypass authentication - create mock profile and log in
    const mockProfile = {
      id: '1',
      email: email,
      full_name: email.split('@')[0],
      phone: '+254712345678',
      avatar_url: null,
      bio: 'Host on OpaHost',
      created_at: new Date().toISOString(),
    };

    await login(mockProfile);

    setTimeout(() => {
      setIsLoading(false);
      navigation.replace('MainTabs');
    }, 500);
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google login
    console.log('Google login');
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
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>Checking biometric authentication...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
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
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ResetPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={1} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin} activeOpacity={1}>
              <Image 
                source={require('../assets/images/google.png')} 
                style={styles.socialIcon}
                resizeMode="contain"
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} onPress={handleAppleLogin} activeOpacity={1}>
              <Image 
                source={require('../assets/images/apple.png')} 
                style={styles.socialIcon}
                resizeMode="contain"
              />
              <Text style={styles.socialButtonText}>Apple</Text>
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
    marginLeft: 52, // Indent to align with text
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF', // iOS Blue
    fontFamily: 'Nunito-SemiBold',
  },
  loginButton: {
    backgroundColor: '#000000', // Brand color
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
  loginButtonText: {
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
  signUpLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Nunito-Regular',
  },
  signUpLinkText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: COLORS.subtle,
    textAlign: 'center',
  },
});
