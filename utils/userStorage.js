import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@user_id';
const USER_TOKEN_KEY = '@user_token';

/**
 * Get the current user ID from storage
 * This should be set after login with your Python backend
 * @returns {Promise<string|null>} User ID or null if not found
 */
export const getUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Set the user ID in storage
 * Call this after successful login with your Python backend
 * @param {string} userId - User ID from your backend
 */
export const setUserId = async (userId) => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  } catch (error) {
    console.error('Error setting user ID:', error);
  }
};

/**
 * Get the user authentication token from storage
 * @returns {Promise<string|null>} Token or null if not found
 */
export const getUserToken = async () => {
  try {
    const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
};

/**
 * Set the user authentication token in storage
 * @param {string} token - Authentication token from your Python backend
 */
export const setUserToken = async (token) => {
  try {
    await AsyncStorage.setItem(USER_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting user token:', error);
  }
};

/**
 * Clear user data from storage (on logout)
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(USER_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

