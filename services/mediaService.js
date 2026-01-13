/**
 * Media Upload Service - Backend Integration for Host App
 * All uploads go through FastAPI backend for security
 */
import { getUserToken } from '../utils/userStorage';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api/v1`;

/**
 * Test network connectivity to backend
 */
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection to:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await response.json();
    console.log('Backend health check:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return { 
      success: false, 
      error: `Cannot reach backend at ${API_BASE_URL}. Please check:\n1. Backend is running\n2. IP address is correct\n3. Device can reach the backend` 
    };
  }
};

/**
 * Upload host avatar image
 * @param {Object} file - File object with uri, name, type
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadHostAvatar = async (file) => {
  try {
    const token = await getUserToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Validate file URI
    if (!file || !file.uri) {
      throw new Error('Invalid file object - missing URI');
    }

    // Extract filename from URI or use default
    const uriParts = file.uri.split('/');
    const fileName = file.name || uriParts[uriParts.length - 1] || 'avatar.jpg';
    
    // Ensure proper MIME type
    const fileType = file.type || 'image/jpeg';

    console.log('=== Upload Debug Info ===');
    console.log('API URL:', `${API_URL}/host/upload/avatar`);
    console.log('File URI:', file.uri);
    console.log('File name:', fileName);
    console.log('File type:', fileType);
    console.log('Token present:', !!token);
    console.log('Token length:', token.length);

    // Create FormData - React Native style
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: fileName,
      type: fileType,
    });

    console.log('FormData created, attempting fetch...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_URL}/host/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response received!');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      return {
        success: true,
        url: data.url,
        message: data.message,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout - please check your network connection');
      }
      throw fetchError;
    }

    console.log('Response status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Upload failed');
    }

    return {
      success: true,
      url: data.url,
      message: data.message,
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message || 'Failed to upload avatar',
    };
  }
};

/**
 * Upload host cover image
 * @param {Object} file - File object with uri, name, type
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadHostCover = async (file) => {
  try {
    const token = await getUserToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Validate file URI
    if (!file || !file.uri) {
      throw new Error('Invalid file object - missing URI');
    }

    console.log('=== Cover Upload Debug ===');
    console.log('API URL:', `${API_URL}/host/upload/cover`);
    console.log('File URI:', file.uri);

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'cover.jpg',
      type: file.type || 'image/jpeg',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_URL}/host/upload/cover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      return {
        success: true,
        url: data.url,
        message: data.message,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout - please check your network connection');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Cover upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload cover image',
    };
  }
};

/**
 * Upload host identity document
 * @param {Object} file - File object with uri, name, type
 * @param {string} documentType - 'id' or 'license'
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadHostDocument = async (file, documentType) => {
  try {
    const token = await getUserToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    if (!['id', 'license'].includes(documentType)) {
      throw new Error('Invalid document type');
    }

    // Validate file URI
    if (!file || !file.uri) {
      throw new Error('Invalid file object - missing URI');
    }

    console.log('=== Document Upload Debug ===');
    console.log('API URL:', `${API_URL}/host/upload/document`);
    console.log('File URI:', file.uri);
    console.log('Document type:', documentType);
    console.log('Token present:', !!token);

    // Create FormData with proper file handling for React Native
    const formData = new FormData();
    
    // React Native requires specific format for file uploads
    const fileToUpload = {
      uri: file.uri,
      name: file.name || `${documentType}.jpg`,
      type: file.type || 'image/jpeg',
    };
    
    console.log('File object for upload:', fileToUpload);
    
    formData.append('file', fileToUpload);
    formData.append('document_type', documentType);

    console.log('FormData created, starting upload...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for large files

    try {
      const response = await fetch(`${API_URL}/host/upload/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser/RN set it with boundary
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response received!');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.detail || `Upload failed with status ${response.status}`);
      }

      return {
        success: true,
        url: data.url,
        message: data.message,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
      });
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout - file may be too large or connection is slow');
      }
      
      // More specific error messages
      if (fetchError.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please check:\n• Backend is running\n• IP address is correct (10.38.56.33:8000)\n• Phone and computer are on same network');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Document upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload document',
    };
  }
};

/**
 * Upload multiple vehicle images
 * @param {Array<Object>} files - Array of file objects
 * @param {number} carId - Car ID
 * @returns {Promise<Object>} Upload result with URLs
 */
export const uploadVehicleImages = async (files, carId) => {
  try {
    const token = await getUserToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    if (!carId) {
      throw new Error('Car ID is required');
    }

    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    if (files.length > 10) {
      throw new Error('Maximum 10 images allowed');
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', {
        uri: file.uri,
        name: file.name || `image_${index}.jpg`,
        type: file.type || 'image/jpeg',
      });
    });

    const response = await fetch(`${API_URL}/host/upload/vehicle/${carId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Upload failed');
    }

    return {
      success: true,
      urls: data.urls,
      message: data.message,
    };
  } catch (error) {
    console.error('Vehicle images upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload vehicle images',
    };
  }
};

/**
 * Upload vehicle video
 * @param {Object} file - Video file object
 * @param {number} carId - Car ID
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadVehicleVideo = async (file, carId) => {
  try {
    const token = await getUserToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    if (!carId) {
      throw new Error('Car ID is required');
    }

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'video.mp4',
      type: file.type || 'video/mp4',
    });

    const response = await fetch(`${API_URL}/host/upload/vehicle/${carId}/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Upload failed');
    }

    return {
      success: true,
      url: data.url,
      message: data.message,
    };
  } catch (error) {
    console.error('Vehicle video upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload vehicle video',
    };
  }
};

/**
 * Get host profile with media URLs
 * @returns {Promise<Object>} Host profile data
 */
export const getHostProfile = async () => {
  try {
    const token = await getUserToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/host/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch profile');
    }

    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch profile',
    };
  }
};

// ==================== SECONDARY FEATURES (STUB IMPLEMENTATIONS) ====================

/**
 * Upload host profile picture (alias for avatar)
 */
export const uploadHostProfilePicture = uploadHostAvatar;

/**
 * Upload legal compliance document (STUB)
 */
export const uploadDocument = async (file, userId, documentType) => {
  console.warn('uploadDocument: Using direct Supabase upload - implement backend endpoint');
  // TODO: Create backend endpoint /api/v1/host/upload/legal-document
  return { success: false, error: 'Not yet implemented - create backend endpoint' };
};

/**
 * Upload multiple legal documents (STUB)
 */
export const uploadMultipleDocuments = async (files, userId, documentType) => {
  console.warn('uploadMultipleDocuments: Using direct Supabase upload - implement backend endpoint');
  // TODO: Create backend endpoint /api/v1/host/upload/legal-documents
  return [];
};

/**
 * Get document URL (STUB)
 */
export const getDocumentUrl = (filePath) => {
  console.warn('getDocumentUrl: Direct Supabase access - implement backend endpoint');
  return null;
};
