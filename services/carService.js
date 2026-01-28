/**
 * Car Service - Backend Integration for Host App
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken, getUserId, clearUserData } from '../utils/userStorage';
import { supabase, STORAGE_BUCKETS } from '../config/supabase';

/**
 * Create car with basic information
 * @param {Object} basicInfo - Basic car information
 * @param {string} basicInfo.name - Car name
 * @param {string} basicInfo.model - Car model
 * @param {string} basicInfo.body_type - Body type (e.g., Sedan, SUV, Hatchback)
 * @param {string|number} basicInfo.year - Manufacturing year
 * @param {string} basicInfo.description - Long-form description of the car
 * @returns {Promise<Object>} Result with success status and car data or error
 */
export const createCarBasics = async (basicInfo) => {
  const url = getApiUrl(API_ENDPOINTS.CAR_BASICS);
  const startTime = Date.now();
  console.log('🚗 [CAR BASICS API] Starting car basics creation...');
  console.log('🚗 [CAR BASICS API] Endpoint URL:', url);
  console.log('🚗 [CAR BASICS API] Request payload:', {
    name: basicInfo.name,
    model: basicInfo.model,
    body_type: basicInfo.body_type,
    year: basicInfo.year,
    description: basicInfo.description ? `${basicInfo.description.substring(0, 50)}...` : 'N/A',
  });
  
  try {
    const token = await getUserToken();
    console.log('🚗 [CAR BASICS API] Token retrieved:', token ? '✓ Present' : '✗ Missing');
    
    if (!token) {
      console.error('🚗 [CAR BASICS API] ERROR: No authentication token found');
      throw new Error('No authentication token found');
    }

    // Validate required fields
    if (!basicInfo.name || !basicInfo.name.trim()) {
      throw new Error('Car name is required');
    }
    if (!basicInfo.model || !basicInfo.model.trim()) {
      throw new Error('Car model is required');
    }
    if (!basicInfo.body_type || !basicInfo.body_type.trim()) {
      throw new Error('Body type is required');
    }
    if (!basicInfo.year) {
      throw new Error('Year is required');
    }
    if (!basicInfo.description || !basicInfo.description.trim()) {
      throw new Error('Description is required');
    }

    // Convert year to number if it's a string
    const year = typeof basicInfo.year === 'string' ? parseInt(basicInfo.year, 10) : basicInfo.year;

    const requestBody = {
      name: basicInfo.name.trim(),
      model: basicInfo.model.trim(),
      body_type: basicInfo.body_type.trim(),
      year: year,
      description: basicInfo.description.trim(),
    };

    console.log('🚗 [CAR BASICS API] Sending POST request...');
    console.log('🚗 [CAR BASICS API] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;
    console.log('🚗 [CAR BASICS API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      console.error('🚗 [CAR BASICS API] Request failed with status:', response.status);
      let errorMessage = 'Failed to create car';
      try {
        const errorData = await response.json();
        console.error('🚗 [CAR BASICS API] Error response data:', JSON.stringify(errorData, null, 2));
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
        console.error('🚗 [CAR BASICS API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    console.log('🚗 [CAR BASICS API] ✅ SUCCESS! Car created:', {
      carId: data.id || data.car_id,
      name: data.name,
      model: data.model,
      totalTime: `${totalTime}ms`,
    });
    console.log('🚗 [CAR BASICS API] Full response:', JSON.stringify(data, null, 2));

    return {
      success: true,
      car: data,
      carId: data.id || data.car_id,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('🚗 [CAR BASICS API] ❌ ERROR occurred:', error);
    console.error('🚗 [CAR BASICS API] Error details:', {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct\n• Firewall is not blocking the connection`;
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
 * Update car with technical specifications
 * @param {number|string} carId - Car ID from the basics step
 * @param {Object} specs - Technical specifications
 * @param {number} specs.seats - Number of seats (1-50)
 * @param {string} specs.fuel_type - Fuel type (e.g., Gasoline, Diesel, Electric)
 * @param {string} specs.transmission - Transmission type (e.g., Manual, Automatic)
 * @param {string} specs.color - Car color
 * @param {number|string} specs.mileage - Current mileage
 * @param {Array<string>} specs.features - List of up to 12 optional features
 * @returns {Promise<Object>} Result with success status and car data or error
 */
export const updateCarSpecs = async (carId, specs) => {
  if (!carId) {
    return {
      success: false,
      error: 'Car ID is required. Please complete the basic information step first.',
    };
  }

  const url = getApiUrl(API_ENDPOINTS.CAR_SPECS(carId));
  console.log('Attempting to update car specs at:', url);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Validate required fields
    if (!specs.seats) {
      throw new Error('Number of seats is required');
    }
    if (!specs.fuel_type || !specs.fuel_type.trim()) {
      throw new Error('Fuel type is required');
    }
    if (!specs.transmission || !specs.transmission.trim()) {
      throw new Error('Transmission type is required');
    }
    if (!specs.color || !specs.color.trim()) {
      throw new Error('Car color is required');
    }

    // Convert seats to number and validate range (1-50)
    const seats = typeof specs.seats === 'string' ? parseInt(specs.seats, 10) : specs.seats;
    if (isNaN(seats) || seats < 1 || seats > 50) {
      throw new Error('Seats must be a number between 1 and 50');
    }

    // Convert mileage to number if provided
    let mileage = null;
    if (specs.mileage) {
      mileage = typeof specs.mileage === 'string' ? parseInt(specs.mileage.replace(/,/g, ''), 10) : specs.mileage;
      if (isNaN(mileage) || mileage < 0) {
        throw new Error('Mileage must be a valid positive number');
      }
    }

    // Validate features (max 12)
    const features = specs.features || [];
    if (features.length > 12) {
      throw new Error('Maximum 12 features allowed');
    }

    // Map fuel type: Petrol -> Gasoline (API expects Gasoline)
    const fuelTypeMap = {
      'Petrol': 'Gasoline',
      'Diesel': 'Diesel',
      'Electric': 'Electric',
      'Hybrid': 'Hybrid',
      'CNG': 'CNG',
    };
    const fuelType = fuelTypeMap[specs.fuel_type] || specs.fuel_type.trim();

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seats: seats,
        fuel_type: fuelType,
        transmission: specs.transmission.trim(),
        color: specs.color.trim(),
        mileage: mileage,
        features: features,
      }),
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Failed to update car specifications';
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
      car: data,
    };
  } catch (error) {
    console.error('Update car specs error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      url: url,
      carId: carId,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct\n• Firewall is not blocking the connection`;
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
 * Update car with pricing information
 * @param {number|string} carId - Car ID from the basics step
 * @param {Object} pricing - Pricing information
 * @param {number|string} pricing.daily_rate - Daily rental rate
 * @param {number|string} pricing.weekly_rate - Weekly rental rate
 * @param {number|string} pricing.monthly_rate - Monthly rental rate
 * @param {number|string} pricing.min_rental_days - Minimum rental days
 * @param {number|string|null} pricing.max_rental_days - Maximum rental days (optional)
 * @param {number|string} pricing.min_age_requirement - Minimum age requirement
 * @param {Array<string>} pricing.rules - List of car rules
 * @returns {Promise<Object>} Result with success status and car data or error
 */
export const updateCarPricing = async (carId, pricing) => {
  if (!carId) {
    return {
      success: false,
      error: 'Car ID is required. Please complete the basic information step first.',
    };
  }

  const url = getApiUrl(API_ENDPOINTS.CAR_PRICING(carId));
  const startTime = Date.now();
  console.log('💰 [CAR PRICING API] Starting car pricing update...');
  console.log('💰 [CAR PRICING API] Endpoint URL:', url);
  console.log('💰 [CAR PRICING API] Car ID:', carId);
  console.log('💰 [CAR PRICING API] Request payload:', {
    daily_rate: pricing.daily_rate,
    weekly_rate: pricing.weekly_rate,
    monthly_rate: pricing.monthly_rate,
    min_rental_days: pricing.min_rental_days,
    max_rental_days: pricing.max_rental_days,
    min_age_requirement: pricing.min_age_requirement,
    rules_count: pricing.rules ? pricing.rules.length : 0,
  });
  
  try {
    const token = await getUserToken();
    console.log('💰 [CAR PRICING API] Token retrieved:', token ? '✓ Present' : '✗ Missing');
    
    if (!token) {
      console.error('💰 [CAR PRICING API] ERROR: No authentication token found');
      throw new Error('No authentication token found');
    }

    // Validate required fields
    if (!pricing.daily_rate) {
      throw new Error('Daily rate is required');
    }
    if (!pricing.weekly_rate) {
      throw new Error('Weekly rate is required');
    }
    if (!pricing.monthly_rate) {
      throw new Error('Monthly rate is required');
    }
    if (!pricing.min_rental_days) {
      throw new Error('Minimum rental days is required');
    }
    if (!pricing.min_age_requirement) {
      throw new Error('Minimum age requirement is required');
    }

    // Convert rates to numbers
    const dailyRate = typeof pricing.daily_rate === 'string' 
      ? parseFloat(pricing.daily_rate.replace(/,/g, '')) 
      : pricing.daily_rate;
    const weeklyRate = typeof pricing.weekly_rate === 'string' 
      ? parseFloat(pricing.weekly_rate.replace(/,/g, '')) 
      : pricing.weekly_rate;
    const monthlyRate = typeof pricing.monthly_rate === 'string' 
      ? parseFloat(pricing.monthly_rate.replace(/,/g, '')) 
      : pricing.monthly_rate;
    const minRentalDays = typeof pricing.min_rental_days === 'string' 
      ? parseInt(pricing.min_rental_days, 10) 
      : pricing.min_rental_days;
    
    // Validate numeric values
    if (isNaN(dailyRate) || dailyRate <= 0) {
      throw new Error('Daily rate must be a valid positive number');
    }
    if (isNaN(weeklyRate) || weeklyRate <= 0) {
      throw new Error('Weekly rate must be a valid positive number');
    }
    if (isNaN(monthlyRate) || monthlyRate <= 0) {
      throw new Error('Monthly rate must be a valid positive number');
    }
    if (isNaN(minRentalDays) || minRentalDays < 1) {
      throw new Error('Minimum rental days must be at least 1');
    }

    // Convert max_rental_days if provided
    let maxRentalDays = null;
    if (pricing.max_rental_days) {
      maxRentalDays = typeof pricing.max_rental_days === 'string' 
        ? parseInt(pricing.max_rental_days, 10) 
        : pricing.max_rental_days;
      if (isNaN(maxRentalDays) || maxRentalDays < minRentalDays) {
        throw new Error('Maximum rental days must be greater than or equal to minimum rental days');
      }
    }

    // Convert min_age_requirement - could be a number or string like "25 years"
    let minAgeRequirement = null;
    if (typeof pricing.min_age_requirement === 'string') {
      // Try to extract number from string like "25 years" or "25"
      const ageMatch = pricing.min_age_requirement.match(/\d+/);
      if (ageMatch) {
        minAgeRequirement = parseInt(ageMatch[0], 10);
      } else {
        throw new Error('Minimum age requirement must contain a valid number');
      }
    } else {
      minAgeRequirement = pricing.min_age_requirement;
    }
    
    if (isNaN(minAgeRequirement) || minAgeRequirement < 18) {
      throw new Error('Minimum age requirement must be at least 18');
    }

    // Convert rules array to string (API expects text-based rules)
    let rulesString = '';
    if (Array.isArray(pricing.rules) && pricing.rules.length > 0) {
      // Join rules with newlines for better readability
      rulesString = pricing.rules.join('\n');
    } else if (typeof pricing.rules === 'string' && pricing.rules.trim()) {
      rulesString = pricing.rules.trim();
    }

    const requestBody = {
      daily_rate: dailyRate,
      weekly_rate: weeklyRate,
      monthly_rate: monthlyRate,
      min_rental_days: minRentalDays,
      max_rental_days: maxRentalDays,
      min_age_requirement: minAgeRequirement,
      rules: rulesString,
    };

    console.log('💰 [CAR PRICING API] Sending PUT request...');
    console.log('💰 [CAR PRICING API] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;
    console.log('💰 [CAR PRICING API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      console.error('💰 [CAR PRICING API] Request failed with status:', response.status);
      let errorMessage = 'Failed to update car pricing';
      try {
        const errorData = await response.json();
        console.error('💰 [CAR PRICING API] Error response data:', JSON.stringify(errorData, null, 2));
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
        console.error('💰 [CAR PRICING API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    console.log('💰 [CAR PRICING API] ✅ SUCCESS! Car pricing updated:', {
      carId: data.id || data.car_id || carId,
      dailyRate: data.daily_rate || dailyRate,
      totalTime: `${totalTime}ms`,
    });
    console.log('💰 [CAR PRICING API] Full response:', JSON.stringify(data, null, 2));

    return {
      success: true,
      car: data,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💰 [CAR PRICING API] ❌ ERROR occurred:', error);
    console.error('💰 [CAR PRICING API] Error details:', {
      message: error.message,
      name: error.name,
      url: url,
      carId: carId,
      totalTime: `${totalTime}ms`,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct\n• Firewall is not blocking the connection`;
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
 * Save vehicle image URLs to backend database
 * After uploading images to Supabase Storage, this function saves the URLs to the backend
 * @param {number|string} carId - Car ID
 * @param {string} coverImageUrl - Cover image URL (first image)
 * @param {Array<string>} imageUrls - Array of all image URLs (max 12)
 * @param {string|null} videoUrl - Optional video URL
 * @returns {Promise<Object>} Result with success status and car data or error
 */
export const saveVehicleImageUrls = async (carId, coverImageUrl, imageUrls, videoUrl = null) => {
  if (!carId) {
    return {
      success: false,
      error: 'Car ID is required',
    };
  }

  // Debug: Log what we received
  console.log('🖼️ [SAVE IMAGE URLS API] Function called with:', {
    carId,
    coverImageUrl: coverImageUrl ? 'Present' : 'Missing',
    imageUrls_count: imageUrls ? imageUrls.length : 0,
    imageUrls_type: Array.isArray(imageUrls) ? 'array' : typeof imageUrls,
    videoUrl: videoUrl ? 'Present' : 'Missing',
  });

  // Backend requires files array - ensure we have imageUrls
  if (!imageUrls) {
    console.error('🖼️ [SAVE IMAGE URLS API] ERROR: imageUrls is null or undefined');
    console.error('🖼️ [SAVE IMAGE URLS API] Received imageUrls:', imageUrls);
    return {
      success: false,
      error: 'Image URLs array is required',
    };
  }
  
  if (!Array.isArray(imageUrls)) {
    console.error('🖼️ [SAVE IMAGE URLS API] ERROR: imageUrls is not an array, type:', typeof imageUrls);
    console.error('🖼️ [SAVE IMAGE URLS API] Received imageUrls:', imageUrls);
    return {
      success: false,
      error: 'Image URLs must be an array',
    };
  }
  
  if (imageUrls.length === 0) {
    console.error('🖼️ [SAVE IMAGE URLS API] ERROR: imageUrls array is empty');
    return {
      success: false,
      error: 'Image URLs array must contain at least one URL',
    };
  }

  // Use PUT endpoint that accepts JSON URLs (recommended)
  // POST /api/v1/host/upload/vehicle/{id}/images expects file uploads, not URLs
  const url = getApiUrl(API_ENDPOINTS.HOST_CAR_MEDIA(carId));
  const startTime = Date.now();
  console.log('🖼️ [SAVE IMAGE URLS API] Saving image URLs to backend...');
  console.log('🖼️ [SAVE IMAGE URLS API] Endpoint URL:', url);
  console.log('🖼️ [SAVE IMAGE URLS API] Method: PUT (accepts JSON URLs)');
  console.log('🖼️ [SAVE IMAGE URLS API] Car ID:', carId);
  console.log('🖼️ [SAVE IMAGE URLS API] Cover image URL:', coverImageUrl);
  console.log('🖼️ [SAVE IMAGE URLS API] Total images:', imageUrls?.length || 0);
  console.log('🖼️ [SAVE IMAGE URLS API] Video URL:', videoUrl || 'N/A');

  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('🖼️ [SAVE IMAGE URLS API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    // Prepare request body matching backend schema
    // Backend expects: files (array of URLs) - REQUIRED, cover_image, car_video
    const requestBody = {};
    
    // files is REQUIRED by backend - always include it
    // Validate and limit image count (max 12 as per backend)
    if (!imageUrls || imageUrls.length === 0) {
      console.error('🖼️ [SAVE IMAGE URLS API] ERROR: No image URLs provided');
      return {
        success: false,
        error: 'Image URLs are required',
      };
    }
    
    const limitedUrls = imageUrls.length > 12 ? imageUrls.slice(0, 12) : imageUrls;
    if (imageUrls.length > 12) {
      console.warn('🖼️ [SAVE IMAGE URLS API] Warning: More than 12 images, truncating to 12');
    }
    
    // files is REQUIRED - always include it
    requestBody.files = limitedUrls;
    
    // Add cover_image if provided (optional)
    if (coverImageUrl) {
      requestBody.cover_image = coverImageUrl;
    }
    
    // Add car_video if provided (optional)
    if (videoUrl) {
      requestBody.car_video = videoUrl;
    }

    // Debug: Log what we're sending
    console.log('🖼️ [SAVE IMAGE URLS API] Request body structure:', {
      has_files: !!requestBody.files,
      files_length: requestBody.files ? requestBody.files.length : 0,
      files_type: Array.isArray(requestBody.files) ? 'array' : typeof requestBody.files,
      has_cover_image: !!requestBody.cover_image,
      has_car_video: !!requestBody.car_video,
    });

    // Log the actual request body that will be sent
    const requestBodyString = JSON.stringify(requestBody);
    console.log('🖼️ [SAVE IMAGE URLS API] Request body JSON:', requestBodyString);
    console.log('🖼️ [SAVE IMAGE URLS API] Request body parsed:', JSON.parse(requestBodyString));
    console.log('🖼️ [SAVE IMAGE URLS API] Files in body:', requestBody.files);
    console.log('🖼️ [SAVE IMAGE URLS API] Files is array?', Array.isArray(requestBody.files));
    console.log('🖼️ [SAVE IMAGE URLS API] Files length:', requestBody.files?.length);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: requestBodyString,
    });

    const responseTime = Date.now() - startTime;
    console.log(`🖼️ [SAVE IMAGE URLS API] Response received in ${responseTime}ms`);
    console.log('🖼️ [SAVE IMAGE URLS API] Response status:', response.status);

    const responseData = await response.json();
    console.log('🖼️ [SAVE IMAGE URLS API] Response data:', responseData);

    if (!response.ok) {
      const errorMessage = responseData.detail || responseData.message || `HTTP ${response.status}`;
      console.error('🖼️ [SAVE IMAGE URLS API] ERROR:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }

    console.log('🖼️ [SAVE IMAGE URLS API] ✅ Image URLs saved successfully');
    return {
      success: true,
      car: responseData,
      message: 'Image URLs saved successfully',
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`🖼️ [SAVE IMAGE URLS API] ❌ Error after ${responseTime}ms:`, error);
    return {
      success: false,
      error: error.message || 'Failed to save image URLs',
    };
  }
};

/**
 * Migrate existing car images from Supabase Storage to backend database
 * This function fetches all cars, gets their images from Supabase, and saves URLs to backend
 * @param {boolean} dryRun - If true, only logs what would be migrated without actually saving
 * @returns {Promise<Object>} Result with migration statistics
 */
export const migrateExistingCarImages = async (dryRun = false) => {
  console.log('🔄 [MIGRATION] Starting car images migration...');
  console.log('🔄 [MIGRATION] Mode:', dryRun ? 'DRY RUN (no changes will be saved)' : 'LIVE (will save to backend)');
  
  const startTime = Date.now();
  const stats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all cars for the current user
    const carsResult = await getHostCars();
    
    if (!carsResult.success || !carsResult.cars || carsResult.cars.length === 0) {
      console.log('🔄 [MIGRATION] No cars found to migrate');
      return {
        success: true,
        message: 'No cars found to migrate',
        stats,
      };
    }

    stats.total = carsResult.cars.length;
    console.log(`🔄 [MIGRATION] Found ${stats.total} cars to process`);

    const userId = await getUserId();
    if (!userId) {
      throw new Error('User ID not found');
    }

    // Process each car
    for (const car of carsResult.cars) {
      try {
        console.log(`\n🔄 [MIGRATION] Processing car ${car.id} (${car.name || 'Unnamed'})...`);
        
        // Check if car already has images in backend
        const hasBackendImages = !!(car.cover_image || (car.car_images && car.car_images.length > 0));
        
        if (hasBackendImages) {
          console.log(`⏭️  [MIGRATION] Car ${car.id} already has backend images, skipping`);
          stats.skipped++;
          continue;
        }

        // Fetch images from Supabase
        console.log(`📥 [MIGRATION] Fetching images from Supabase for car ${car.id}...`);
        const supabaseImages = await fetchCarImagesFromSupabase(car.id, userId);
        
        if (!supabaseImages.coverPhoto && supabaseImages.images.length === 0) {
          console.log(`⏭️  [MIGRATION] Car ${car.id} has no images in Supabase, skipping`);
          stats.skipped++;
          continue;
        }

        console.log(`✅ [MIGRATION] Found ${supabaseImages.images.length} images in Supabase`);
        console.log(`   Cover photo: ${supabaseImages.coverPhoto ? '✓' : '✗'}`);

        if (dryRun) {
          console.log(`🔍 [MIGRATION] DRY RUN: Would save ${supabaseImages.images.length} images to backend`);
          stats.migrated++;
        } else {
          // Save to backend
          console.log(`💾 [MIGRATION] Saving images to backend...`);
          const saveResult = await saveVehicleImageUrls(
            car.id,
            supabaseImages.coverPhoto,
            supabaseImages.images,
            null // Video can be added separately if needed
          );

          if (saveResult.success) {
            console.log(`✅ [MIGRATION] Successfully migrated car ${car.id}`);
            stats.migrated++;
          } else {
            console.error(`❌ [MIGRATION] Failed to migrate car ${car.id}:`, saveResult.error);
            stats.failed++;
            stats.errors.push({
              carId: car.id,
              carName: car.name,
              error: saveResult.error,
            });
          }
        }
      } catch (error) {
        console.error(`❌ [MIGRATION] Error processing car ${car.id}:`, error);
        stats.failed++;
        stats.errors.push({
          carId: car.id,
          carName: car.name,
          error: error.message,
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n🔄 [MIGRATION] Migration completed in ${totalTime}ms`);
    console.log(`📊 [MIGRATION] Statistics:`, {
      total: stats.total,
      migrated: stats.migrated,
      skipped: stats.skipped,
      failed: stats.failed,
    });

    if (stats.errors.length > 0) {
      console.log(`⚠️  [MIGRATION] Errors encountered:`, stats.errors);
    }

    return {
      success: true,
      message: dryRun 
        ? `Dry run completed: ${stats.migrated} cars would be migrated`
        : `Migration completed: ${stats.migrated} cars migrated successfully`,
      stats,
    };
  } catch (error) {
    console.error('🔄 [MIGRATION] ❌ Migration failed:', error);
    return {
      success: false,
      error: error.message,
      stats,
    };
  }
};

/**
 * Fetch car images from Supabase Storage
 * @param {number} carId - Car ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Object with coverPhoto URL and images array
 */
export const fetchCarImagesFromSupabase = async (carId, userId) => {
  try {
    if (!carId || !userId) {
      return { coverPhoto: null, images: [] };
    }

    const folderPath = `user_${userId}/car_${carId}`;
    console.log('🖼️ [Fetch Images] Fetching images from Supabase:', folderPath);

    // List all files in the car's folder
    const { data: files, error } = await supabase.storage
      .from(STORAGE_BUCKETS.VEHICLE_MEDIA)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'asc' },
      });

    if (error) {
      console.log('🖼️ [Fetch Images] Error listing files:', error.message);
      return { coverPhoto: null, images: [] };
    }

    if (!files || files.length === 0) {
      console.log('🖼️ [Fetch Images] No images found for car:', carId);
      return { coverPhoto: null, images: [] };
    }

    // Filter for image files
    const imageFiles = files.filter(file => 
      file.name.startsWith('image_') && 
      (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png'))
    );

    if (imageFiles.length === 0) {
      return { coverPhoto: null, images: [] };
    }

    // Get public URLs for all images
    const imageUrls = imageFiles.map(file => {
      const { data } = supabase.storage
        .from(STORAGE_BUCKETS.VEHICLE_MEDIA)
        .getPublicUrl(`${folderPath}/${file.name}`);
      return data.publicUrl;
    });

    // First image is the cover photo
    const coverPhoto = imageUrls[0] || null;
    const images = imageUrls;

    console.log('🖼️ [Fetch Images] Found images:', {
      carId,
      count: images.length,
      coverPhoto: coverPhoto ? '✓' : '✗',
    });

    return { coverPhoto, images };
  } catch (error) {
    console.error('🖼️ [Fetch Images] Error fetching images:', error);
    return { coverPhoto: null, images: [] };
  }
};

/**
 * Get car verification status
 * @param {number|string} carId - Car ID
 * @returns {Promise<Object>} Result with success status and verification_status ("awaiting", "verified", or "denied")
 */
export const getCarVerificationStatus = async (carId) => {
  const url = getApiUrl(API_ENDPOINTS.CAR_STATUS(carId));
  const startTime = Date.now();
  console.log(`🚗 [CAR STATUS API] Fetching verification status for car ${carId}...`);
  console.log(`🚗 [CAR STATUS API] Endpoint URL: ${url}`);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('🚗 [CAR STATUS API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
        verification_status: 'awaiting', // Default fallback
      };
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log(`🚗 [CAR STATUS API] Response received in ${responseTime}ms`, {
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      console.error(`🚗 [CAR STATUS API] Request failed with status: ${response.status}`);
      let errorMessage = 'Failed to fetch car status';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail)
            ? errorData.detail.map(err => err.msg || err).join(', ')
            : errorData.detail;
        }
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        verification_status: 'awaiting', // Default fallback
      };
    }

    const data = await response.json();
    console.log(`🚗 [CAR STATUS API] Status for car ${carId}:`, data);
    
    // API returns: "awaiting", "verified", or "denied"
    const verification_status = data.verification_status || 'awaiting';
    
    return {
      success: true,
      verification_status: verification_status,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`🚗 [CAR STATUS API] ❌ ERROR occurred for car ${carId}:`, error);
    console.error(`🚗 [CAR STATUS API] Error details:`, {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
    });
    
    return {
      success: false,
      error: error.message || 'Network error',
      verification_status: 'awaiting', // Default fallback
    };
  }
};

/**
 * Get all cars for the authenticated host
 * @returns {Promise<Object>} Result with success status and cars array or error
 */
export const getHostCars = async () => {
  const url = getApiUrl(API_ENDPOINTS.HOST_CARS);
  const startTime = Date.now();
  console.log('🚗 [GET HOST CARS API] Fetching host cars...');
  console.log('🚗 [GET HOST CARS API] Endpoint URL:', url);
  
  try {
    const token = await getUserToken();
    console.log('🚗 [GET HOST CARS API] Token retrieved:', token ? '✓ Present' : '✗ Missing');
    
    if (!token) {
      console.error('🚗 [GET HOST CARS API] ERROR: No authentication token found');
      throw new Error('No authentication token found');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('🚗 [GET HOST CARS API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      console.error('🚗 [GET HOST CARS API] Request failed with status:', response.status);
      let errorMessage = 'Failed to fetch cars';
      try {
        const errorData = await response.json();
        console.error('🚗 [GET HOST CARS API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('🚗 [GET HOST CARS API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      // Token expired or invalid - logout user
      if (response.status === 401) {
        console.log('🚗 [GET HOST CARS API] Token expired or invalid (401), logging out');
        await handleTokenExpiration();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    
    // Handle array response (API returns array of arrays)
    let carsArray = Array.isArray(data) ? data : [];
    // If it's an array of arrays, flatten it
    if (carsArray.length > 0 && Array.isArray(carsArray[0])) {
      carsArray = carsArray[0];
    }
    
    console.log('🚗 [GET HOST CARS API] ✅ SUCCESS! Cars fetched:', {
      count: carsArray.length,
      totalTime: `${totalTime}ms`,
    });
    console.log('🚗 [GET HOST CARS API] Full response:', JSON.stringify(carsArray, null, 2));

    // Get user ID for fetching images from Supabase
    const userId = await getUserId();
    console.log('🚗 [GET HOST CARS API] User ID for image fetching:', userId);

    // Map API response to UI format and fetch images from Supabase
    const mappedCarsPromises = carsArray.map(async (car) => {
      // Backend returns: cover_image, car_images (JSON array), car_video
      // Also check for legacy field names: cover_photo_url, image_urls
      const coverImageFromApi = car.cover_image || car.cover_photo_url;
      let imageUrlsFromApi = [];
      
      // Handle car_images (can be JSON string or array)
      if (car.car_images) {
        if (typeof car.car_images === 'string') {
          try {
            imageUrlsFromApi = JSON.parse(car.car_images);
          } catch (e) {
            console.warn('🚗 [GET HOST CARS] Failed to parse car_images JSON:', e);
            imageUrlsFromApi = [];
          }
        } else if (Array.isArray(car.car_images)) {
          imageUrlsFromApi = car.car_images;
        }
      }
      
      // Fallback to legacy field names
      if (imageUrlsFromApi.length === 0 && car.image_urls) {
        if (Array.isArray(car.image_urls)) {
          imageUrlsFromApi = car.image_urls;
        } else if (typeof car.image_urls === 'string') {
          imageUrlsFromApi = [car.image_urls];
        }
      }
      
      // Check if API already provides image URLs
      const hasApiImages = !!(coverImageFromApi || imageUrlsFromApi.length > 0);
      
      // Fetch images from Supabase if not provided by API (fallback for backward compatibility)
      let supabaseImages = { coverPhoto: null, images: [] };
      if (!hasApiImages && userId && car.id) {
        console.log(`🚗 [GET HOST CARS] No API images for car ${car.id}, fetching from Supabase...`);
        supabaseImages = await fetchCarImagesFromSupabase(car.id, userId);
      }

      // Determine cover photo and images (prioritize API data, fallback to Supabase)
      const coverPhoto = coverImageFromApi || car.coverPhoto || supabaseImages.coverPhoto;
      const images = imageUrlsFromApi.length > 0 ? imageUrlsFromApi : supabaseImages.images;
      
      // Determine if car has images
      const hasImages = !!(coverPhoto || images.length > 0);

      // Fetch verification status from API
      let verificationStatus = 'awaiting_verification'; // Default
      if (car.id) {
        try {
          const statusResult = await getCarVerificationStatus(car.id);
          if (statusResult.success) {
            // Map API response values to UI values
            const apiStatus = statusResult.verification_status;
            if (apiStatus === 'verified') {
              verificationStatus = 'verified';
            } else if (apiStatus === 'denied') {
              verificationStatus = 'denied';
            } else if (apiStatus === 'awaiting') {
              verificationStatus = 'awaiting_verification';
            } else {
              // Fallback: if complete OR has images, show awaiting_verification, otherwise incomplete
              verificationStatus = car.is_complete || hasImages ? 'awaiting_verification' : 'incomplete';
            }
          } else {
            // If status fetch fails, use fallback logic
            verificationStatus = car.is_complete || hasImages ? 'awaiting_verification' : 'incomplete';
          }
        } catch (error) {
          console.error(`🚗 [GET HOST CARS] Error fetching status for car ${car.id}:`, error);
          // Fallback: if complete OR has images, show awaiting_verification, otherwise incomplete
          verificationStatus = car.is_complete || hasImages ? 'awaiting_verification' : 'incomplete';
        }
      } else {
        // No car ID, use fallback logic
        verificationStatus = car.is_complete || hasImages ? 'awaiting_verification' : 'incomplete';
      }

      return {
        id: car.id?.toString() || `car-${Date.now()}`,
        carId: car.id,
        name: car.name || '',
        model: car.model || '',
        body: car.body_type || '',
        body_type: car.body_type || '',
        year: car.year?.toString() || '',
        description: car.description || '',
        seats: car.seats?.toString() || '',
        fuelType: car.fuel_type || '',
        fuel_type: car.fuel_type || '',
        transmission: car.transmission || '',
        colour: car.color || '',
        color: car.color || '',
        mileage: car.mileage?.toString() || '',
        features: Array.isArray(car.features) ? car.features : [],
        pricePerDay: car.daily_rate || 0,
        daily_rate: car.daily_rate || 0,
        pricePerWeek: car.weekly_rate || 0,
        weekly_rate: car.weekly_rate || 0,
        pricePerMonth: car.monthly_rate || 0,
        monthly_rate: car.monthly_rate || 0,
        minimumRentalDays: car.min_rental_days?.toString() || '',
        min_rental_days: car.min_rental_days || 0,
        maxRentalDays: car.max_rental_days?.toString() || '',
        max_rental_days: car.max_rental_days || null,
        ageRestriction: car.min_age_requirement?.toString() || '',
        min_age_requirement: car.min_age_requirement || 0,
        carRules: Array.isArray(car.rules) ? car.rules : (typeof car.rules === 'string' ? [car.rules] : []),
        rules: Array.isArray(car.rules) ? car.rules : (typeof car.rules === 'string' ? [car.rules] : []),
        pickupLocation: car.location_name || '',
        location_name: car.location_name || '',
        pickupLat: car.latitude || null,
        latitude: car.latitude || null,
        pickupLong: car.longitude || null,
        longitude: car.longitude || null,
        // Media URLs - prioritize API, fallback to Supabase
        coverPhoto: coverPhoto,
        coverPhotoUrl: coverPhoto,
        image: coverPhoto, // For backward compatibility
        images: images,
        imageUrls: images,
        video: car.video_url || car.video || null,
        videoUrl: car.video_url || car.video || null,
        is_complete: car.is_complete || false,
        hasImages: hasImages,
        status: verificationStatus, // Use real API status
        // Handle is_hidden field - if is_hidden is true, then visible is false
        is_hidden: car.is_hidden !== undefined ? car.is_hidden : false,
        is_visible: car.is_hidden !== undefined ? !car.is_hidden : (car.is_visible !== undefined ? car.is_visible : (car.visible !== undefined ? car.visible : true)),
        visible: car.is_hidden !== undefined ? !car.is_hidden : (car.is_visible !== undefined ? car.is_visible : (car.visible !== undefined ? car.visible : true)),
        available: car.is_hidden !== undefined ? !car.is_hidden : (car.is_visible !== undefined ? car.is_visible : (car.visible !== undefined ? car.visible : (car.available !== undefined ? car.available : true))),
        createdAt: car.created_at || new Date().toISOString(),
        updated_at: car.updated_at || new Date().toISOString(),
        totalTrips: 0, // Default value, can be updated from API if available
        rating: null, // Default value, can be updated from API if available
      };
    });

    // Wait for all image fetches to complete
    const mappedCars = await Promise.all(mappedCarsPromises);

    return {
      success: true,
      cars: mappedCars,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('🚗 [GET HOST CARS API] ❌ ERROR occurred:', error);
    console.error('🚗 [GET HOST CARS API] Error details:', {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct\n• Firewall is not blocking the connection`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      cars: [],
    };
  }
};

/**
 * Toggle car visibility (show/hide) for verified cars
 * @param {number|string} carId - Car ID
 * @returns {Promise<Object>} Result with success status and updated car data or error
 */
export const toggleCarVisibility = async (carId) => {
  const url = getApiUrl(API_ENDPOINTS.CAR_TOGGLE_VISIBILITY(carId));
  const startTime = Date.now();
  console.log(`🚗 [TOGGLE CAR VISIBILITY API] Toggling visibility for car ${carId}...`);
  console.log(`🚗 [TOGGLE CAR VISIBILITY API] Endpoint URL: ${url}`);
  
  try {
    const token = await getUserToken();
    
    if (!token) {
      console.error('🚗 [TOGGLE CAR VISIBILITY API] ERROR: No authentication token found');
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const responseTime = Date.now() - startTime;
    console.log('🚗 [TOGGLE CAR VISIBILITY API] Response received:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      console.error('🚗 [TOGGLE CAR VISIBILITY API] Request failed with status:', response.status);
      let errorMessage = 'Failed to toggle car visibility';
      try {
        const errorData = await response.json();
        console.error('🚗 [TOGGLE CAR VISIBILITY API] Error response data:', JSON.stringify(errorData, null, 2));
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = Object.values(errorData.detail).flat().join(', ');
        } else {
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (e) {
        console.error('🚗 [TOGGLE CAR VISIBILITY API] Could not parse error response as JSON:', e);
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    const totalTime = Date.now() - startTime;
    console.log('🚗 [TOGGLE CAR VISIBILITY API] ✅ SUCCESS! Car visibility toggled:', {
      carId: carId,
      totalTime: `${totalTime}ms`,
    });
    console.log('🚗 [TOGGLE CAR VISIBILITY API] Full response:', JSON.stringify(data, null, 2));

    // Handle is_hidden field - if is_hidden is true, then visible is false
    const isVisible = data.is_hidden !== undefined 
      ? !data.is_hidden 
      : (data.is_visible !== undefined 
        ? data.is_visible 
        : (data.visible !== undefined ? data.visible : true));
    
    return {
      success: true,
      car: data,
      isVisible: isVisible,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('🚗 [TOGGLE CAR VISIBILITY API] ❌ ERROR occurred:', error);
    console.error('🚗 [TOGGLE CAR VISIBILITY API] Error details:', {
      message: error.message,
      name: error.name,
      url: url,
      totalTime: `${totalTime}ms`,
      stack: error.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Network error. Please check your connection.';
    if (error.message === 'Network request failed') {
      errorMessage = `Cannot connect to server at ${url}. Please check:\n• Backend server is running\n• Device and server are on the same network\n• IP address is correct\n• Firewall is not blocking the connection`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};