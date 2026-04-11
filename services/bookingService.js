/**
 * Booking Service - Backend Integration for Host App
 * Handles booking-related API calls
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { PLATFORM_FEE_PERCENTAGE } from '../ui/tokens';
import { getUserToken } from '../utils/userStorage';
import { handleTokenExpiration } from '../utils/logoutHandler';
import { isFreshLogin } from '../utils/screenDataCache';

/**
 * Get client/renter display name from API booking object (list or detail).
 * Tries all known API keys so we show the real name when the backend sends it.
 * @param {Object} booking - Raw booking from API (list or detail response)
 * @returns {string} Display name or 'Client' as fallback
 */
export const getClientDisplayName = (booking) => {
  if (!booking || typeof booking !== 'object') return 'Client';
  const name =
    booking.client_name ||
    booking.client_full_name ||
    booking.renter_name ||
    booking.booker_name ||
    (booking.client && (booking.client.name || booking.client.full_name || booking.client.display_name)) ||
    (booking.renter && (booking.renter.name || booking.renter.full_name)) ||
    '';
  const trimmed = typeof name === 'string' ? name.trim() : '';
  return trimmed || 'Client';
};

/** Statuses that mean the booking is done (car dropped off). Shown in Past Bookings only; "completed" is the canonical status. */
const COMPLETED_STATUSES = ['completed', 'dropped_off', 'dropped off'];

/** Cancelled bookings belong in Past Bookings only, not on the active Bookings tab. */
const CANCELLED_STATUSES = [
  'cancelled',
  'canceled',
  'cancelled_by_host',
  'cancelled_by_client',
  'cancelled_by_renter',
  'cancelled by host',
  'cancelled by client',
  'cancelled by renter',
];

/**
 * Returns true if the booking is completed (car has been dropped off).
 * Used to exclude these from the main Bookings list and include them only in Past Bookings.
 * @param {Object} booking - Booking object with status (or string status)
 * @returns {boolean}
 */
export const isBookingCompleted = (booking) => {
  const status = typeof booking === 'string' ? booking : (booking?.status ?? '');
  const normalized = (status || '').toLowerCase().trim().replace(/\s+/g, ' ');
  return COMPLETED_STATUSES.some(s => normalized === s || normalized === s.replace(/_/g, ' '));
};

/**
 * @param {Object|string} booking - Booking object or status string
 * @returns {boolean}
 */
export const isBookingCancelled = (booking) => {
  const status = typeof booking === 'string' ? booking : (booking?.status ?? '');
  const normalized = (status || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!normalized) return false;
  return CANCELLED_STATUSES.some(
    (s) => normalized === s || normalized === s.replace(/_/g, ' ')
  );
};

/**
 * Display label for booking status. "Completed" is shown for any done/dropped-off booking.
 * @param {string} status - Raw status from API
 * @returns {string} User-facing label (e.g. "Completed", "Active", "Pending")
 */
export const getBookingStatusDisplayText = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (isBookingCompleted(s)) return 'Completed';
  if (isBookingCancelled(s)) return 'Cancelled';
  switch (s) {
    case 'confirmed':
    case 'active': return s.charAt(0).toUpperCase() + s.slice(1);
    case 'pending':
    case 'upcoming': return s === 'upcoming' ? 'Upcoming' : 'Pending';
    default: return status ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) : 'Unknown';
  }
};

/**
 * Coerce API money fields (number, string with commas / "KSh") to a finite number or null if absent.
 * @param {unknown} v
 * @returns {number|null}
 */
export const parseBookingMoney = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * Host-facing gross, commission, and payout from a booking list or detail object (matches ActiveBookingScreen logic).
 * @param {Object|null|undefined} booking
 * @returns {{ totalPrice: number, commissionAmount: number, payoutAmount: number }}
 */
export const deriveHostBookingFinancials = (booking) => {
  const b = booking || {};
  const totalPrice = parseBookingMoney(b.total_price) ?? 0;

  let commissionAmount =
    parseBookingMoney(b.commission_amount) ??
    parseBookingMoney(b.platform_commission) ??
    parseBookingMoney(b.commission) ??
    parseBookingMoney(b.platform_fee);

  let commissionRate =
    parseBookingMoney(b.commission_rate) ?? parseBookingMoney(b.platform_commission_rate);
  if (commissionRate != null && commissionRate > 1) {
    commissionRate = commissionRate / 100;
  }

  if (commissionAmount == null && commissionRate != null && totalPrice > 0) {
    commissionAmount = Math.round(totalPrice * commissionRate * 100) / 100;
  }
  if (commissionAmount == null && totalPrice > 0) {
    commissionAmount = Math.round(totalPrice * PLATFORM_FEE_PERCENTAGE * 100) / 100;
  }
  if (commissionAmount == null) commissionAmount = 0;

  let payoutAmount =
    parseBookingMoney(b.host_payout) ??
    parseBookingMoney(b.net_payout) ??
    parseBookingMoney(b.payout_amount) ??
    parseBookingMoney(b.host_earnings) ??
    parseBookingMoney(b.net_amount) ??
    parseBookingMoney(b.payout);

  if (payoutAmount == null && totalPrice > 0) {
    payoutAmount = Math.max(0, totalPrice - commissionAmount);
  }
  if (payoutAmount == null) payoutAmount = totalPrice;

  return { totalPrice, commissionAmount, payoutAmount };
};

/**
 * Host-facing totals for UI lists and detail. Cancelled bookings have no earnings;
 * do not show inferred commission/payout from a quote that was never completed.
 * @param {Object|null|undefined} booking
 * @returns {{ totalPrice: number, commissionAmount: number, payoutAmount: number, hasEarnings: boolean }}
 */
export const getHostBookingMoneyForDisplay = (booking) => {
  if (!booking || typeof booking !== 'object') {
    return { totalPrice: 0, commissionAmount: 0, payoutAmount: 0, hasEarnings: false };
  }
  if (isBookingCancelled(booking)) {
    return { totalPrice: 0, commissionAmount: 0, payoutAmount: 0, hasEarnings: false };
  }
  const { totalPrice, commissionAmount, payoutAmount } = deriveHostBookingFinancials(booking);
  return { totalPrice, commissionAmount, payoutAmount, hasEarnings: true };
};

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

    // Bypass backend Redis on the first request after login so a freshly
    // created account never sees the previous user's booking data.
    const cacheHeaders = isFreshLogin()
      ? { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      : {};

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...cacheHeaders,
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
      
      // Token expired or invalid - logout user
      if (response.status === 401) {
        console.log('📅 [GET HOST BOOKINGS API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
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
    // Log first booking keys so we can verify client name field name from API
    if (bookingsArray.length > 0) {
      const first = bookingsArray[0];
      const clientKeys = Object.keys(first).filter(k => /client|renter|booker|name/i.test(k));
      console.log('📅 [GET HOST BOOKINGS API] First booking client-related keys:', clientKeys);
      console.log('📅 [GET HOST BOOKINGS API] Client name value:', getClientDisplayName(first));
    }

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
export const getBookingDetails = async (bookingId, opts = {}) => {
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

    // Bypass backend Redis when caller explicitly requests fresh data
    // (e.g. immediately after a status mutation like confirm-pickup/dropoff).
    const cacheHeaders = opts.noCache
      ? { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      : {};

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...cacheHeaders,
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
        console.log('📅 [GET BOOKING DETAILS API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
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
    if (bookingData) {
      const clientKeys = Object.keys(bookingData).filter(k => /client|renter|booker|name/i.test(k));
      console.log('📅 [GET BOOKING DETAILS API] Client-related keys:', clientKeys);
      console.log('📅 [GET BOOKING DETAILS API] Client name value:', getClientDisplayName(bookingData));
    }

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
        console.log('📅 [CONFIRM PICKUP API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
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
        console.log('📅 [CONFIRM DROPOFF API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
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

/**
 * Delete a completed or cancelled booking for the authenticated host.
 * Backend enforces:
 * - booking must belong to host
 * - status must be "completed" or "cancelled"
 * - returns 404 if not found for host
 */
export const deleteBooking = async (bookingId) => {
  if (!bookingId) {
    return {
      success: false,
      error: 'Booking ID is required',
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_DELETE_BOOKING(bookingId));
  const startTime = Date.now();
  console.log('📅 [DELETE BOOKING API] Deleting booking...', { bookingId, url });

  try {
    const token = await getUserToken();
    if (!token) {
      console.error('📅 [DELETE BOOKING API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('📅 [DELETE BOOKING API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete booking';
      try {
        const errorData = await response.json();
        console.error('📅 [DELETE BOOKING API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err) => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else if (errorData.detail || errorData.message) {
          errorMessage = errorData.detail || errorData.message;
        }
      } catch (e) {
        console.error('📅 [DELETE BOOKING API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        console.log('📅 [DELETE BOOKING API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }

      // 404 is returned when booking is not found for that host
      if (response.status === 404) {
        return {
          success: false,
          error: 'Booking not found for this account.',
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    console.log('📅 [DELETE BOOKING API] ✅ SUCCESS! Booking deleted:', {
      bookingId,
      totalTime: `${Date.now() - startTime}ms`,
    });

    return {
      success: true,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`📅 [DELETE BOOKING API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
};
