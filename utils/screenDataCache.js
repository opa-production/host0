/**
 * Session-aware in-memory caches for UX smoothness only.
 *
 * Caching tiers:
 *  - SENSITIVE data (cars, bookings, earnings, balance):
 *      No app-level persistence. Backend Redis is the single source of truth.
 *      Module-level refs here are only a UX buffer (instant display while the
 *      fresh API response loads).  They are wiped on every new login session.
 *
 *  - NON-SENSITIVE data (profile, preferences):
 *      Cached in AsyncStorage by userStorage.  Safe to keep across sessions
 *      because it is always keyed by user_id.
 *
 * On every login call markNewSession() — this generates a new session ID,
 * records the login timestamp, and zeroes all in-memory buffers so the next
 * user never briefly sees the previous user's data.
 *
 * isFreshLogin() returns true for 60 s after login.  Services use this to
 * add `Cache-Control: no-cache` headers, forcing the backend to skip Redis
 * and return authoritative DB data for the first wave of requests.
 */

// ─── Session state ────────────────────────────────────────────────────────────

/** Opaque ID that changes on every login.  Lets any consumer know when the
 *  session has rotated without needing a shared mutable flag. */
let _sessionId = null;

/** Epoch ms of the most recent login.  0 means "no active session". */
let _loginTimestamp = 0;

/**
 * Call this immediately on every login (before navigating to the app).
 * Clears all in-memory caches and arms the fresh-login bypass window.
 */
export function markNewSession() {
  _sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  _loginTimestamp = Date.now();
  _clearAllCaches();
}

/**
 * Returns true when we are within `withinMs` milliseconds of the most recent
 * login.  Used by API services to add Cache-Control: no-cache headers so that
 * backend Redis is bypassed for the first wave of sensitive requests.
 *
 * @param {number} [withinMs=60000]  Window in ms (default 60 s)
 */
export function isFreshLogin(withinMs = 60_000) {
  return _loginTimestamp > 0 && Date.now() - _loginTimestamp < withinMs;
}

/** Returns the current session ID (null when logged out). */
export function getSessionId() {
  return _sessionId;
}

// ─── Cache objects ────────────────────────────────────────────────────────────

/**
 * UX buffer for My Cars screen.
 * SENSITIVE — only use for instant display; always back with a live API call.
 */
export const myListingsScreenCache = {
  cars: null,
  fetchedOnce: false,
  cachedUserId: null,
};

export const messagesScreenCache = {
  supportConversation: null,
  clientConversations: [],
  unreadCount: 0,
  loadedOnce: false,
};

export const notificationsScreenCache = {
  notifications: [],
  loadedOnce: false,
};

export const addPaymentMethodScreenCache = {
  savedMethods: [],
  loadedOnce: false,
};

export const activeBookingScreenCache = new Map();

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _clearAllCaches() {
  myListingsScreenCache.cars = null;
  myListingsScreenCache.fetchedOnce = false;
  myListingsScreenCache.cachedUserId = null;

  messagesScreenCache.supportConversation = null;
  messagesScreenCache.clientConversations = [];
  messagesScreenCache.unreadCount = 0;
  messagesScreenCache.loadedOnce = false;

  notificationsScreenCache.notifications = [];
  notificationsScreenCache.loadedOnce = false;

  addPaymentMethodScreenCache.savedMethods = [];
  addPaymentMethodScreenCache.loadedOnce = false;

  activeBookingScreenCache.clear();
}

// ─── Public reset (logout) ────────────────────────────────────────────────────

/**
 * Call on logout.  Clears all in-memory caches and disarms the fresh-login
 * bypass window so no stale Cache-Control headers are added after logout.
 */
export function resetScreenDataCaches() {
  _sessionId = null;
  _loginTimestamp = 0;
  _clearAllCaches();
}
