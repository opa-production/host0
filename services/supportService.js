/**
 * Support Service - Backend Integration for Host App
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * Send a message in the support conversation
 * @param {string} message - Message content (1-2000 characters)
 * @returns {Promise<Object>} Result with success status and message data or error
 */
export const sendSupportMessage = async (message) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_SUPPORT_SEND_MESSAGE);
  const startTime = Date.now();
  console.log('💬 [SEND SUPPORT MESSAGE API] Sending message...');
  console.log('💬 [SEND SUPPORT MESSAGE API] Endpoint URL:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('💬 [SEND SUPPORT MESSAGE API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    // Validate message
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
    console.log('💬 [SEND SUPPORT MESSAGE API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('💬 [SEND SUPPORT MESSAGE API] Request failed with status:', response.status);
      let errorMessage = 'Failed to send message';
      try {
        const errorData = await response.json();
        console.error('💬 [SEND SUPPORT MESSAGE API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('💬 [SEND SUPPORT MESSAGE API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    console.log('💬 [SEND SUPPORT MESSAGE API] ✅ SUCCESS! Message sent:', {
      totalTime: `${totalTime}ms`,
    });
    console.log('💬 [SEND SUPPORT MESSAGE API] Full response:', JSON.stringify(data, null, 2));

    return {
      success: true,
      message: data,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💬 [SEND SUPPORT MESSAGE API] ❌ ERROR occurred:', error);
    console.error('💬 [SEND SUPPORT MESSAGE API] Error details:', {
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

/**
 * Get the support conversation
 * @returns {Promise<Object>} Result with success status and messages array or error
 */
export const getSupportConversation = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_SUPPORT_CONVERSATION);
  const startTime = Date.now();
  console.log('💬 [GET SUPPORT CONVERSATION API] Fetching conversation...');
  console.log('💬 [GET SUPPORT CONVERSATION API] Endpoint URL:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('💬 [GET SUPPORT CONVERSATION API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        messages: [],
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
    console.log('💬 [GET SUPPORT CONVERSATION API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('💬 [GET SUPPORT CONVERSATION API] Request failed with status:', response.status);
      let errorMessage = 'Failed to load conversation';
      try {
        const errorData = await response.json();
        console.error('💬 [GET SUPPORT CONVERSATION API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('💬 [GET SUPPORT CONVERSATION API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        messages: [],
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    console.log('💬 [GET SUPPORT CONVERSATION API] ✅ SUCCESS! Conversation loaded:', {
      messageCount: Array.isArray(data) ? data.length : (data.messages ? data.messages.length : 0),
      totalTime: `${totalTime}ms`,
    });
    console.log('💬 [GET SUPPORT CONVERSATION API] Full response:', JSON.stringify(data, null, 2));

    // Handle different response structures
    let messages = [];
    if (Array.isArray(data)) {
      messages = data;
    } else if (data.messages && Array.isArray(data.messages)) {
      messages = data.messages;
    } else if (data.conversation && Array.isArray(data.conversation)) {
      messages = data.conversation;
    }

    // Map API response to UI format
    const mappedMessages = messages.map((msg, index) => {
      // Determine if message is from user (host) or agent/admin
      // Priority: Check for agent/admin indicators first, then host/user indicators
      // Common field names: sender, sender_type, from, is_from_user, is_host, role, sender_role, is_agent, is_admin
      
      // First, check if message is from agent/admin
      const isAgentOrAdmin = msg.sender === 'agent' || 
                             msg.sender === 'admin' ||
                             msg.sender_type === 'agent' ||
                             msg.sender_type === 'admin' ||
                             msg.role === 'agent' ||
                             msg.role === 'admin' ||
                             msg.sender_role === 'agent' ||
                             msg.sender_role === 'admin' ||
                             msg.is_agent === true ||
                             msg.is_admin === true ||
                             false;
      
      // If it's from agent/admin, then isFromMe should be false (show on left)
      if (isAgentOrAdmin) {
        // Log for debugging
        console.log('💬 [GET SUPPORT CONVERSATION API] Message from agent/admin:', {
          id: msg.id,
          sender: msg.sender,
          sender_type: msg.sender_type,
          role: msg.role,
          is_agent: msg.is_agent,
          is_admin: msg.is_admin,
        });
      }
      
      // Message is from me (host) if it's NOT from agent/admin
      // AND it matches host/user indicators
      const isFromMe = !isAgentOrAdmin && (
                       msg.sender === 'host' || 
                       msg.sender === 'user' ||
                       msg.sender_type === 'host' || 
                       msg.sender_type === 'user' ||
                       msg.from === 'host' ||
                       msg.from === 'user' ||
                       msg.is_from_user === true ||
                       msg.is_host === true ||
                       msg.role === 'host' ||
                       msg.user_type === 'host' ||
                       false
                     );
                     
      // Log for debugging
      if (isFromMe) {
        console.log('💬 [GET SUPPORT CONVERSATION API] Message from host/user:', {
          id: msg.id,
          sender: msg.sender,
          sender_type: msg.sender_type,
          role: msg.role,
        });
      } else if (!isAgentOrAdmin) {
        console.log('💬 [GET SUPPORT CONVERSATION API] Unknown message sender (defaulting to agent side):', {
          id: msg.id,
          msg: msg,
        });
      }

      // Format timestamp
      let timestamp = 'Now';
      if (msg.created_at) {
        try {
          const date = new Date(msg.created_at);
          timestamp = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } catch (e) {
          timestamp = msg.created_at;
        }
      } else if (msg.timestamp) {
        try {
          const date = new Date(msg.timestamp);
          timestamp = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } catch (e) {
          timestamp = msg.timestamp;
        }
      }

      return {
        id: msg.id?.toString() || msg.message_id?.toString() || `msg-${index}`,
        fromMe: isFromMe,
        text: msg.message || msg.content || msg.text || '',
        ts: timestamp,
        createdAt: msg.created_at || msg.timestamp,
      };
    });

    return {
      success: true,
      messages: mappedMessages,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💬 [GET SUPPORT CONVERSATION API] ❌ ERROR occurred:', error);
    console.error('💬 [GET SUPPORT CONVERSATION API] Error details:', {
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
      messages: [],
    };
  }
};
