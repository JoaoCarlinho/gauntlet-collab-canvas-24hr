/**
 * Environment variable validation and utilities
 */

export const validateEnvironment = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  console.log('Environment validation:');
  console.log('- VITE_API_URL:', apiUrl);
  console.log('- NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('- MODE:', import.meta.env.MODE);
  
  if (!apiUrl) {
    console.warn('VITE_API_URL is not set! Using localhost fallback.');
    return 'http://localhost:5000';
  }
  
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    console.error('VITE_API_URL must start with http:// or https://');
    console.error('Current value:', apiUrl);
    return 'http://localhost:5000';
  }
  
  return apiUrl;
};

export const getApiUrl = () => {
  return validateEnvironment();
};
