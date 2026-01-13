import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@user_id';
const USER_TOKEN_KEY = '@user_token';
const USER_PROFILE_KEY = '@user_profile';

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
 * Get user profile from storage
 * @returns {Promise<Object|null>} User profile object or null
 */
export const getUserProfile = async () => {
  try {
    const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Set user profile in storage
 * @param {Object} profile - User profile object
 */
export const setUserProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error setting user profile:', error);
  }
};

/**
 * Clear user data from storage (on logout)
 */
export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(USER_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
    await AsyncStorage.removeItem('@host_cars');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

const HOST_CARS_KEY = '@host_cars';

/**
 * Get all cars from storage
 * @returns {Promise<Array>} Array of cars
 */
export const getHostCars = async () => {
  try {
    const cars = await AsyncStorage.getItem(HOST_CARS_KEY);
    return cars ? JSON.parse(cars) : [];
  } catch (error) {
    console.error('Error getting host cars:', error);
    return [];
  }
};

/**
 * Save a car to storage
 * @param {Object} carData - Car data object
 * @returns {Promise<Object>} Saved car with ID and status
 */
export const saveHostCar = async (carData) => {
  try {
    const cars = await getHostCars();
    const newCar = {
      ...carData,
      id: `car-${Date.now()}`,
      status: 'awaiting_verification',
      createdAt: new Date().toISOString(),
      totalTrips: 0,
    };
    cars.push(newCar);
    await AsyncStorage.setItem(HOST_CARS_KEY, JSON.stringify(cars));
    return newCar;
  } catch (error) {
    console.error('Error saving host car:', error);
    throw error;
  }
};

/**
 * Update a car in storage
 * @param {string} carId - Car ID
 * @param {Object} updates - Updates to apply
 */
export const updateHostCar = async (carId, updates) => {
  try {
    const cars = await getHostCars();
    const updatedCars = cars.map(car => 
      car.id === carId ? { ...car, ...updates } : car
    );
    await AsyncStorage.setItem(HOST_CARS_KEY, JSON.stringify(updatedCars));
  } catch (error) {
    console.error('Error updating host car:', error);
    throw error;
  }
};
