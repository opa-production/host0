/**
 * Rating Service - Host client ratings (submit and fetch)
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';
import { handleTokenExpiration } from '../utils/logoutHandler';

/**
 * Fetch ratings for a client (to show client rating summary on past booking).
 * GET /api/v1/clients/{client_id}/ratings
 *
 * @param {string} clientId - Client UUID
 * @returns {Promise<{ success: boolean, ratings?: Array, average?: number, count?: number, error?: string }>}
 */
export const getClientRatings = async (clientId) => {
  if (!clientId) {
    return { success: false, ratings: [], average: 0, count: 0, error: 'Missing client_id' };
  }

  const url = getApiUrl(API_ENDPOINTS.CLIENT_RATINGS(clientId));

  try {
    const token = await getUserToken();
    if (!token) {
      return {
        success: false,
        ratings: [],
        average: 0,
        count: 0,
        error: 'No authentication token found',
      };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      let errorMessage = 'Failed to fetch client ratings';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage =
            typeof errorData.detail === 'string'
              ? errorData.detail
              : Array.isArray(errorData.detail)
                ? errorData.detail.map((d) => d.msg || d).join(', ')
                : JSON.stringify(errorData.detail);
        }
      } catch (_) {
        errorMessage = response.statusText || errorMessage;
      }
      return {
        success: false,
        ratings: [],
        average: 0,
        count: 0,
        error: errorMessage,
      };
    }

    const data = await response.json();

    // API returns { ratings: [...], total: N, average_rating: 4.5 }; fallbacks for other shapes
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.ratings)
        ? data.ratings
        : Array.isArray(data.items)
          ? data.items
          : [];
    const count = list.length;
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const computedAvg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    return {
      success: true,
      ratings: list,
      average: Number(data.average_rating) ?? Number(data.average) ?? computedAvg,
      count: Number(data.total) ?? Number(data.count) ?? count,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      ratings: [],
      average: 0,
      count: 0,
      error: err?.message || 'Failed to fetch client ratings',
    };
  }
};

/**
 * Submit a host rating for a client (after a completed booking).
 * POST /api/v1/host/client-ratings
 * Backend expects: client_id (int), rating (int 1-5), review (string, optional), booking_id (int, optional).
 *
 * @param {Object} payload - { client_id: string|number, booking_id?: string|number, rating: number, note?: string }
 * @returns {Promise<{ success: boolean, rating?: Object, error?: string }>}
 */
export const submitHostClientRating = async (payload) => {
  const { client_id, booking_id, rating, note } = payload || {};

  if (client_id == null || client_id === '' || rating == null) {
    return {
      success: false,
      error: 'Missing client_id or rating',
    };
  }

  const clientIdInt = parseInt(client_id, 10);
  if (Number.isNaN(clientIdInt)) {
    return {
      success: false,
      error: 'client_id must be an integer',
    };
  }

  const ratingInt = Math.round(Number(rating)) || 0;
  if (ratingInt < 1 || ratingInt > 5) {
    return {
      success: false,
      error: 'Rating must be an integer between 1 and 5',
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_CLIENT_RATINGS);

  try {
    const token = await getUserToken();
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    const body = {
      client_id: clientIdInt,
      rating: ratingInt,
      ...(note != null && String(note).trim() !== '' ? { review: String(note).trim().slice(0, 1000) } : {}),
    };
    if (booking_id != null && booking_id !== '') {
      const bookingIdInt = parseInt(booking_id, 10);
      if (!Number.isNaN(bookingIdInt)) {
        body.booking_id = bookingIdInt;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401) {
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      let errorMessage = 'Failed to submit rating';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage =
            typeof errorData.detail === 'string'
              ? errorData.detail
              : Array.isArray(errorData.detail)
                ? errorData.detail.map((d) => d.msg || d).join(', ')
                : JSON.stringify(errorData.detail);
        }
      } catch (_) {
        errorMessage = response.statusText || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    const created = data.rating ?? data;

    return {
      success: true,
      rating: created,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || 'Failed to submit rating',
    };
  }
};
