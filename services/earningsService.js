/**
 * Earnings Service - Host earnings summary from backend
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';
import { handleTokenExpiration } from '../utils/logoutHandler';

/**
 * Get host earnings summary (dashboard/home).
 * GET /api/v1/host/earnings/summary
 *
 * @returns {Promise<Object>} Result with success and summary or error
 * Summary: total_gross, commission_rate, commission_amount, net_earnings, withdrawable, paid_bookings_count
 */
export const getHostEarningsSummary = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_EARNINGS_SUMMARY);

  try {
    const token = await getUserToken();
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
        summary: null,
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
      let errorMessage = 'Failed to fetch earnings summary';
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
      return {
        success: false,
        error: errorMessage,
        summary: null,
      };
    }

    const data = await response.json();

    // API may return summary at top level or under a key
    const raw = data.summary ?? data;
    const summary = {
      total_gross: Number(raw.total_gross) || 0,
      commission_rate: Number(raw.commission_rate) ?? 0.15,
      commission_amount: Number(raw.commission_amount) || 0,
      net_earnings: Number(raw.net_earnings) || 0,
      withdrawable: Number(raw.withdrawable) || 0,
      paid_bookings_count: Number(raw.paid_bookings_count) || 0,
    };

    return {
      success: true,
      summary,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error',
      summary: null,
    };
  }
};

/**
 * Map a single transaction from API to UI shape.
 * API may use: id, amount, type, description, created_at, title, subtitle, etc.
 */
function mapTransactionItem(item) {
  const id = item.id ?? item.transaction_id ?? `${item.created_at}-${item.amount}`;
  const amount = Number(item.amount) ?? 0;
  const title = item.title ?? item.type ?? item.description ?? 'Transaction';
  const rawDate = item.created_at ?? item.date ?? item.updated_at;
  const subtitle = rawDate
    ? (typeof rawDate === 'string' ? new Date(rawDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '')
    : (item.subtitle ?? '');
  const sortDate = rawDate ? new Date(rawDate).getTime() : 0;

  return { id: String(id), title, subtitle, amount, sortDate };
}

/**
 * Get host earnings transactions.
 * GET /api/v1/host/earnings/transactions
 *
 * @param {Object} options - Optional: { limit, skip } for pagination if API supports
 * @returns {Promise<Object>} Result with success and transactions[] or error
 */
export const getHostEarningsTransactions = async (options = {}) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_EARNINGS_TRANSACTIONS);
  const { limit, skip } = options;
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (skip != null) params.set('skip', String(skip));
  const query = params.toString();
  const fullUrl = query ? `${url}?${query}` : url;

  try {
    const token = await getUserToken();
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
        transactions: [],
      };
    }

    const response = await fetch(fullUrl, {
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
      let errorMessage = 'Failed to fetch transactions';
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
      return {
        success: false,
        error: errorMessage,
        transactions: [],
      };
    }

    const data = await response.json();

    // API may return array directly or under a key
    const rawList = Array.isArray(data) ? data : (data.transactions ?? data.items ?? []);
    const transactions = rawList.map(mapTransactionItem);

    return {
      success: true,
      transactions,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Network error',
      transactions: [],
    };
  }
};
