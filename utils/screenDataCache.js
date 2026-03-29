/**
 * In-memory caches that survive React unmount (e.g. stack pop).
 * Lets list screens show the last successful payload immediately while refetching.
 */

export const myListingsScreenCache = {
  cars: null,
  fetchedOnce: false,
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

/** Transformed rows for Add Payment Method screen — avoids refetch + full-screen loading on every focus. */
export const addPaymentMethodScreenCache = {
  savedMethods: [],
  loadedOnce: false,
};

/** Map<bookingId string, { mappedBooking, clientAvatar }> — survives stack pop so reopening the same booking avoids a full refetch. */
export const activeBookingScreenCache = new Map();

/** Call on logout so the next user never sees the previous session's lists. */
export function resetScreenDataCaches() {
  myListingsScreenCache.cars = null;
  myListingsScreenCache.fetchedOnce = false;
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
