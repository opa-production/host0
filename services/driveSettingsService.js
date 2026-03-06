import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * Get drive settings for a car.
 * @returns {Promise<{success: boolean, drive_setting?: string, allowed_drive_types?: string[], error?: string}>}
 */
export const getCarDriveSettings = async (carId) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_CAR_DRIVE_SETTINGS(carId));

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
      let msg = 'Failed to fetch drive settings';
      try {
        const err = await response.json();
        msg = err.detail || err.message || msg;
      } catch (_) {}
      return { success: false, error: msg };
    }

    const data = await response.json();
    return {
      success: true,
      drive_setting: data.drive_setting,
      allowed_drive_types: data.allowed_drive_types || [],
    };
  } catch (error) {
    return { success: false, error: error.message || 'Network error' };
  }
};

/**
 * Update drive settings for a car.
 * @param {number|string} carId
 * @param {string} driveSetting - self_only | self_and_chauffeur | chauffeur_only
 * @returns {Promise<{success: boolean, drive_setting?: string, allowed_drive_types?: string[], error?: string}>}
 */
export const updateCarDriveSettings = async (carId, driveSetting) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_CAR_DRIVE_SETTINGS(carId));

  try {
    const token = await getUserToken();
    if (!token) return { success: false, error: 'No authentication token found' };

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ drive_setting: driveSetting }),
    });

    if (!response.ok) {
      let msg = 'Failed to update drive settings';
      try {
        const err = await response.json();
        msg = err.detail || err.message || msg;
      } catch (_) {}
      return { success: false, error: msg };
    }

    const data = await response.json();
    return {
      success: true,
      drive_setting: data.drive_setting,
      allowed_drive_types: data.allowed_drive_types || [],
    };
  } catch (error) {
    return { success: false, error: error.message || 'Network error' };
  }
};
