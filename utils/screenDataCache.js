import AsyncStorage from '@react-native-async-storage/async-storage';

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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const PAST_BOOKINGS_CACHE_PREFIX = '@past_bookings_cache_';
const PAST_BOOKING_DETAIL_CACHE_PREFIX = '@past_booking_detail_cache_';

export const pastBookingsScreenCache = {
  bookings: [],
  loadedOnce: false,
  lastUpdatedAt: 0,
};

export const pastBookingDetailScreenCache = new Map();

function isFreshTimestamp(timestamp) {
  return Number.isFinite(timestamp) && timestamp > 0 && Date.now() - timestamp < THIRTY_DAYS_MS;
}

function pastBookingsStorageKey(userId) {
  return `${PAST_BOOKINGS_CACHE_PREFIX}${userId || 'local'}`;
}

function pastBookingDetailStorageKey(userId, bookingId) {
  return `${PAST_BOOKING_DETAIL_CACHE_PREFIX}${userId || 'local'}_${bookingId}`;
}

export async function getPastBookingsCached(userId) {
  if (
    pastBookingsScreenCache.loadedOnce &&
    isFreshTimestamp(pastBookingsScreenCache.lastUpdatedAt)
  ) {
    return pastBookingsScreenCache.bookings || [];
  }

  try {
    const raw = await AsyncStorage.getItem(pastBookingsStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.bookings) &&
      isFreshTimestamp(Number(parsed.lastUpdatedAt))
    ) {
      pastBookingsScreenCache.bookings = parsed.bookings;
      pastBookingsScreenCache.loadedOnce = true;
      pastBookingsScreenCache.lastUpdatedAt = Number(parsed.lastUpdatedAt);
      return parsed.bookings;
    }
  } catch (error) {
    console.warn('Failed to read past bookings cache:', error?.message || error);
  }

  return null;
}

export async function setPastBookingsCached(userId, bookings) {
  const payload = {
    bookings: Array.isArray(bookings) ? bookings : [],
    lastUpdatedAt: Date.now(),
  };
  pastBookingsScreenCache.bookings = payload.bookings;
  pastBookingsScreenCache.loadedOnce = true;
  pastBookingsScreenCache.lastUpdatedAt = payload.lastUpdatedAt;

  try {
    await AsyncStorage.setItem(pastBookingsStorageKey(userId), JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to save past bookings cache:', error?.message || error);
  }
}

export async function getPastBookingDetailCached(userId, bookingId) {
  if (!bookingId) return null;
  const key = String(bookingId);
  const memoryEntry = pastBookingDetailScreenCache.get(key);
  if (memoryEntry && isFreshTimestamp(Number(memoryEntry.lastUpdatedAt))) {
    return memoryEntry.data || null;
  }

  try {
    const raw = await AsyncStorage.getItem(pastBookingDetailStorageKey(userId, key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && isFreshTimestamp(Number(parsed.lastUpdatedAt))) {
      pastBookingDetailScreenCache.set(key, parsed);
      return parsed.data || null;
    }
  } catch (error) {
    console.warn('Failed to read past booking detail cache:', error?.message || error);
  }

  return null;
}

export async function setPastBookingDetailCached(userId, bookingId, data) {
  if (!bookingId || !data) return;
  const key = String(bookingId);
  const payload = {
    data,
    lastUpdatedAt: Date.now(),
  };
  pastBookingDetailScreenCache.set(key, payload);

  try {
    await AsyncStorage.setItem(pastBookingDetailStorageKey(userId, key), JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to save past booking detail cache:', error?.message || error);
  }
}

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
  pastBookingsScreenCache.bookings = [];
  pastBookingsScreenCache.loadedOnce = false;
  pastBookingsScreenCache.lastUpdatedAt = 0;
  pastBookingDetailScreenCache.clear();

  (async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (k) =>
          k.startsWith(PAST_BOOKINGS_CACHE_PREFIX) ||
          k.startsWith(PAST_BOOKING_DETAIL_CACHE_PREFIX)
      );
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('Failed to clear persisted screen caches:', error?.message || error);
    }
  })();
}
