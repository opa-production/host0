/**
 * Message Service - Backend Integration for Host App
 * Handles client-host messaging
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken, clearUserData } from '../utils/userStorage';

/**
 * Get all conversations for the host
 * @returns {Promise<Object>} Result with success status and conversations array or error
 */
export const getHostConversations = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_MESSAGES);
  const startTime = Date.now();
  console.log('💬 [GET HOST CONVERSATIONS API] Fetching conversations...');
  console.log('💬 [GET HOST CONVERSATIONS API] Endpoint URL:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('💬 [GET HOST CONVERSATIONS API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        conversations: [],
        total: 0,
        unreadCount: 0,
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
    console.log('💬 [GET HOST CONVERSATIONS API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('💬 [GET HOST CONVERSATIONS API] Request failed with status:', response.status);
      let errorMessage = 'Failed to fetch conversations';
      try {
        const errorData = await response.json();
        console.error('💬 [GET HOST CONVERSATIONS API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('💬 [GET HOST CONVERSATIONS API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      // Token expired or invalid - clear local data
      if (response.status === 401) {
        console.log('💬 [GET HOST CONVERSATIONS API] Token expired or invalid (401), clearing local data');
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        conversations: [],
        total: 0,
        unreadCount: 0,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('💬 [GET HOST CONVERSATIONS API] ✅ SUCCESS! Conversations fetched:', {
      count: data.conversations?.length || 0,
      total: data.total || 0,
      unreadCount: data.unread_count || 0,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      conversations: data.conversations || [],
      total: data.total || 0,
      unreadCount: data.unread_count || 0,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`💬 [GET HOST CONVERSATIONS API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`💬 [GET HOST CONVERSATIONS API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      conversations: [],
      total: 0,
      unreadCount: 0,
    };
  }
};

/**
 * Get conversation with a specific client
 * @param {number|string} clientId - Client ID
 * @returns {Promise<Object>} Result with success status and conversation data or error
 */
export const getClientConversation = async (clientId) => {
  if (!clientId) {
    return {
      success: false,
      error: 'Client ID is required',
      conversation: null,
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_MESSAGES_CLIENT(clientId));
  const startTime = Date.now();
  console.log('💬 [GET CLIENT CONVERSATION API] Fetching conversation...');
  console.log('💬 [GET CLIENT CONVERSATION API] Endpoint URL:', url);
  console.log('💬 [GET CLIENT CONVERSATION API] Client ID:', clientId);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('💬 [GET CLIENT CONVERSATION API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        conversation: null,
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
    console.log('💬 [GET CLIENT CONVERSATION API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('💬 [GET CLIENT CONVERSATION API] Request failed with status:', response.status);
      let errorMessage = 'Failed to fetch conversation';
      try {
        const errorData = await response.json();
        console.error('💬 [GET CLIENT CONVERSATION API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('💬 [GET CLIENT CONVERSATION API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('💬 [GET CLIENT CONVERSATION API] Token expired or invalid (401), clearing local data');
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
        conversation: null,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('💬 [GET CLIENT CONVERSATION API] ✅ SUCCESS! Conversation fetched:', {
      conversationId: data.id,
      messagesCount: data.messages?.length || 0,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      conversation: data,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`💬 [GET CLIENT CONVERSATION API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`💬 [GET CLIENT CONVERSATION API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      conversation: null,
    };
  }
};

/**
 * Send a message to a client
 * @param {number|string} clientId - Client ID
 * @param {string} message - Message content (1-2000 characters)
 * @returns {Promise<Object>} Result with success status and message data or error
 */
export const sendMessageToClient = async (clientId, message) => {
  if (!clientId) {
    return {
      success: false,
      error: 'Client ID is required',
    };
  }

  if (!message || !message.trim()) {
    return {
      success: false,
      error: 'Message cannot be empty',
    };
  }

  if (message.length > 2000) {
    return {
      success: false,
      error: 'Message must be 2000 characters or less',
    };
  }

  const url = getApiUrl(API_ENDPOINTS.HOST_MESSAGES_CLIENT(clientId));
  const startTime = Date.now();
  console.log('💬 [SEND MESSAGE TO CLIENT API] Sending message...');
  console.log('💬 [SEND MESSAGE TO CLIENT API] Endpoint URL:', url);
  console.log('💬 [SEND MESSAGE TO CLIENT API] Client ID:', clientId);
  console.log('💬 [SEND MESSAGE TO CLIENT API] Message length:', message.length);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('💬 [SEND MESSAGE TO CLIENT API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message.trim(),
      }),
    });

    const responseTime = Date.now() - startTime;
    console.log('💬 [SEND MESSAGE TO CLIENT API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('💬 [SEND MESSAGE TO CLIENT API] Request failed with status:', response.status);
      let errorMessage = 'Failed to send message';
      try {
        const errorData = await response.json();
        console.error('💬 [SEND MESSAGE TO CLIENT API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('💬 [SEND MESSAGE TO CLIENT API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        console.log('💬 [SEND MESSAGE TO CLIENT API] Token expired or invalid (401), clearing local data');
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    console.log('💬 [SEND MESSAGE TO CLIENT API] ✅ SUCCESS! Message sent:', {
      messageId: data.id,
      totalTime: `${totalTime}ms`,
    });

    return {
      success: true,
      message: data,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`💬 [SEND MESSAGE TO CLIENT API] ❌ ERROR occurred after ${totalTime}ms:`, error);
    console.error(`💬 [SEND MESSAGE TO CLIENT API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
};
