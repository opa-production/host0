import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * Fetch extension requests for a booking (host view).
 */
export const getBookingExtensions = async (bookingId) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_BOOKING_EXTENSIONS(bookingId));

  try {
    const token = await getUserToken();
    if (!token) return { success: false, error: 'No authentication token found' };

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let msg = 'Failed to fetch extensions';
      try {
        const err = await response.json();
        msg = err.detail || err.message || msg;
      } catch (_) {}
      return { success: false, error: msg };
    }

    const data = await response.json();
    return { success: true, extensions: data.extensions || data || [] };
  } catch (error) {
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Approve a pending extension request.
 */
export const approveExtension = async (bookingId, extensionId) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_BOOKING_EXTENSION_APPROVE(bookingId, extensionId));

  try {
    const token = await getUserToken();
    if (!token) return { success: false, error: 'No authentication token found' };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let msg = 'Failed to approve extension';
      try {
        const err = await response.json();
        msg = err.detail || err.message || msg;
      } catch (_) {}
      return { success: false, error: msg };
    }

    const data = await response.json();
    return { success: true, extension: data };
  } catch (error) {
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Reject a pending extension request with an optional reason.
 */
export const rejectExtension = async (bookingId, extensionId, reason = '') => {
  const url = getApiUrl(API_ENDPOINTS.HOST_BOOKING_EXTENSION_REJECT(bookingId, extensionId));

  try {
    const token = await getUserToken();
    if (!token) return { success: false, error: 'No authentication token found' };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      let msg = 'Failed to reject extension';
      try {
        const err = await response.json();
        msg = err.detail || err.message || msg;
      } catch (_) {}
      return { success: false, error: msg };
    }

    const data = await response.json();
    return { success: true, extension: data };
  } catch (error) {
    return { success: false, error: error.message || 'Network error' };
  }
};
