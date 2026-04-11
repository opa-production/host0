/**
 * Push notification token management.
 *
 * Registers the device's Expo push token with the backend on login and
 * unregisters it on logout so the server can deliver push notifications
 * to the correct device even when the app is backgrounded or closed.
 *
 * Backend endpoints:
 *   POST   /api/v1/host/push-token   { token, platform }
 *   DELETE /api/v1/host/push-token   { token }
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from './userStorage';

// EAS project ID — required by getExpoPushTokenAsync in Expo SDK 49+.
const EAS_PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ?? '5e05e38d-1478-4d4b-8bd1-23cc61ec7079';

// Configure how notifications are presented when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Ensure the Android notification channel exists.
 * Uses the app name ("Ardena Host") so it appears correctly in system settings.
 */
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Ardena Host',          // shown in Android notification settings
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#ffffff',
    enableVibrate: true,
    showBadge: true,
  });
}

/**
 * Request permission and retrieve the Expo push token for this device.
 * Returns null if the device is a simulator, permissions are denied, or
 * any other error occurs — push is non-critical and must never block login.
 *
 * @returns {Promise<string|null>} Expo push token string or null
 */
async function getExpoPushToken() {
  if (!Device.isDevice) {
    // Simulators / emulators cannot receive push notifications.
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    await ensureAndroidChannel();

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    return tokenData.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the device push token and register it with the backend.
 * Call this immediately after a successful login.
 *
 * Errors are swallowed — push is non-critical; login must not fail because
 * of a notification issue.
 */
export async function registerPushToken() {
  try {
    const token = await getExpoPushToken();
    if (!token) return;

    const authToken = await getUserToken();
    if (!authToken) return;

    const url = getApiUrl(API_ENDPOINTS.HOST_PUSH_TOKEN);
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS, // 'android' | 'ios'
      }),
    });
  } catch {
    // Silent — push registration failure must never surface to the user.
  }
}

/**
 * Unregister the device's push token from the backend.
 * Call this during logout, passing the auth token explicitly because
 * userStorage may already be cleared by the time this resolves.
 *
 * @param {string} authToken - JWT to authenticate the DELETE request.
 */
export async function unregisterPushToken(authToken) {
  try {
    const token = await getExpoPushToken();
    if (!token || !authToken) return;

    const url = getApiUrl(API_ENDPOINTS.HOST_PUSH_TOKEN);
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    // Silent.
  }
}
