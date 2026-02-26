/**
 * Client Profile Service - Host view of client/renter profile
 * GET /api/v1/host/clients/{client_id}/profile
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';
import { handleTokenExpiration } from '../utils/logoutHandler';

/**
 * Fetch host-facing profile for a client (renter).
 * Returns: id, full_name, email, avatar_url, trips_count, average_rating
 *
 * @param {string|number} clientId - Client ID (integer or string)
 * @returns {Promise<{ success: boolean, profile?: Object, error?: string }>}
 */
export const getHostClientProfile = async (clientId) => {
  if (clientId == null || clientId === '') {
    return { success: false, error: 'Missing client_id', profile: null };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_CLIENT_PROFILE(clientId));

  try {
    const token = await getUserToken();
    if (!token) {
      return {
        success: false,
        profile: null,
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
      let errorMessage = 'Failed to fetch client profile';
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
        profile: null,
        error: errorMessage,
      };
    }

    const data = await response.json();
    const profile = {
      id: data.id,
      full_name: data.full_name ?? '',
      email: data.email ?? '',
      avatar_url: data.avatar_url ?? null,
      trips_count: data.trips_count != null ? Number(data.trips_count) : 0,
      average_rating: data.average_rating != null ? Number(data.average_rating) : null,
    };

    return {
      success: true,
      profile,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      profile: null,
      error: err?.message || 'Failed to fetch client profile',
    };
  }
};
