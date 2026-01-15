/**
 * Time Utilities - Format timestamps for display
 * Handles relative time formatting with proper timezone handling
 */

/**
 * Format a date string as relative time (e.g., "Just now", "3m ago", "2h ago")
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Parse the date - handle both string and Date object
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Handle future dates (shouldn't happen, but just in case)
    if (diffMs < 0) {
      return 'Just now';
    }
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    
    // For older dates, show actual date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  } catch (e) {
    console.error('Error formatting relative time:', e, dateString);
    return '';
  }
};

/**
 * Format a date string as time (e.g., "3:45 PM")
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '';
    }
    
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    console.error('Error formatting time:', e, dateString);
    return '';
  }
};

/**
 * Format a date string for message preview (shows time for today, date for older)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted time/date string
 */
export const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // If message is from today, show time
    if (messageDate.getTime() === today.getTime()) {
      return formatTime(date);
    }
    
    // If message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    // If message is within the last week, show day name
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    console.error('Error formatting message time:', e, dateString);
    return '';
  }
};
