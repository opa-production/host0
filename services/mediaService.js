/**
 * Media Upload Service - Backend Integration for Host App
 * Vehicle media uploads go directly to Supabase Storage
 * Other uploads go through FastAPI backend for security
 */
import { getUserToken, getUserId } from '../utils/userStorage';
import { API_BASE_URL, getApiUrl, API_ENDPOINTS } from '../config/api';
import { supabase, STORAGE_BUCKETS } from '../config/supabase';
import * as FileSystem from 'expo-file-system';

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
 * Test Supabase Storage connection and bucket access
 * Use this to debug upload issues
 */
export const testSupabaseStorage = async () => {
  try {
    console.log('🔍 [Supabase Test] Testing Supabase Storage connection...');
    console.log('🔍 [Supabase Test] Buckets to test:', STORAGE_BUCKETS.VEHICLE_MEDIA, STORAGE_BUCKETS.CAR_VIDEOS);
    
    const results = {
      vehicleMedia: { accessible: false, error: null },
      carVideos: { accessible: false, error: null },
    };

    // Test vehicle-media bucket
    try {
      console.log('🔍 [Supabase Test] Testing vehicle-media bucket...');
      const { data: listData, error: listError } = await supabase.storage
        .from(STORAGE_BUCKETS.VEHICLE_MEDIA)
        .list('', { limit: 1 });
      
      if (listError) {
        console.error('🔍 [Supabase Test] vehicle-media bucket error:', listError);
        results.vehicleMedia.error = listError.message || listError.error || 'Unknown error';
        results.vehicleMedia.statusCode = listError.statusCode;
      } else {
        console.log('🔍 [Supabase Test] ✅ vehicle-media bucket is accessible');
        results.vehicleMedia.accessible = true;
      }
    } catch (error) {
      console.error('🔍 [Supabase Test] vehicle-media bucket exception:', error);
      results.vehicleMedia.error = error.message;
    }

    // Test carvideos bucket
    try {
      console.log('🔍 [Supabase Test] Testing carvideos bucket...');
      const { data: listData, error: listError } = await supabase.storage
        .from(STORAGE_BUCKETS.CAR_VIDEOS)
        .list('', { limit: 1 });
      
      if (listError) {
        console.error('🔍 [Supabase Test] carvideos bucket error:', listError);
        results.carVideos.error = listError.message || listError.error || 'Unknown error';
        results.carVideos.statusCode = listError.statusCode;
      } else {
        console.log('🔍 [Supabase Test] ✅ carvideos bucket is accessible');
        results.carVideos.accessible = true;
      }
    } catch (error) {
      console.error('🔍 [Supabase Test] carvideos bucket exception:', error);
      results.carVideos.error = error.message;
    }

    // Test upload permission with a small test file
    const userId = await getUserId();
    if (userId) {
      console.log('🔍 [Supabase Test] Testing upload permission...');
      const testPath = `user_${userId}/test/test_${Date.now()}.txt`;
      const testContent = new Blob(['test'], { type: 'text/plain' });
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.VEHICLE_MEDIA)
          .upload(testPath, testContent, {
            contentType: 'text/plain',
            upsert: true,
          });

        if (uploadError) {
          console.error('🔍 [Supabase Test] ❌ Upload test failed:', uploadError);
          results.uploadTest = {
            success: false,
            error: uploadError.message || uploadError.error || 'Unknown error',
            statusCode: uploadError.statusCode,
          };
        } else {
          console.log('🔍 [Supabase Test] ✅ Upload test successful');
          results.uploadTest = { success: true };
          
          // Clean up test file
          await supabase.storage
            .from(STORAGE_BUCKETS.VEHICLE_MEDIA)
            .remove([testPath]);
        }
      } catch (error) {
        console.error('🔍 [Supabase Test] Upload test exception:', error);
        results.uploadTest = { success: false, error: error.message };
      }
    } else {
      console.warn('🔍 [Supabase Test] ⚠️ No user ID found, skipping upload test');
      results.uploadTest = { success: false, error: 'User ID not found' };
    }

    return {
      success: results.vehicleMedia.accessible && results.carVideos.accessible,
      results,
    };
  } catch (error) {
    console.error('🔍 [Supabase Test] ❌ Test failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to test Supabase Storage',
    };
  }
};

/**
 * Upload host avatar image directly to Supabase Storage
 * @param {Object} file - File object with uri, name, type
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadHostAvatar = async (file) => {
  try {
    // Validate file URI
    if (!file || !file.uri) {
      throw new Error('Invalid file object - missing URI');
    }

    // Get user ID to associate avatar with user
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please ensure you are logged in.');
    }

    console.log('📸 [Avatar Upload] Starting upload to Supabase...');
    console.log('📸 [Avatar Upload] User ID:', userId);
    console.log('📸 [Avatar Upload] File URI:', file.uri);
    console.log('📸 [Avatar Upload] Bucket:', STORAGE_BUCKETS.HOST_PROFILE);

    // Generate unique file path: user_{userId}/avatar_{timestamp}.jpg
    const timestamp = Date.now();
    const fileName = file.name || 'avatar.jpg';
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const filePath = `user_${userId}/avatar_${timestamp}.${fileExtension}`;

    console.log(`📸 [Avatar Upload] Uploading avatar: ${filePath}`);

    // For React Native, read file and convert to ArrayBuffer for Supabase
    let fileData;
    try {
      console.log(`📸 [Avatar Upload] Reading file from: ${file.uri}`);
      
      // Read file as base64 from React Native file system
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });
      
      console.log(`📸 [Avatar Upload] File read, size: ${(base64.length / 1024).toFixed(2)} KB (base64)`);
      
      // Convert base64 to ArrayBuffer (Supabase works better with ArrayBuffer in React Native)
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileData = byteArray.buffer;
      
      console.log(`📸 [Avatar Upload] File converted to ArrayBuffer, size: ${(fileData.byteLength / 1024).toFixed(2)} KB`);
    } catch (readError) {
      // Fallback: try using fetch for remote URIs
      console.log(`📸 [Avatar Upload] Base64 read failed, trying fetch method...`);
      try {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status}`);
        }
        fileData = await response.arrayBuffer();
        console.log(`📸 [Avatar Upload] File fetched and converted, size: ${(fileData.byteLength / 1024).toFixed(2)} KB`);
      } catch (fetchError) {
        console.error(`📸 [Avatar Upload] Both methods failed:`, fetchError);
        throw new Error(`Failed to read file: ${fetchError.message}`);
      }
    }

    // Upload to Supabase Storage (upsert: true to replace existing avatar)
    console.log(`📸 [Avatar Upload] Uploading to Supabase: bucket=${STORAGE_BUCKETS.HOST_PROFILE}, path=${filePath}`);
    console.log(`📸 [Avatar Upload] File data size: ${(fileData.byteLength / 1024).toFixed(2)} KB, content type: ${file.type || 'image/jpeg'}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.HOST_PROFILE)
      .upload(filePath, fileData, {
        contentType: file.type || 'image/jpeg',
        upsert: true, // Replace existing avatar if it exists
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('📸 [Avatar Upload] ❌ Upload error:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
      });
      
      let errorMsg = uploadError.message || uploadError.error || 'Failed to upload avatar';
      if (uploadError.statusCode) {
        errorMsg += ` (Status: ${uploadError.statusCode})`;
      }
      
      throw new Error(errorMsg);
    }

    console.log('📸 [Avatar Upload] ✅ Upload successful, data:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.HOST_PROFILE)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('📸 [Avatar Upload] ✅ Avatar uploaded:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      message: 'Avatar uploaded successfully',
    };
  } catch (error) {
    console.error('📸 [Avatar Upload] ❌ Error:', error);
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
 * Upload multiple vehicle images directly to Supabase Storage
 * @param {Array<Object>} files - Array of file objects with {uri, name, type}
 * @param {number} carId - Car ID
 * @returns {Promise<Object>} Upload result with URLs
 */
export const uploadVehicleImages = async (files, carId) => {
  try {
    if (!carId) {
      throw new Error('Car ID is required');
    }

    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    if (files.length > 12) {
      throw new Error('Maximum 12 images allowed');
    }

    // Get user ID to associate images with user
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please ensure you are logged in.');
    }

    console.log('📸 [Vehicle Images Upload] Starting upload to Supabase...');
    console.log('📸 [Vehicle Images Upload] User ID:', userId);
    console.log('📸 [Vehicle Images Upload] Car ID:', carId);
    console.log('📸 [Vehicle Images Upload] Files count:', files.length);
    console.log('📸 [Vehicle Images Upload] Bucket:', STORAGE_BUCKETS.VEHICLE_MEDIA);

    const uploadedUrls = [];
    const errors = [];

    // Upload each image sequentially to avoid overwhelming the connection
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      try {
        // Generate unique file path: user_{userId}/car_{carId}/image_{timestamp}_{index}.jpg
        const timestamp = Date.now();
        const fileName = file.name || `image_${index}.jpg`;
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const filePath = `user_${userId}/car_${carId}/image_${timestamp}_${index}.${fileExtension}`;

        console.log(`📸 [Vehicle Images Upload] Uploading image ${index + 1}/${files.length}: ${filePath}`);

        // For React Native, read file and convert to ArrayBuffer for Supabase
        let fileData;
        try {
          console.log(`📸 [Vehicle Images Upload] Reading file ${index + 1} from: ${file.uri}`);
          
          // Read file as base64 from React Native file system
          // In expo-file-system v19, use the string 'base64' instead of enum
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: 'base64',
          });
          
          console.log(`📸 [Vehicle Images Upload] File ${index + 1} read, size: ${(base64.length / 1024).toFixed(2)} KB (base64)`);
          
          // Convert base64 to ArrayBuffer (Supabase works better with ArrayBuffer in React Native)
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          fileData = byteArray.buffer; // Use ArrayBuffer instead of Blob
          
          console.log(`📸 [Vehicle Images Upload] File ${index + 1} converted to ArrayBuffer, size: ${(fileData.byteLength / 1024).toFixed(2)} KB`);
        } catch (readError) {
          // Fallback: try using fetch for remote URIs
          console.log(`📸 [Vehicle Images Upload] Base64 read failed, trying fetch method for image ${index + 1}...`);
          console.log(`📸 [Vehicle Images Upload] Read error:`, readError);
          try {
            const response = await fetch(file.uri);
            if (!response.ok) {
              throw new Error(`Fetch failed with status ${response.status}`);
            }
            // In React Native, fetch response.arrayBuffer() works directly
            fileData = await response.arrayBuffer();
            console.log(`📸 [Vehicle Images Upload] File ${index + 1} fetched and converted, size: ${(fileData.byteLength / 1024).toFixed(2)} KB`);
          } catch (fetchError) {
            console.error(`📸 [Vehicle Images Upload] Both methods failed for image ${index + 1}:`, fetchError);
            throw new Error(`Failed to read file: ${fetchError.message}`);
          }
        }

        // Upload to Supabase Storage
        console.log(`📸 [Vehicle Images Upload] Uploading to Supabase: bucket=${STORAGE_BUCKETS.VEHICLE_MEDIA}, path=${filePath}`);
        console.log(`📸 [Vehicle Images Upload] File data size: ${(fileData.byteLength / 1024).toFixed(2)} KB, content type: ${file.type || 'image/jpeg'}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.VEHICLE_MEDIA)
          .upload(filePath, fileData, {
            contentType: file.type || 'image/jpeg',
            upsert: false, // Don't overwrite existing files
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error(`📸 [Vehicle Images Upload] ❌ Upload error for image ${index + 1}:`, {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError.error,
            name: uploadError.name,
            status: uploadError.status,
            statusText: uploadError.statusText,
            fullError: JSON.stringify(uploadError, null, 2),
          });
          
          // Extract more detailed error message
          let errorMsg = uploadError.message || uploadError.error || 'Unknown error';
          if (uploadError.statusCode) {
            errorMsg += ` (Status: ${uploadError.statusCode})`;
          }
          if (uploadError.statusText) {
            errorMsg += ` (${uploadError.statusText})`;
          }
          
          errors.push(`Image ${index + 1}: ${errorMsg}`);
          continue;
        }

        console.log(`📸 [Vehicle Images Upload] ✅ Upload successful for image ${index + 1}, data:`, uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKETS.VEHICLE_MEDIA)
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        uploadedUrls.push(publicUrl);
        console.log(`📸 [Vehicle Images Upload] ✅ Image ${index + 1} uploaded: ${publicUrl}`);
      } catch (fileError) {
        console.error(`📸 [Vehicle Images Upload] Error processing image ${index + 1}:`, fileError);
        errors.push(`Image ${index + 1}: ${fileError.message}`);
      }
    }

    if (uploadedUrls.length === 0) {
      throw new Error(`All uploads failed: ${errors.join(', ')}`);
    }

    if (errors.length > 0) {
      console.warn(`📸 [Vehicle Images Upload] ⚠️ Some uploads failed: ${errors.join(', ')}`);
    }

    console.log(`📸 [Vehicle Images Upload] ✅ Success! ${uploadedUrls.length}/${files.length} images uploaded`);

    return {
      success: true,
      urls: uploadedUrls,
      message: `Successfully uploaded ${uploadedUrls.length} of ${files.length} images`,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('📸 [Vehicle Images Upload] ❌ Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload vehicle images',
    };
  }
};

/**
 * Upload vehicle video directly to Supabase Storage
 * @param {Object} file - Video file object with {uri, name, type}
 * @param {number} carId - Car ID
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadVehicleVideo = async (file, carId) => {
  try {
    if (!carId) {
      throw new Error('Car ID is required');
    }

    if (!file || !file.uri) {
      throw new Error('Video file is required');
    }

    // Get user ID to associate video with user
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User ID is required. Please ensure you are logged in.');
    }

    console.log('📹 [Vehicle Video Upload] Starting upload to Supabase...');
    console.log('📹 [Vehicle Video Upload] User ID:', userId);
    console.log('📹 [Vehicle Video Upload] Car ID:', carId);
    console.log('📹 [Vehicle Video Upload] Bucket:', STORAGE_BUCKETS.CAR_VIDEOS);

    // Generate unique file path: user_{userId}/car_{carId}/video_{timestamp}.mp4
    const timestamp = Date.now();
    const fileName = file.name || 'video.mp4';
    const fileExtension = fileName.split('.').pop() || 'mp4';
    const filePath = `user_${userId}/car_${carId}/video_${timestamp}.${fileExtension}`;

    console.log(`📹 [Vehicle Video Upload] Uploading video: ${filePath}`);

    // For React Native, read file and convert to ArrayBuffer for Supabase
    let fileData;
    try {
      console.log(`📹 [Vehicle Video Upload] Reading video from: ${file.uri}`);
      
      // Read file as base64 from React Native file system
      // In expo-file-system v19, use the string 'base64' instead of enum
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });
      
      console.log(`📹 [Vehicle Video Upload] Video read, size: ${(base64.length / 1024 / 1024).toFixed(2)} MB (base64)`);
      
      // Convert base64 to ArrayBuffer (Supabase works better with ArrayBuffer in React Native)
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileData = byteArray.buffer; // Use ArrayBuffer instead of Blob
      
      console.log(`📹 [Vehicle Video Upload] Video converted to ArrayBuffer, size: ${(fileData.byteLength / 1024 / 1024).toFixed(2)} MB`);
    } catch (readError) {
      // Fallback: try using fetch for remote URIs
      console.log('📹 [Vehicle Video Upload] Base64 read failed, trying fetch method...');
      console.log('📹 [Vehicle Video Upload] Read error:', readError);
      try {
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status}`);
        }
        // In React Native, fetch response.arrayBuffer() works directly
        fileData = await response.arrayBuffer();
        console.log(`📹 [Vehicle Video Upload] Video fetched and converted, size: ${(fileData.byteLength / 1024 / 1024).toFixed(2)} MB`);
      } catch (fetchError) {
        console.error('📹 [Vehicle Video Upload] Both methods failed:', fetchError);
        throw new Error(`Failed to read video file: ${fetchError.message}`);
      }
    }

    console.log(`📹 [Vehicle Video Upload] Uploading to Supabase: bucket=${STORAGE_BUCKETS.CAR_VIDEOS}, path=${filePath}`);
    console.log(`📹 [Vehicle Video Upload] File data size: ${(fileData.byteLength / 1024 / 1024).toFixed(2)} MB, content type: ${file.type || 'video/mp4'}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.CAR_VIDEOS)
      .upload(filePath, fileData, {
        contentType: file.type || 'video/mp4',
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('📹 [Vehicle Video Upload] ❌ Upload error:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        name: uploadError.name,
        status: uploadError.status,
        statusText: uploadError.statusText,
        fullError: JSON.stringify(uploadError, null, 2),
      });
      
      // Extract more detailed error message
      let errorMsg = uploadError.message || uploadError.error || 'Failed to upload video';
      if (uploadError.statusCode) {
        errorMsg += ` (Status: ${uploadError.statusCode})`;
      }
      if (uploadError.statusText) {
        errorMsg += ` (${uploadError.statusText})`;
      }
      
      throw new Error(errorMsg);
    }

    console.log('📹 [Vehicle Video Upload] ✅ Upload successful, data:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.CAR_VIDEOS)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('📹 [Vehicle Video Upload] ✅ Video uploaded:', publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      message: 'Video uploaded successfully',
    };
  } catch (error) {
    console.error('📹 [Vehicle Video Upload] ❌ Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload vehicle video',
    };
  }
};

/**
 * Fetch host avatar from Supabase Storage
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Avatar URL or null if not found
 */
export const fetchHostAvatarFromSupabase = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    const folderPath = `user_${userId}`;
    console.log('📸 [Fetch Avatar] Fetching avatar from Supabase:', folderPath);

    // List all files in the user's folder
    const { data: files, error } = await supabase.storage
      .from(STORAGE_BUCKETS.HOST_PROFILE)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.log('📸 [Fetch Avatar] Error listing files:', error.message);
      return null;
    }

    if (!files || files.length === 0) {
      console.log('📸 [Fetch Avatar] No files found for user:', userId);
      return null;
    }

    // Filter for avatar files (files starting with 'avatar_')
    const avatarFiles = files.filter(file => 
      file.name.startsWith('avatar_') &&
      (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png'))
    );

    if (avatarFiles.length === 0) {
      console.log('📸 [Fetch Avatar] No avatar files found');
      return null;
    }

    // Get the most recent avatar (first in the list since we sorted by desc)
    const avatarFile = avatarFiles[0];
    const filePath = `${folderPath}/${avatarFile.name}`;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.HOST_PROFILE)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('📸 [Fetch Avatar] ✅ Avatar found:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('📸 [Fetch Avatar] ❌ Error:', error);
    return null;
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
