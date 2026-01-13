import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { setUserId, setUserToken, getUserToken, clearUserData } from '../utils/userStorage';
import { formatApiError, formatErrorMessage, logError, getApiErrorMessage } from '../utils/errorHandler';

/**
 * Register a new host account
 */
export const registerHost = async (fullName, email, password, passwordConfirmation) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_REGISTER);
  console.log('Attempting registration to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        password: password,
        password_confirmation: passwordConfirmation,
      }),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Registration failed';
      try {
        const errorData = await response.json();
        // Handle validation errors (FastAPI often returns detail as array or object)
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
      // If registration returns host data, include it
      host: data.host || null,
    };
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      url: url,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct: 192.168.88.253:8000\n• Firewall is not blocking the connection`;
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
 * Login host and store credentials
 */
export const loginHost = async (email, password) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_LOGIN);
  console.log('Attempting login to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      const errorMessage = await getApiErrorMessage(response, 'Login failed');
      const formattedError = formatErrorMessage(errorMessage, 'login');
      throw new Error(formattedError);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.access_token || !data.host) {
      throw new Error('Invalid response from server');
    }

    // Store authentication data
    await setUserToken(data.access_token);
    await setUserId(data.host.id.toString());

    return {
      success: true,
      token: data.access_token,
      host: data.host,
    };
  } catch (error) {
    logError(error, 'Login');
    
    // Format error message for user
    const errorMessage = formatErrorMessage(error, 'login');
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Logout host and clear credentials
 * 
 * Note: JWT tokens are stateless. The API endpoint is called for consistency,
 * but the most important action is clearing the token locally, which happens
 * in the finally block regardless of API call success/failure.
 */
export const logoutHost = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_LOGOUT);
  console.log('Attempting logout to:', url);
  
  try {
    const token = await getUserToken();
    
    if (token) {
      // Call backend logout endpoint (for API consistency)
      // Note: Since JWT tokens are stateless, this is mainly for logging/analytics
      // The client must discard the token locally regardless of API response
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Log response but don't fail if API call fails
      // The token will be cleared locally anyway
      if (response.ok) {
        console.log('Logout API call successful');
      } else {
        console.warn('Logout API call returned non-OK status:', response.status);
      }
    } else {
      console.log('No token found, skipping API logout call');
    }
  } catch (error) {
    // Log error but don't throw - we still want to clear local data
    console.error('Logout API call error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      url: url,
    });
  } finally {
    // CRITICAL: Always clear local data regardless of API call success/failure
    // This is the most important part since JWT tokens are stateless
    console.log('Clearing local authentication data...');
    await clearUserData();
    console.log('Local authentication data cleared');
  }
};

/**
 * Change password for authenticated host
 * @param {string} currentPassword - Current password (required for verification)
 * @param {string} newPassword - New password (minimum 8 characters)
 * @param {string} newPasswordConfirmation - New password confirmation (must match new_password)
 * @returns {Promise<Object>} Result with success status and message or error
 */
export const changePassword = async (currentPassword, newPassword, newPasswordConfirmation) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_CHANGE_PASSWORD);
  console.log('Changing password at:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found. Please login again.',
      };
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let requiresLogout = false;
      
      // Get user-friendly error message
      const errorMessage = await getApiErrorMessage(response, 'Failed to change password');
      const formattedError = formatErrorMessage(errorMessage, 'password change');
      
      // Check if error message indicates token expiration (not password validation)
      const errorMsgLower = formattedError.toLowerCase();
      const isTokenError = errorMsgLower.includes('token') || 
                          errorMsgLower.includes('expired') || 
                          errorMsgLower.includes('unauthorized') ||
                          errorMsgLower.includes('invalid token') ||
                          errorMsgLower.includes('session expired');
      
      // Only treat as token expiration if 401 AND error message indicates token issue
      // (not password validation errors like "incorrect password" or "current password")
      if (response.status === 401 && isTokenError && 
          !errorMsgLower.includes('password') && 
          !errorMsgLower.includes('current') &&
          !errorMsgLower.includes('incorrect')) {
        requiresLogout = true;
      }
      
      // If token expired, clear data
      if (requiresLogout) {
        logError('Token expired or invalid during password change', 'ChangePassword');
        await clearUserData();
        return {
          success: false,
          error: 'Your session has expired. Please log in again.',
          requiresLogout: true,
        };
      }
      
      return {
        success: false,
        error: formattedError,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: data.message || 'Password changed successfully',
    };
  } catch (error) {
    logError(error, 'ChangePassword');
    
    // Format error message for user
    const errorMessage = formatErrorMessage(error, 'password change');
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get current authenticated host profile
 */
export const getCurrentHost = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_ME);
  console.log('Fetching current host profile from:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Failed to get profile';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      // Token expired or invalid
      if (response.status === 401) {
        console.log('Token expired or invalid, clearing local data');
        await clearUserData();
        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    return {
      success: true,
      host: data,
    };
  } catch (error) {
    console.error('Get profile error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      url: url,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct: 192.168.88.253:8000`;
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
 * Update host profile
 */
export const updateHostProfile = async (profileData) => {
  const url = getApiUrl(API_ENDPOINTS.HOST_UPDATE_PROFILE);
  console.log('Attempting profile update to:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Only send fields that are allowed by the API
    const allowedFields = {};
    if (profileData.bio !== undefined) allowedFields.bio = profileData.bio;
    if (profileData.mobile_number !== undefined) allowedFields.mobile_number = profileData.mobile_number;
    if (profileData.id_number !== undefined) allowedFields.id_number = profileData.id_number;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(allowedFields),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Failed to update profile';
      try {
        const errorData = await response.json();
        // Handle validation errors (FastAPI often returns detail as array or object)
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      host: data,
    };
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      url: url,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct: 192.168.88.253:8000`;
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
 * Make authenticated API request
 * Helper function for other services
 */
export const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired
      await clearUserData();
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Request failed');
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
};
