import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * Create a KYC (Veriff) session. Returns the verification URL to open.
 * POST /api/v1/host/kyc/session
 * @returns {{ success: boolean, verification_url?: string, error?: string }}
 */
export const createKycSession = async () => {
  const token = await getUserToken();
  if (!token) {
    return { success: false, error: 'Not logged in' };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_KYC_SESSION);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = data.detail || data.message || data.error || 'Failed to create verification session';
      return { success: false, error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage) };
    }

    const verificationUrl = data.verification_url ?? data.url ?? data.session_url ?? data.verificationUrl;
    if (!verificationUrl || typeof verificationUrl !== 'string') {
      return { success: false, error: 'No verification URL in response' };
    }
    return { success: true, verification_url: verificationUrl };
  } catch (error) {
    console.error('[KYC] createKycSession error:', error);
    return {
      success: false,
      error: error.message || 'Network error. Please try again.',
    };
  }
};

/**
 * Get current host KYC status.
 * GET /api/v1/host/kyc/status
 * @returns {{ success: boolean, status?: object, error?: string }}
 * status: { user_id, veriff_session_id, status, document_type, decision_reason, verified_at }
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
      // 404 or no status yet is acceptable - treat as "no status"
      if (response.status === 404) {
        return { success: true, status: null };
      }
      const errorMessage = data.detail || data.message || data.error || 'Failed to load verification status';
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      };
    }

    return { success: true, status: data };
  } catch (error) {
    console.error('[KYC] getKycStatus error:', error);
    return {
      success: false,
      error: error.message || 'Failed to load status',
    };
  }
};
