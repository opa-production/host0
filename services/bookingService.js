/**
 * Booking Service - Backend Integration for Host App
 * Handles booking-related API calls
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken, clearUserData } from '../utils/userStorage';

/**
 * Get all bookings for the host
 * @returns {Promise<Object>} Result with success status and bookings array or error
 */
export const getHostBookings = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_BOOKINGS);
  const startTime = Date.now();
  console.log('📅 [GET HOST BOOKINGS API] Fetching bookings...');
  console.log('📅 [GET HOST BOOKINGS API] Endpoint URL:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('📅 [GET HOST BOOKINGS API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        bookings: [],
        total: 0,
      };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('📅 [GET HOST BOOKINGS API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('📅 [GET HOST BOOKINGS API] Request failed with status:', response.status);
      let errorMessage = 'Failed to fetch bookings';
      try {
        const errorData = await response.json();
        console.error('📅 [GET HOST BOOKINGS API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('📅 [GET HOST BOOKINGS API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      // Token expired or invalid - clear local data
      if (response.status === 401) {
        console.log('📅 [GET HOST BOOKINGS API] Token expired or invalid (401), clearing local data');
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        bookings: [],
        total: 0,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    // Handle array response (API might return array directly or wrapped in object)
    let bookingsArray = [];
    if (Array.isArray(data)) {
      bookingsArray = data;
    } else if (data.bookings && Array.isArray(data.bookings)) {
      bookingsArray = data.bookings;
    } else if (Array.isArray(data[0]?.bookings)) {
      bookingsArray = data[0].bookings;
    }
    
    console.log('📅 [GET HOST BOOKINGS API] ✅ SUCCESS! Bookings fetched:', {
      count: bookingsArray.length,
      total: data.total || bookingsArray.length,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      bookings: bookingsArray,
      total: data.total || bookingsArray.length,
      skip: data.skip || 0,
      limit: data.limit || bookingsArray.length,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [GET HOST BOOKINGS API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`📅 [GET HOST BOOKINGS API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      bookings: [],
      total: 0,
    };
  }
};

/**
 * Get booking details by booking ID
 * @param {number|string} bookingId - Booking ID
 * @returns {Promise<Object>} Result with success status and booking data or error
 */
export const getBookingDetails = async (bookingId) => {
  if (!bookingId) {
    return {
      success: false,
      error: 'Booking ID is required',
      booking: null,
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_BOOKING_DETAIL(bookingId));
  const startTime = Date.now();
  console.log('📅 [GET BOOKING DETAILS API] Fetching booking details...');
  console.log('📅 [GET BOOKING DETAILS API] Endpoint URL:', url);
  console.log('📅 [GET BOOKING DETAILS API] Booking ID:', bookingId);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('📅 [GET BOOKING DETAILS API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        booking: null,
      };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('📅 [GET BOOKING DETAILS API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('📅 [GET BOOKING DETAILS API] Request failed with status:', response.status);
      let errorMessage = 'Failed to fetch booking details';
      try {
        const errorData = await response.json();
        console.error('📅 [GET BOOKING DETAILS API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('📅 [GET BOOKING DETAILS API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('📅 [GET BOOKING DETAILS API] Token expired or invalid (401), clearing local data');
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        booking: null,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    // Handle array response (API might return array with single booking)
    let bookingData = null;
    if (Array.isArray(data) && data.length > 0) {
      bookingData = data[0];
    } else if (data && typeof data === 'object') {
      bookingData = data;
    }
    
    console.log('📅 [GET BOOKING DETAILS API] ✅ SUCCESS! Booking details fetched:', {
      bookingId: bookingData?.id || bookingData?.booking_id,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      booking: bookingData,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [GET BOOKING DETAILS API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`📅 [GET BOOKING DETAILS API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      booking: null,
    };
  }
};

/**
 * Confirm pickup for a booking
 * @param {number|string} bookingId - Booking ID
 * @returns {Promise<Object>} Result with success status and updated booking data or error
 */
export const confirmPickup = async (bookingId) => {
  if (!bookingId) {
    return {
      success: false,
      error: 'Booking ID is required',
      booking: null,
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_CONFIRM_PICKUP(bookingId));
  const startTime = Date.now();
  console.log('📅 [CONFIRM PICKUP API] Confirming pickup...');
  console.log('📅 [CONFIRM PICKUP API] Endpoint URL:', url);
  console.log('📅 [CONFIRM PICKUP API] Booking ID:', bookingId);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('📅 [CONFIRM PICKUP API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        booking: null,
      };
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('📅 [CONFIRM PICKUP API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('📅 [CONFIRM PICKUP API] Request failed with status:', response.status);
      let errorMessage = 'Failed to confirm pickup';
      try {
        const errorData = await response.json();
        console.error('📅 [CONFIRM PICKUP API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('📅 [CONFIRM PICKUP API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('📅 [CONFIRM PICKUP API] Token expired or invalid (401), clearing local data');
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        booking: null,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('📅 [CONFIRM PICKUP API] ✅ SUCCESS! Pickup confirmed:', {
      bookingId: data.id || data.booking_id,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      booking: data,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [CONFIRM PICKUP API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`📅 [CONFIRM PICKUP API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      booking: null,
    };
  }
};

/**
 * Confirm dropoff for a booking
 * @param {number|string} bookingId - Booking ID
 * @returns {Promise<Object>} Result with success status and updated booking data or error
 */
export const confirmDropoff = async (bookingId) => {
  if (!bookingId) {
    return {
      success: false,
      error: 'Booking ID is required',
      booking: null,
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_CONFIRM_DROPOFF(bookingId));
  const startTime = Date.now();
  console.log('📅 [CONFIRM DROPOFF API] Confirming dropoff...');
  console.log('📅 [CONFIRM DROPOFF API] Endpoint URL:', url);
  console.log('📅 [CONFIRM DROPOFF API] Booking ID:', bookingId);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('📅 [CONFIRM DROPOFF API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        booking: null,
      };
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('📅 [CONFIRM DROPOFF API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('📅 [CONFIRM DROPOFF API] Request failed with status:', response.status);
      let errorMessage = 'Failed to confirm dropoff';
      try {
        const errorData = await response.json();
        console.error('📅 [CONFIRM DROPOFF API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('📅 [CONFIRM DROPOFF API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('📅 [CONFIRM DROPOFF API] Token expired or invalid (401), clearing local data');
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        booking: null,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('📅 [CONFIRM DROPOFF API] ✅ SUCCESS! Dropoff confirmed:', {
      bookingId: data.id || data.booking_id,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      booking: data,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [CONFIRM DROPOFF API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`📅 [CONFIRM DROPOFF API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      booking: null,
    };
  }
};
