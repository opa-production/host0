/**
 * Calendar Service - Backend Integration for Host App
 * Handles car date blocking/unblocking
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * Block dates for a car
 * @param {number|string} carId - Car ID
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @param {string} reason - Optional reason for blocking
 * @returns {Promise<Object>} Result with success status and blocked date data or error
 */
export const blockCarDates = async (carId, startDate, endDate, reason = null) => {
  if (!carId) {
    return {
      success: false,
      error: 'Car ID is required',
      blockedDate: null,
    };
  }

  if (!startDate || !endDate) {
    return {
      success: false,
      error: 'Start date and end date are required',
      blockedDate: null,
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_BLOCK_DATES(carId));
  const startTime = Date.now();
  console.log('📅 [BLOCK CAR DATES API] Blocking dates...');
  console.log('📅 [BLOCK CAR DATES API] Endpoint URL:', url);
  console.log('📅 [BLOCK CAR DATES API] Car ID:', carId);
  console.log('📅 [BLOCK CAR DATES API] Start Date:', startDate);
  console.log('📅 [BLOCK CAR DATES API] End Date:', endDate);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('📅 [BLOCK CAR DATES API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        blockedDate: null,
      };
    }

    const body = {
      start_date: startDate,
      end_date: endDate,
    };

    if (reason) {
      body.reason = reason;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const responseTime = Date.now() - startTime;
    console.log('📅 [BLOCK CAR DATES API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('📅 [BLOCK CAR DATES API] Request failed with status:', response.status);
      let errorMessage = 'Failed to block dates';
      try {
        const errorData = await response.json();
        console.error('📅 [BLOCK CAR DATES API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('📅 [BLOCK CAR DATES API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('📅 [BLOCK CAR DATES API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        blockedDate: null,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('📅 [BLOCK CAR DATES API] ✅ SUCCESS! Dates blocked:', {
      blockedDateId: data.id || data.blocked_date_id,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      blockedDate: data,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [BLOCK CAR DATES API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`📅 [BLOCK CAR DATES API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      blockedDate: null,
    };
  }
};

/**
 * Get blocked dates for a car
 * @param {number|string} carId - Car ID
 * @returns {Promise<Object>} Result with success status and blocked dates array or error
 */
export const getBlockedDates = async (carId) => {
  if (!carId) {
    return {
      success: false,
      error: 'Car ID is required',
      blockedDates: [],
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_GET_BLOCKED_DATES(carId));
  const startTime = Date.now();
  console.log('📅 [GET BLOCKED DATES API] Fetching blocked dates...');
  console.log('📅 [GET BLOCKED DATES API] Endpoint URL:', url);
  console.log('📅 [GET BLOCKED DATES API] Car ID:', carId);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('📅 [GET BLOCKED DATES API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        blockedDates: [],
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
    console.log('📅 [GET BLOCKED DATES API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('📅 [GET BLOCKED DATES API] Request failed with status:', response.status);
      let errorMessage = 'Failed to fetch blocked dates';
      try {
        const errorData = await response.json();
        console.error('📅 [GET BLOCKED DATES API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('📅 [GET BLOCKED DATES API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('📅 [GET BLOCKED DATES API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        blockedDates: [],
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    // Handle array response or object with blocked_dates property
    let blockedDatesArray = [];
    if (Array.isArray(data)) {
      blockedDatesArray = data;
    } else if (data.blocked_dates && Array.isArray(data.blocked_dates)) {
      blockedDatesArray = data.blocked_dates;
    }
    
    console.log('📅 [GET BLOCKED DATES API] ✅ SUCCESS! Blocked dates fetched:', {
      count: blockedDatesArray.length,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      blockedDates: blockedDatesArray,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [GET BLOCKED DATES API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`📅 [GET BLOCKED DATES API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      blockedDates: [],
    };
  }
};

/**
 * Unblock a date for a car
 * @param {number|string} carId - Car ID
 * @param {number|string} blockedDateId - Blocked date ID
 * @returns {Promise<Object>} Result with success status or error
 */
export const unblockCarDate = async (carId, blockedDateId) => {
  if (!carId) {
    return {
      success: false,
      error: 'Car ID is required',
    };
  }

  if (!blockedDateId) {
    return {
      success: false,
      error: 'Blocked date ID is required',
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_UNBLOCK_DATE(carId, blockedDateId));
  const startTime = Date.now();
  console.log('📅 [UNBLOCK CAR DATE API] Unblocking date...');
  console.log('📅 [UNBLOCK CAR DATE API] Endpoint URL:', url);
  console.log('📅 [UNBLOCK CAR DATE API] Car ID:', carId);
  console.log('📅 [UNBLOCK CAR DATE API] Blocked Date ID:', blockedDateId);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('📅 [UNBLOCK CAR DATE API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('📅 [UNBLOCK CAR DATE API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('📅 [UNBLOCK CAR DATE API] Request failed with status:', response.status);
      let errorMessage = 'Failed to unblock date';
      try {
        const errorData = await response.json();
        console.error('📅 [UNBLOCK CAR DATE API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('📅 [UNBLOCK CAR DATE API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('📅 [UNBLOCK CAR DATE API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const totalTime = Date.now() - startTime;
    
    console.log('📅 [UNBLOCK CAR DATE API] ✅ SUCCESS! Date unblocked:', {
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [UNBLOCK CAR DATE API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`📅 [UNBLOCK CAR DATE API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
};
