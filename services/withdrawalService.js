/**
 * Withdrawal Service - Host withdrawals (create and list)
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';
import { handleTokenExpiration } from '../utils/logoutHandler';
import { isFreshLogin } from '../utils/screenDataCache';

/**
 * Create a withdrawal request.
 * POST /api/v1/host/withdrawals
 * @param {Object} params
 * @param {number} params.amount - Amount to withdraw (<= withdrawable)
 * @param {string} params.payment_method_type - 'mpesa' or 'bank'
 * @param {string} [params.mpesa_number] - Required when payment_method_type is mpesa (e.g. 254712345678)
 * @param {string} [params.bank_name] - Required when payment_method_type is bank
 * @param {string} [params.account_number] - Required when payment_method_type is bank
 * @param {string} [params.account_name] - Required when payment_method_type is bank (e.g. "John Smith")
 * @returns {Promise<Object>} Result with success and data or error
 */
export const createWithdrawal = async ({ amount, payment_method_type, mpesa_number, bank_name, account_number, account_name }) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_WITHDRAWALS);

  try {
    const token = await getUserToken();
    if (!token) {
      return { success: false, error: 'No authentication token found', data: null };
    }

    const body = {
      amount: Number(amount),
      payment_method_type: payment_method_type === 'mpesa' ? 'mpesa' : 'bank',
    };
    if (body.payment_method_type === 'mpesa') {
      if (!mpesa_number || !String(mpesa_number).replace(/\D/g, '')) {
        return { success: false, error: 'M-Pesa number is required', data: null };
      }
      body.mpesa_number = String(mpesa_number).replace(/\D/g, '');
    } else {
      if (!bank_name || !account_number) {
        return { success: false, error: 'Bank name and account number are required', data: null };
      }
      body.bank_name = String(bank_name).trim();
      body.account_number = String(account_number).trim();
      if (account_name != null && String(account_name).trim()) {
        body.account_name = String(account_name).trim();
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 401) {
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      let errorMessage = 'Failed to submit withdrawal';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : Array.isArray(errorData.detail)
              ? errorData.detail.map((d) => d.msg || d).join(', ')
              : JSON.stringify(errorData.detail);
        }
      } catch (_) {
        errorMessage = response.statusText || errorMessage;
      }
      return { success: false, error: errorMessage, data: null };
    }

    const data = await response.json();
    return { success: true, data, error: null };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error',
      data: null,
    };
  }
};

/**
 * List host withdrawals.
 * GET /api/v1/host/withdrawals
 * @param {Object} options - Optional: { limit, skip }
 * @returns {Promise<Object>} Result with success, withdrawals[], total, skip, limit or error
 */
export const getHostWithdrawals = async (options = {}) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_WITHDRAWALS);
  const { limit, skip } = options;
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (skip != null) params.set('skip', String(skip));
  const query = params.toString();
  const fullUrl = query ? `${url}?${query}` : url;

  try {
    const token = await getUserToken();
    if (!token) {
      return { success: false, error: 'No authentication token found', withdrawals: [], total: 0 };
    }

    const cacheHeaders = isFreshLogin()
      ? { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      : {};

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...cacheHeaders,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      let errorMessage = 'Failed to fetch withdrawals';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : Array.isArray(errorData.detail)
              ? errorData.detail.map((d) => d.msg || d).join(', ')
              : JSON.stringify(errorData.detail);
        }
      } catch (_) {
        errorMessage = response.statusText || errorMessage;
      }
      return { success: false, error: errorMessage, withdrawals: [], total: 0 };
    }

    const data = await response.json();
    const list = data.withdrawals ?? [];
    const total = data.total ?? list.length;
    const skipVal = data.skip ?? 0;
    const limitVal = data.limit ?? list.length;

    return {
      success: true,
      withdrawals: list,
      total,
      skip: skipVal,
      limit: limitVal,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error',
      withdrawals: [],
      total: 0,
    };
  }
};

/**
 * Map a withdrawal to the same shape as a transaction for display in the transactions list.
 * @param {Object} w - Withdrawal from API
 * @returns {{ id: string, title: string, subtitle: string, amount: number }}
 */
export function withdrawalToTransactionItem(w) {
  const id = `withdrawal-${w.id ?? w.created_at}`;
  const amount = -Math.abs(Number(w.amount) || 0);
  const rawDate = w.created_at ?? w.processed_at ?? w.updated_at;
  const subtitle = rawDate
    ? (typeof rawDate === 'string' ? new Date(rawDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '')
    : '';
  const status = w.status ? ` (${w.status})` : '';
  const sortDate = rawDate ? new Date(rawDate).getTime() : 0;
  return {
    id,
    title: `Withdrawal${status}`,
    subtitle,
    amount,
    sortDate,
    withdrawalStatus: (w.status || '').toLowerCase(),
  };
}
