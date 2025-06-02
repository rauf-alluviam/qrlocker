import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration or unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Check if this is not a login request or register-related request
      if (!error.config.url.includes('/users/login') && 
          !error.config.url.includes('/organizations/public') &&
          !error.config.url.includes('/departments/public')) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        
        // Only redirect if we're not already on the login or register page
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          const currentPath = window.location.pathname;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    
    // Handle QR signature errors by retrying with development mode parameters
    if (error.response && 
        error.response.status === 400 && 
        error.response.data?.message?.includes('Invalid QR code signature') &&
        process.env.NODE_ENV !== 'production') {
      
      console.warn('QR signature validation failed, retrying with development mode parameters');
      
      // Get the original config and add a development mode header
      const originalRequest = error.config;
      originalRequest.headers['X-Dev-Mode'] = 'true';
      
      // Return the retry request
      return axios(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Helper function for QR bundle access that handles signature generation
export const getQRBundleWithSignature = async (uuid) => {
  try {
    // Try to get available signature from localStorage cache
    const cachedSignatures = JSON.parse(localStorage.getItem('qrSignatures') || '{}');
    const signature = cachedSignatures[uuid];
    
    // If we have a cached signature, use it
    if (signature) {
      return await api.get(`/qr/view/${uuid}?sig=${signature}`);
    }
    
    // Otherwise try without signature (will work in development)
    return await api.get(`/qr/view/${uuid}`);
  } catch (error) {
    console.error('Error accessing QR bundle:', error);
    throw error;
  }
};

export default api;