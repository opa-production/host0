import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * KYC Lookup (Step 1)
 * POST /api/v1/host/kyc/lookup
 */
export const lookupKycDetails = async (idType, idNumber, country = 'KE') => {
  const token = await getUserToken();
  if (!token) return { success: false, error: 'Not logged in' };

  const url = getApiUrl(API_ENDPOINTS.HOST_KYC_LOOKUP || '/api/v1/host/kyc/lookup');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_type: idType, id_number: idNumber, country }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.detail || 'ID lookup failed' };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Initialize Dojah Widget (Step 2)
 * POST /api/v1/host/kyc/initialize
 */
export const initializeKycWidget = async () => {
  const token = await getUserToken();
  if (!token) return { success: false, error: 'Not logged in' };

  const url = getApiUrl(API_ENDPOINTS.HOST_KYC_INITIALIZE || '/api/v1/host/kyc/initialize');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: data.detail || 'Failed to initialize verification' };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get current host KYC status (Dojah)
 * GET /api/v1/host/kyc/status
 */
export const getKycStatus = async () => {
  const token = await getUserToken();
  if (!token) {
    return { success: false, error: 'Not logged in' };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_KYC_STATUS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) return { success: true, status: null };
      return { success: false, error: data.detail || 'Failed to load status' };
    }

    return { success: true, status: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
