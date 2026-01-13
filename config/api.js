/**
 * API Configuration
 * 
 * Update API_BASE_URL with your backend server address:
 * - Local development: http://10.0.2.2:8000 (Android Emulator)
 * - Local development: http://localhost:8000 (iOS Simulator)
 * - Local network: http://192.168.x.x:8000 (Your computer's IP)
 * - Production: https://your-domain.com
 */

// Default to localhost for development
// Change this to your computer's IP address when testing on physical devices
// For Expo Go on physical device, use your computer's IP: 192.168.88.253
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.88.253:8000'  // Local development server (your computer's IP)
  : 'https://your-production-api.com';

export const API_ENDPOINTS = {
  // Host Authentication
  HOST_REGISTER: '/api/v1/host/auth/register',
  HOST_LOGIN: '/api/v1/host/auth/login',
  HOST_LOGOUT: '/api/v1/host/auth/logout',
  HOST_ME: '/api/v1/host/me',
  HOST_UPDATE_PROFILE: '/api/v1/host/profile',
  
  // Cars
  CARS: '/api/v1/cars',
  CAR_DETAIL: (id) => `/api/v1/cars/${id}`,
  
  // Payment Methods
  PAYMENT_METHODS: '/api/v1/host/payment-methods',
  PAYMENT_METHODS_MPESA: '/api/v1/host/payment-methods/mpesa',
  PAYMENT_METHODS_CARD: '/api/v1/host/payment-methods/card',
  PAYMENT_METHOD_DELETE: (id) => `/api/v1/host/payment-methods/${id}`,
};

/**
 * Helper to get full API URL
 */
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};
