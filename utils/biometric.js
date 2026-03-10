import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_SETUP_KEY = '@biometric_setup_complete';
const BIOMETRIC_DEVICE_TOKEN_KEY = '@host_biometric_device_token';

/**
 * Check if biometric authentication is available on the device
 */
export const isBiometricAvailable = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { available: false, error: 'Biometric authentication is not available on this device' };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return { available: false, error: 'No biometric credentials are enrolled on this device' };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { 
      available: true, 
      types,
      biometricType: types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) 
        ? 'Face ID' 
        : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) 
        ? 'Fingerprint' 
        : 'Biometric'
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
};

/**
 * Setup biometric authentication - prompts user to authenticate
 */
export const setupBiometric = async () => {
  try {
    const availability = await isBiometricAvailable();
    if (!availability.available) {
      throw new Error(availability.error || 'Biometric authentication is not available');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable biometric login',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      // Save biometric preference to AsyncStorage
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(BIOMETRIC_SETUP_KEY, 'true');
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.error === 'user_cancel' 
          ? 'Biometric setup was cancelled' 
          : 'Biometric authentication failed' 
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Authenticate using biometrics (for login)
 */
export const authenticateWithBiometric = async () => {
  try {
    const availability = await isBiometricAvailable();
    if (!availability.available) {
      throw new Error(availability.error || 'Biometric authentication is not available');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to sign in',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.error === 'user_cancel' 
          ? 'Authentication was cancelled' 
          : 'Biometric authentication failed',
        cancelled: result.error === 'user_cancel'
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check if biometric login is enabled in settings
 */
export const isBiometricEnabled = async () => {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading biometric preference:', error);
    return false;
  }
};

/**
 * Disable biometric login
 */
export const disableBiometric = async () => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_SETUP_KEY);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get biometric type name for display
 */
export const getBiometricTypeName = async () => {
  const availability = await isBiometricAvailable();
  if (availability.available) {
    return availability.biometricType;
  }
  return 'Biometric';
};

/**
 * Persist host biometric device token (for backend biometric-login).
 */
export const saveBiometricDeviceToken = async (token) => {
  try {
    if (!token) {
      await AsyncStorage.removeItem(BIOMETRIC_DEVICE_TOKEN_KEY);
      return;
    }
    await AsyncStorage.setItem(BIOMETRIC_DEVICE_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving biometric device token:', error);
  }
};

/**
 * Get stored host biometric device token.
 */
export const getBiometricDeviceToken = async () => {
  try {
    const token = await AsyncStorage.getItem(BIOMETRIC_DEVICE_TOKEN_KEY);
    return token || null;
  } catch (error) {
    console.error('Error getting biometric device token:', error);
    return null;
  }
};

/**
 * Clear stored host biometric device token.
 */
export const clearBiometricDeviceToken = async () => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_DEVICE_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing biometric device token:', error);
  }
};

