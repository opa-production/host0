import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { setUserId, setUserToken, getUserToken, clearUserData } from '../utils/userStorage';

/**
 * Register a new host account
 */
export const registerHost = async (fullName, email, password, passwordConfirmation) => {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.HOST_REGISTER), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        password: password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Registration failed');
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Network error. Please check your connection.',
    };
  }
};

/**
 * Login host and store credentials
 */
export const loginHost = async (email, password) => {
  try {
    const response = await fetch(getApiUrl(API_ENDPOINTS.HOST_LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
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
    return {
      success: false,
      error: error.message || 'Network error. Please check your connection.',
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
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(getApiUrl(API_ENDPOINTS.HOST_UPDATE_PROFILE), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await clearUserData();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(data.detail || 'Failed to update profile');
    }

    return {
      success: true,
      host: data,
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
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
