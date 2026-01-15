/**
 * Notification Service - Backend Integration for Host App
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * Get all notifications for the authenticated host
 * @returns {Promise<Object>} Result with success status and notifications array or error
 */
export const getHostNotifications = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_NOTIFICATIONS);
  const startTime = Date.now();
  console.log('🔔 [GET HOST NOTIFICATIONS API] Starting fetch...');
  console.log('🔔 [GET HOST NOTIFICATIONS API] Endpoint URL:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('🔔 [GET HOST NOTIFICATIONS API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        notifications: [],
      };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('🔔 [GET HOST NOTIFICATIONS API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('🔔 [GET HOST NOTIFICATIONS API] Request failed with status:', response.status);
      let errorMessage = 'Failed to fetch notifications';
      try {
        const errorData = await response.json();
        console.error('🔔 [GET HOST NOTIFICATIONS API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('🔔 [GET HOST NOTIFICATIONS API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        notifications: [],
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('🔔 [GET HOST NOTIFICATIONS API] ✅ SUCCESS! Notifications fetched:', {
      count: Array.isArray(data) ? data.length : (data.notifications?.length || 0),
      totalTime: `${totalTime}ms`,
    });
    
    // Handle different response formats
    const notificationsArray = Array.isArray(data) ? data : (data.notifications || []);
    
    // Map API response to UI format
    const mappedNotifications = notificationsArray.map((notification) => ({
      id: notification.id?.toString() || `notification-${Date.now()}-${Math.random()}`,
      title: notification.title || notification.subject || 'Notification',
      message: notification.message || notification.body || notification.content || '',
      type: notification.type || notification.category || 'info',
      isRead: notification.is_read || notification.read || false,
      createdAt: notification.created_at || notification.created || new Date().toISOString(),
      actionUrl: notification.action_url || notification.url || null,
      metadata: notification.metadata || {},
    }));

    return {
      success: true,
      notifications: mappedNotifications,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('🔔 [GET HOST NOTIFICATIONS API] ❌ ERROR occurred:', error);
    console.error('🔔 [GET HOST NOTIFICATIONS API] Error details:', {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct\n• Firewall is not blocking the connection`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      notifications: [],
    };
  }
};

/**
 * Mark a notification as read
 * @param {number|string} notificationId - Notification ID
 * @returns {Promise<Object>} Result with success status or error
 */
export const markNotificationAsRead = async (notificationId) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_NOTIFICATION_READ(notificationId));
  const startTime = Date.now();
  console.log(`🔔 [MARK NOTIFICATION READ API] Marking notification ${notificationId} as read...`);
  console.log(`🔔 [MARK NOTIFICATION READ API] Endpoint URL: ${url}`);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('🔔 [MARK NOTIFICATION READ API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('🔔 [MARK NOTIFICATION READ API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('🔔 [MARK NOTIFICATION READ API] Request failed with status:', response.status);
      let errorMessage = 'Failed to mark notification as read';
      try {
        const errorData = await response.json();
        console.error('🔔 [MARK NOTIFICATION READ API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('🔔 [MARK NOTIFICATION READ API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const totalTime = Date.now() - startTime;
    console.log('🔔 [MARK NOTIFICATION READ API] ✅ SUCCESS! Notification marked as read:', {
      notificationId: notificationId,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('🔔 [MARK NOTIFICATION READ API] ❌ ERROR occurred:', error);
    console.error('🔔 [MARK NOTIFICATION READ API] Error details:', {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct\n• Firewall is not blocking the connection`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};
