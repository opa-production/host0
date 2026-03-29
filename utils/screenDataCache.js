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

/** Call on logout so the next user never sees the previous session's lists. */
export function resetScreenDataCaches() {
  myListingsScreenCache.cars = null;
  myListingsScreenCache.fetchedOnce = false;
  messagesScreenCache.supportConversation = null;
  messagesScreenCache.clientConversations = [];
  messagesScreenCache.unreadCount = 0;
  messagesScreenCache.loadedOnce = false;
}
