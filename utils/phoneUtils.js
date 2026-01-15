/**
 * Phone Number Utilities
 * Format phone numbers for display based on Kenyan mobile number conventions
 */

/**
 * Format a phone number for display
 * - If it starts with "07", remove any "+" prefix
 * - If it starts with "254", add or keep "+" prefix
 * @param {string} phoneNumber - Phone number string (may include +, spaces, dashes)
 * @returns {string} Formatted phone number for display
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all spaces, dashes, and other non-digit characters except +
  let cleaned = phoneNumber.toString().trim();
  
  // Handle + prefix
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }
  
  // Remove any remaining non-digit characters
  cleaned = cleaned.replace(/\D/g, '');
  
  // If empty after cleaning, return empty string
  if (!cleaned) return '';
  
  // Check if starts with 07 (Kenyan local format)
  if (cleaned.startsWith('07')) {
    // Return without + prefix
    return cleaned;
  }
  
  // Check if starts with 254 (Kenyan country code)
  if (cleaned.startsWith('254')) {
    // Return with + prefix
    return `+${cleaned}`;
  }
  
  // If it already has + and starts with something else, keep as is
  // Otherwise, return as is (for other formats)
  return hasPlus ? phoneNumber : cleaned;
};

/**
 * Format a phone number for making calls (tel: protocol)
 * Ensures the number is in the correct format for phone calls
 * @param {string} phoneNumber - Phone number string
 * @returns {string} Phone number formatted for tel: protocol
 */
export const formatPhoneForCall = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.toString().trim().replace(/[^\d+]/g, '');
  
  if (!cleaned) return '';
  
  // If starts with 07, convert to international format +254...
  if (cleaned.startsWith('07')) {
    // Replace leading 0 with +254
    cleaned = '+254' + cleaned.substring(1);
  }
  
  // If starts with 254 but no +, add +
  if (cleaned.startsWith('254') && !cleaned.startsWith('+254')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};
