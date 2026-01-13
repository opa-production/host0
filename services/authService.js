import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { setUserId, setUserToken, getUserToken, clearUserData } from '../utils/userStorage';

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
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
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
    console.error('Login error:', error);
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
 * Logout host and clear credentials
 */
export const logoutHost = async () => {
  try {
    const token = await getUserToken();
    
    if (token) {
      // Call backend logout endpoint
      await fetch(getApiUrl(API_ENDPOINTS.HOST_LOGOUT), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local data
    await clearUserData();
  }
};

/**
 * Get current authenticated host profile
 */
export const getCurrentHost = async () => {
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(getApiUrl(API_ENDPOINTS.HOST_ME), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Token expired or invalid
      if (response.status === 401) {
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(data.detail || 'Failed to get profile');
    }

    return {
      success: true,
      host: data,
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
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
