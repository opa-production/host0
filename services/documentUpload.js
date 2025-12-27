import * as FileSystem from 'expo-file-system';
import { supabase, LEGAL_DOCS_BUCKET } from '../config/supabase';

/**
 * Upload a document (PDF or image) to Supabase Storage
 * @param {Object} file - File object with { uri, name, type }
 * @param {string} userId - User ID (optional, for organizing files by user)
 * @param {string} documentType - Type of document (logbook, insurance, inspection, manual)
 * @returns {Promise<{success: boolean, url?: string, path?: string, error?: string}>}
 */
export const uploadDocument = async (file, userId = null, documentType) => {
  try {
    if (!file || !file.uri) {
      return { success: false, error: 'No file provided' };
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer for React Native
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = userId 
      ? `${userId}/${documentType}_${timestamp}_${sanitizedFileName}`
      : `${documentType}_${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage using ArrayBuffer
    const { data, error } = await supabase.storage
      .from(LEGAL_DOCS_BUCKET)
      .upload(fileName, byteArray, {
        contentType: file.type || 'application/pdf',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(LEGAL_DOCS_BUCKET)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
      path: fileName,
    };
  } catch (error) {
    console.error('Document upload error:', error);
    return { success: false, error: error.message || 'Failed to upload document' };
  }
};

/**
 * Upload multiple documents
 * @param {Array} files - Array of file objects
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleDocuments = async (files, userId = null) => {
  const uploadPromises = Object.entries(files).map(([type, file]) => {
    if (!file) return Promise.resolve({ type, success: false, error: 'No file' });
    return uploadDocument(file, userId, type).then(result => ({
      type,
      ...result,
    }));
  });

  return Promise.all(uploadPromises);
};

/**
 * Delete a document from Supabase Storage
 * @param {string} filePath - Path to the file in storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteDocument = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(LEGAL_DOCS_BUCKET)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Document delete error:', error);
    return { success: false, error: error.message || 'Failed to delete document' };
  }
};

/**
 * Get public URL for a document
 * @param {string} filePath - Path to the file in storage
 * @returns {string} Public URL
 */
export const getDocumentUrl = (filePath) => {
  const { data } = supabase.storage
    .from(LEGAL_DOCS_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
};

