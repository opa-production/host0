/**
 * Payment Methods Service - Backend Integration for Host App
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

/**
 * Add a new M-Pesa payment method
 * @param {string} name - Name for this M-Pesa payment method (e.g., "John's M-Pesa")
 * @param {string} mpesaNumber - M-Pesa phone number (9-15 digits, e.g., 254712345678)
 * @param {boolean} isDefault - Set as default payment method
 * @returns {Promise<Object>} Result with success status and data or error
 */
export const addMpesaPaymentMethod = async (name, mpesaNumber, isDefault = false) => {
  const url = getApiUrl(API_ENDPOINTS.PAYMENT_METHODS_MPESA);
  console.log('Attempting to add M-Pesa payment method to:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Clean and format the M-Pesa number (ensure it's digits only, 9-15 digits)
    const cleanedNumber = mpesaNumber.replace(/\D/g, '');
    
    // Validate number length (9-15 digits as per API)
    if (cleanedNumber.length < 9 || cleanedNumber.length > 15) {
      throw new Error('M-Pesa number must be between 9 and 15 digits');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        mpesa_number: cleanedNumber,
        is_default: isDefault,
      }),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Failed to add M-Pesa payment method';
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
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Add M-Pesa payment method error:', error);
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
 * Get all payment methods for the authenticated host
 * @returns {Promise<Object>} Result with success status and payment methods or error
 */
export const getPaymentMethods = async () => {
  const url = getApiUrl(API_ENDPOINTS.PAYMENT_METHODS);
  console.log('Fetching payment methods from:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch payment methods';
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      if (response.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Get payment methods error:', error);
    
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server. Please check your connection.`;
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
 * Add a new card payment method (Visa or Mastercard)
 * @param {string} name - Name for this card payment method (e.g., "My Visa Card")
 * @param {string} cardNumber - 16-digit card number (Visa must start with 4, Mastercard with 5)
 * @param {string} expiryDate - Expiry date in MM/YY format (e.g., "08/30")
 * @param {string} cvc - 3-4 digit CVC/CVV code
 * @param {string} cardType - Card type ("visa" or "mastercard")
 * @param {boolean} isDefault - Set as default payment method
 * @returns {Promise<Object>} Result with success status and data or error
 */
export const addCardPaymentMethod = async (name, cardNumber, expiryDate, cvc, cardType, isDefault = false) => {
  const url = getApiUrl(API_ENDPOINTS.PAYMENT_METHODS_CARD);
  console.log('Attempting to add card payment method to:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Clean card number (remove spaces)
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    
    // Validate card number length (must be 16 digits)
    if (cleanedCardNumber.length !== 16) {
      throw new Error('Card number must be exactly 16 digits');
    }

    // Validate card type matches card number
    if (cardType === 'visa' && !cleanedCardNumber.startsWith('4')) {
      throw new Error('Visa cards must start with 4');
    }
    if (cardType === 'mastercard' && !cleanedCardNumber.startsWith('5')) {
      throw new Error('Mastercard must start with 5');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        card_number: cleanedCardNumber,
        expiry_date: expiryDate,
        cvc: cvc,
        card_type: cardType,
        is_default: isDefault,
      }),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Failed to add card payment method';
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
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Add card payment method error:', error);
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
