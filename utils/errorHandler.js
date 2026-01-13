/**
 * Error Handler Utility
 * Formats API errors into user-friendly messages
 */

/**
 * Format API error response into user-friendly message
 * @param {Object|Array|string} errorData - Error data from API response
 * @param {string} defaultMessage - Default message if error can't be parsed
 * @returns {string} User-friendly error message
 */
export const formatApiError = (errorData, defaultMessage = 'An error occurred. Please try again.') => {
  if (!errorData) {
    return defaultMessage;
  }

  // If it's already a string, return it
  if (typeof errorData === 'string') {
    return errorData;
  }

  // If it's an array (FastAPI validation errors)
  if (Array.isArray(errorData)) {
    const messages = errorData
      .map(err => {
        if (typeof err === 'string') return err;
        if (err.msg) return err.msg;
        if (err.message) return err.message;
        return null;
      })
      .filter(msg => msg !== null);
    
    if (messages.length > 0) {
      return messages.join('. ');
    }
  }

  // If it's an object
  if (typeof errorData === 'object') {
    // Check for common error fields
    if (errorData.detail) {
      return formatApiError(errorData.detail, defaultMessage);
    }
    if (errorData.message) {
      return errorData.message;
    }
    if (errorData.error) {
      return errorData.error;
    }
    
    // If it's an object with field errors (like {email: ["error1", "error2"]})
    const fieldErrors = Object.values(errorData)
      .flat()
      .map(err => typeof err === 'string' ? err : err.msg || err.message || err)
      .filter(err => err)
      .join('. ');
    
    if (fieldErrors) {
      return fieldErrors;
    }
  }

  return defaultMessage;
};

/**
 * Format error message for specific error types
 * @param {Error|string} error - Error object or message
 * @param {string} context - Context of the error (e.g., 'login', 'password change')
 * @returns {string} User-friendly error message
 */
export const formatErrorMessage = (error, context = 'operation') => {
  const errorMessage = error?.message || error || 'An unexpected error occurred';
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network request failed') || lowerMessage.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (lowerMessage.includes('invalid email') || lowerMessage.includes('invalid password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (lowerMessage.includes('incorrect password') || lowerMessage.includes('wrong password')) {
    return 'The password you entered is incorrect. Please try again.';
  }

  if (lowerMessage.includes('current password') && lowerMessage.includes('incorrect')) {
    return 'The current password you entered is incorrect. Please try again.';
  }

  if (lowerMessage.includes('session expired') || lowerMessage.includes('token expired')) {
    return 'Your session has expired. Please log in again.';
  }

  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
    return 'You are not authorized to perform this action. Please log in again.';
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('required')) {
    return errorMessage; // Return as-is for validation errors
  }

  // Password errors
  if (lowerMessage.includes('password') && lowerMessage.includes('match')) {
    return 'Passwords do not match. Please make sure both passwords are the same.';
  }

  if (lowerMessage.includes('password') && lowerMessage.includes('length')) {
    return 'Password must be at least 8 characters long.';
  }

  // Generic fallback
  return errorMessage;
};

/**
 * Log error for debugging (only in development)
 * @param {Error|string} error - Error to log
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = 'App') => {
  if (__DEV__) {
    console.error(`[${context}] Error:`, error);
    if (error?.stack) {
      console.error(`[${context}] Stack:`, error.stack);
    }
  }
  // In production, you might want to send to error tracking service
  // Example: Sentry.captureException(error);
};

/**
 * Get user-friendly error message from API response
 * @param {Response} response - Fetch response object
 * @param {string} defaultMessage - Default message if error can't be parsed
 * @returns {Promise<string>} User-friendly error message
 */
export const getApiErrorMessage = async (response, defaultMessage = 'An error occurred. Please try again.') => {
  try {
    const errorData = await response.json();
    return formatApiError(errorData, defaultMessage);
  } catch (e) {
    // If response is not JSON, use status text
    return response.statusText || defaultMessage;
  }
};
