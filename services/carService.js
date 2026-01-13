/**
 * Car Service - Backend Integration for Host App
 */
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { getUserToken } from '../utils/userStorage';

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

    // Map API response to UI format
    const mappedCars = carsArray.map(car => ({
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
      is_complete: car.is_complete || false,
      status: car.is_complete ? 'awaiting_verification' : 'incomplete',
      createdAt: car.created_at || new Date().toISOString(),
      updated_at: car.updated_at || new Date().toISOString(),
      totalTrips: 0, // Default value, can be updated from API if available
      rating: null, // Default value, can be updated from API if available
    }));

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
