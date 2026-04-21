/**
 * Returns true when the host has an active subscription (paid or trial).
 * Use this to gate features like "Add Car".
 * Source of truth is always the backend /host/subscription/me response.
 *
 * @param {object|null} sub - subscription object from getHostSubscription()
 */
export function hostHasActiveSubscription(sub) {
  if (!sub) return false;
  return sub.is_paid_active === true || sub.is_trial === true;
}
