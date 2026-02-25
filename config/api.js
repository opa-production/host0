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
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.88.249:8001'  // Local development server (your computer's IP)
  : 'https://api.ardena.xyz';

/**
 * Veriff hosted verification page (Hosted plan).
 * Set to your Veriff hosted verification URL, or leave empty to use a backend endpoint
 * that returns the session URL (e.g. GET /api/v1/host/verification-url).
 */
export const VERIFF_VERIFICATION_URL = '';

/**
 * Google OAuth for Host Login/Sign-up (Continue with Google).
 * Android OAuth client only (same as backend GOOGLE_CLIENT_ID).
 * In Google Console: Android client with package com.ardenahost.app and your SHA-1.
 */
export const GOOGLE_CLIENT_ID = '263550297699-sntddeuh7ldlet9lhqv66lj8o706h2r4.apps.googleusercontent.com';

export const API_ENDPOINTS = {
  // Host Authentication
  HOST_REGISTER: '/api/v1/host/auth/register',
  HOST_LOGIN: '/api/v1/host/auth/login',
  HOST_GOOGLE_AUTH: '/api/v1/host/auth/google',
  HOST_LOGOUT: '/api/v1/host/auth/logout',
  HOST_CHANGE_PASSWORD: '/api/v1/host/change-password',
  HOST_FORGOT_PASSWORD: '/api/v1/host/auth/forgot-password',
  HOST_RESET_PASSWORD: '/api/v1/host/auth/reset-password',
  HOST_DELETE_ACCOUNT: '/api/v1/host/account',
  HOST_ME: '/api/v1/host/me',
  HOST_UPDATE_PROFILE: '/api/v1/host/profile',
  
  // Cars
  CARS: '/api/v1/cars',
  HOST_CARS: '/api/v1/host/cars',
  HOST_DELETE_CAR: (carId) => `/api/v1/host/cars/${carId}`,
  CAR_DETAIL: (id) => `/api/v1/cars/${id}`,
  CAR_BASICS: '/api/v1/cars/basics',
  CAR_SPECS: (carId) => `/api/v1/cars/${carId}/specs`,
  CAR_PRICING: (carId) => `/api/v1/cars/${carId}/pricing`,
  CAR_LOCATION: (carId) => `/api/v1/cars/${carId}/location`,
  CAR_MEDIA_IMAGES: (carId) => `/api/v1/cars/${carId}/media/images`,
  CAR_MEDIA_VIDEO: (carId) => `/api/v1/cars/${carId}/media/video`,
  CAR_STATUS: (carId) => `/api/v1/cars/${carId}/status`,
  CAR_TOGGLE_VISIBILITY: (carId) => `/api/v1/host/cars/${carId}/toggle-visibility`,
  HOST_UPLOAD_VEHICLE_IMAGES: (carId) => `/api/v1/host/upload/vehicle/${carId}/images`,
  HOST_CAR_MEDIA: (carId) => `/api/v1/host/cars/${carId}/media`, // PUT endpoint for URLs (recommended)
  
  // Payment Methods
  PAYMENT_METHODS: '/api/v1/host/payment-methods',
  PAYMENT_METHODS_MPESA: '/api/v1/host/payment-methods/mpesa',
  PAYMENT_METHODS_CARD: '/api/v1/host/payment-methods/card',
  PAYMENT_METHOD_DELETE: (id) => `/api/v1/host/payment-methods/${id}`,
  
  // Feedback
  HOST_FEEDBACK: '/api/v1/host/feedback',
  
  // Notifications
  HOST_NOTIFICATIONS: '/api/v1/host/notifications',
  HOST_NOTIFICATION_READ: (notificationId) => `/api/v1/host/notifications/${notificationId}/read`,
  
  // Support
  HOST_SUPPORT_SEND_MESSAGE: '/api/v1/host/support/messages',
  HOST_SUPPORT_CONVERSATION: '/api/v1/host/support/conversation',
  
  // Messages
  HOST_MESSAGES: '/api/v1/host/messages',
  HOST_MESSAGES_CLIENT: (clientId) => `/api/v1/host/messages/client/${clientId}`,
  
  // Bookings
  HOST_BOOKINGS: '/api/v1/host/bookings',
  HOST_BOOKING_DETAIL: (bookingId) => `/api/v1/host/bookings/${bookingId}`,
  HOST_CONFIRM_PICKUP: (bookingId) => `/api/v1/host/bookings/${bookingId}/confirm-pickup`,
  HOST_CONFIRM_DROPOFF: (bookingId) => `/api/v1/host/bookings/${bookingId}/confirm-dropoff`,

  // Earnings
  HOST_EARNINGS_SUMMARY: '/api/v1/host/earnings/summary',
  HOST_EARNINGS_TRANSACTIONS: '/api/v1/host/earnings/transactions',

  // Withdrawals
  HOST_WITHDRAWALS: '/api/v1/host/withdrawals',

  // Car Date Blocking
  HOST_BLOCK_DATES: (carId) => `/api/v1/host/cars/${carId}/block-dates`,
  HOST_GET_BLOCKED_DATES: (carId) => `/api/v1/host/cars/${carId}/blocked-dates`,
  HOST_UNBLOCK_DATE: (carId, blockedDateId) => `/api/v1/host/cars/${carId}/blocked-dates/${blockedDateId}`,

  // KYC (Veriff)
  HOST_KYC_SESSION: '/api/v1/host/kyc/session',
  HOST_KYC_STATUS: '/api/v1/host/kyc/status',
};

/**
 * Helper to get full API URL
 */
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};
