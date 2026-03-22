/**
 * Host business subscription (Starter / Premium) — M-Pesa STK checkout.
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';
import { handleTokenExpiration } from '../utils/logoutHandler';

function parseDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg || String(e)).join(', ');
  if (typeof detail === 'object') return Object.values(detail).flat().join(', ');
  return String(detail);
}

/**
 * Normalize phone for subscription checkout (254…).
 * @param {string} phone
 */
export function normalizeMpesaPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

/**
 * GET /host/subscription/plans — no auth.
 * @returns {Promise<{ success: boolean, plans?: Array, error?: string }>}
 */
export const getSubscriptionPlans = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_SUBSCRIPTION_PLANS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: parseDetail(data.detail) || data.message || 'Failed to load plans',
      };
    }
    let plans = [];
    if (Array.isArray(data.plans)) plans = data.plans;
    else if (Array.isArray(data.data?.plans)) plans = data.data.plans;
    else if (Array.isArray(data)) plans = data;
    return { success: true, plans, raw: data };
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
};

/**
 * GET /host/subscription/me
 * @returns {Promise<{ success: boolean, subscription?: object, error?: string }>}
 */
export const getHostSubscription = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_SUBSCRIPTION_ME);
  try {
    const token = await getUserToken();
    if (!token) {
      return { success: false, error: 'Not signed in' };
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      await handleTokenExpiration();
      return { success: false, error: 'Session expired. Please sign in again.' };
    }
    if (!response.ok) {
      return {
        success: false,
        error: parseDetail(data.detail) || data.message || 'Failed to load subscription',
      };
    }
    return { success: true, subscription: data };
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
};

/**
 * POST /host/subscription/checkout
 * @param {{ plan: 'starter'|'premium', phone_number: string }} body
 */
export const startSubscriptionCheckout = async ({ plan, phone_number }) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_SUBSCRIPTION_CHECKOUT);
  try {
    const token = await getUserToken();
    if (!token) {
      return { success: false, error: 'Not signed in' };
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        plan,
        phone_number: normalizeMpesaPhone(phone_number),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      await handleTokenExpiration();
      return { success: false, error: 'Session expired. Please sign in again.' };
    }
    if (!response.ok) {
      return {
        success: false,
        error: parseDetail(data.detail) || data.message || 'Checkout failed',
      };
    }
    return {
      success: true,
      checkout_request_id: data.checkout_request_id,
      external_reference: data.external_reference,
      amount_kes: data.amount_kes,
      plan: data.plan,
      message: data.message,
      raw: data,
    };
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
};

/**
 * Map many possible backend / M-Pesa shapes to a single poll state.
 * @param {object} data - JSON body from payment-status (or nested .data)
 * @returns {{ outcome: 'pending'|'completed'|'failed'|'cancelled', hint?: string }}
 */
export function normalizeSubscriptionPaymentOutcome(data) {
  if (!data || typeof data !== 'object') {
    return { outcome: 'pending' };
  }

  const root = data.data && typeof data.data === 'object' ? { ...data, ...data.data } : data;

  const pickStr = (...vals) => {
    for (const v of vals) {
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };

  const statusStr = pickStr(
    root.status,
    root.payment_status,
    root.state,
    root.mpesa_status,
    root.transaction_status,
    root.stk_status,
    root.callback_status
  );

  const lower = statusStr.toLowerCase().replace(/\s+/g, '_');

  // Explicit status strings
  if (['completed', 'complete', 'success', 'successful', 'paid', 'confirmed'].includes(lower)) {
    return { outcome: 'completed' };
  }
  if (
    ['failed', 'failure', 'fail', 'declined', 'error', 'unsuccessful', 'rejected', 'unsuccess'].includes(lower) ||
    lower.includes('fail') ||
    lower.includes('declin') ||
    lower.includes('reject')
  ) {
    return {
      outcome: 'failed',
      hint: pickStr(root.message, root.detail, root.result_desc, root.ResultDesc, root.reason),
    };
  }
  if (['cancelled', 'canceled', 'cancel', 'cancelled_by_user'].includes(lower) || lower.includes('cancel')) {
    return { outcome: 'cancelled' };
  }

  // Safaricom-style codes on the payload
  const resultCode = root.ResultCode ?? root.result_code ?? root.resultCode;
  if (resultCode !== undefined && resultCode !== null && String(resultCode).trim() !== '') {
    const code = String(resultCode).trim();
    if (code !== '0') {
      return {
        outcome: 'failed',
        hint: pickStr(root.ResultDesc, root.result_desc, root.message),
      };
    }
    if (code === '0') {
      return { outcome: 'completed' };
    }
  }

  if (root.payment_success === false || root.success === false) {
    return {
      outcome: 'failed',
      hint: pickStr(
        root.message,
        typeof root.detail === 'string' ? root.detail : parseDetail(root.detail)
      ),
    };
  }
  if (root.payment_success === true || root.success === true) {
    return { outcome: 'completed' };
  }
  if (root.paid === false) {
    return { outcome: 'failed', hint: pickStr(root.message, root.reason) };
  }
  if (root.paid === true) {
    return { outcome: 'completed' };
  }

  // Infer from free-text fields when status is missing or unknown
  const blob = `${pickStr(root.message, root.detail, root.ResultDesc, root.result_desc)}`.toLowerCase();
  if (blob.includes('fail') || blob.includes('declin') || blob.includes('reject') || blob.includes('error')) {
    return { outcome: 'failed', hint: pickStr(root.message, root.detail, root.ResultDesc) };
  }
  if (blob.includes('cancel')) {
    return { outcome: 'cancelled' };
  }
  if (blob.includes('success') || blob.includes('complete') || blob.includes('paid')) {
    return { outcome: 'completed' };
  }

  if (!statusStr) {
    return { outcome: 'pending' };
  }

  // Known “still waiting” words
  if (
    ['pending', 'processing', 'initiated', 'stk_sent', 'waiting', 'in_progress', 'queued', 'unknown'].includes(
      lower
    ) ||
    lower.includes('pending')
  ) {
    return { outcome: 'pending' };
  }

  return { outcome: 'pending' };
}

/**
 * GET /host/subscription/payment-status?checkout_request_id=…
 */
export const getSubscriptionPaymentStatus = async (checkoutRequestId) => {
  const base = getApiUrl(API_ENDPOINTS.HOST_SUBSCRIPTION_PAYMENT_STATUS);
  const url = `${base}?checkout_request_id=${encodeURIComponent(checkoutRequestId)}`;
  try {
    const token = await getUserToken();
    if (!token) {
      return { success: false, error: 'Not signed in' };
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      await handleTokenExpiration();
      return { success: false, error: 'Session expired.' };
    }
    if (!response.ok) {
      return {
        success: false,
        error: parseDetail(data.detail) || data.message || 'Status check failed',
      };
    }
    const status = data.status ?? data.payment_status ?? data.state;
    const normalized = normalizeSubscriptionPaymentOutcome(data);
    return { success: true, status, raw: data, normalized };
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
};

const POLL_INTERVAL_MS = 2500;
const POLL_MAX_MS = 90000;

/**
 * Poll until completed | failed | cancelled | timeout
 * @returns {Promise<{ outcome: 'completed'|'failed'|'cancelled'|'timeout'|'error', message?: string }>}
 */
export const pollSubscriptionPaymentStatus = async (checkoutRequestId, options = {}) => {
  const maxMs = options.maxMs ?? POLL_MAX_MS;
  const intervalMs = options.intervalMs ?? POLL_INTERVAL_MS;
  const start = Date.now();
  const onPoll = typeof options.onPoll === 'function' ? options.onPoll : null;

  while (Date.now() - start < maxMs) {
    const res = await getSubscriptionPaymentStatus(checkoutRequestId);
    if (!res.success) {
      return { outcome: 'error', message: res.error || 'Status check failed' };
    }

    const { outcome, hint } = res.normalized || normalizeSubscriptionPaymentOutcome(res.raw);

    if (__DEV__ && res.raw) {
      console.log('[subscription poll]', {
        checkout_request_id: checkoutRequestId,
        outcome,
        rawKeys: Object.keys(res.raw || {}),
        status: res.status,
        hint,
      });
    }

    if (onPoll) {
      try {
        onPoll({ outcome, raw: res.raw, hint });
      } catch (_) {
        /* ignore */
      }
    }

    if (outcome === 'completed') {
      return { outcome: 'completed' };
    }
    if (outcome === 'failed') {
      return {
        outcome: 'failed',
        message: hint || res.raw?.message || 'M-Pesa payment failed.',
      };
    }
    if (outcome === 'cancelled') {
      return { outcome: 'cancelled', message: hint || 'Payment was cancelled.' };
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { outcome: 'timeout' };
};
