/**
 * Receipt Service - Download booking receipt PDF from backend
 * GET /api/v1/host/bookings/{booking_id}/receipt
 */
import { Platform, Linking } from 'react-native';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';
import { handleTokenExpiration } from '../utils/logoutHandler';
import * as FileSystem from 'expo-file-system/legacy';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  if (typeof globalThis.btoa !== 'undefined') {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return globalThis.btoa(binary);
  }
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += BASE64_CHARS[a >> 2];
    result += BASE64_CHARS[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < bytes.length ? BASE64_CHARS[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < bytes.length ? BASE64_CHARS[c & 63] : '=';
  }
  return result;
}

/**
 * Parse filename from Content-Disposition header if present
 * e.g. attachment; filename="receipt-123.pdf"
 */
function getFilenameFromContentDisposition(header) {
  if (!header || typeof header !== 'string') return null;
  const match = header.match(/filename\*?=(?:UTF-8'')?["']?([^"'\s;]+)["']?/i)
    || header.match(/filename=["']?([^"'\s;]+)["']?/i);
  return match ? match[1].trim() : null;
}

/**
 * Download booking receipt PDF and open it.
 * @param {string|number} bookingId - Booking ID
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const downloadBookingReceipt = async (bookingId) => {
  if (bookingId == null || bookingId === '') {
    return { success: false, error: 'Booking ID is required' };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_BOOKING_RECEIPT(bookingId));

  try {
    const token = await getUserToken();
    if (!token) {
      return { success: false, error: 'Please sign in to download the receipt.' };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/pdf',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      await handleTokenExpiration();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      let errorMessage = 'Could not load receipt';
      try {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (data.detail) {
          errorMessage = typeof data.detail === 'string'
            ? data.detail
            : Array.isArray(data.detail)
              ? data.detail.map((d) => d.msg || d).join(', ')
              : JSON.stringify(data.detail);
        }
      } catch (_) {
        errorMessage = response.statusText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    const suggestedName = getFilenameFromContentDisposition(contentDisposition);
    const fileName = suggestedName || `receipt-${bookingId}.pdf`;
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileUri = `${FileSystem.cacheDirectory}${safeName}`;

    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      const IntentLauncher = require('expo-intent-launcher');
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/pdf',
        flags: 1,
      });
    } else {
      const canOpen = await Linking.canOpenURL(fileUri);
      if (canOpen) {
        await Linking.openURL(fileUri);
      } else {
        return { success: false, error: 'Receipt downloaded but could not open. Try opening from the Files app.' };
      }
    }

    return { success: true };
  } catch (err) {
    const message = err?.message || 'Failed to download receipt.';
    return { success: false, error: message };
  }
};
