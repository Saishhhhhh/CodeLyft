import axios from 'axios';

// Create axios instance with base URL and credentials
const api = axios.create({
  // baseURL: 'http://localhost:5000/api',
  baseURL: import.meta.env.VITE_AUTH_API_URL,
  withCredentials: true // Important for cookies
});

// Add authorization header to requests if token exists
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

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Response data with user and token
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    
    if (response.data.success && response.data.token) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Login a user
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Response data with user and token
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.success && response.data.token) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Logout the current user
 * @returns {Promise<Object>} Response data
 */
export const logout = async () => {
  try {
    const response = await api.get('/auth/logout');
    
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    return response.data;
  } catch (error) {
    // Still remove token even if server request fails
    localStorage.removeItem('token');
    throw handleError(error);
  }
};

/**
 * Get the current logged in user's data
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  // Check for token in localStorage
  const token = localStorage.getItem('token');
  
  // Check for token or session cookies
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('connect.sid='));
  
  return !!token || !!tokenCookie || !!sessionCookie;
};

/**
 * Initiate Google OAuth login
 */
export const loginWithGoogle = () => {
  window.location.href = import.meta.env.VITE_GOOGLE_OAUTH_URL;
};

/**
 * Initiate GitHub OAuth login
 */
export const loginWithGithub = () => {
  window.location.href = import.meta.env.VITE_GITHUB_OAUTH_URL;
};

/**
 * Request password reset email
 * @param {string} email - User's email
 * @returns {Promise<Object>} Response data
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/password/forgot', { email });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Verify OTP for password reset
 * @param {Object} data - Verification data
 * @param {string} data.email - User's email
 * @param {string} data.otp - One-time password
 * @returns {Promise<Object>} Response data
 */
export const verifyOTP = async (data) => {
  try {
    const response = await api.post('/password/verify-otp', data);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Reset password with verified OTP
 * @param {Object} data - Reset data
 * @param {string} data.email - User's email
 * @param {string} data.otp - One-time password
 * @param {string} data.password - New password
 * @returns {Promise<Object>} Response data
 */
export const resetPassword = async (data) => {
  try {
    const response = await api.put('/password/reset', data);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Request email verification OTP
 * @returns {Promise<Object>} Response data
 */
export const sendVerificationEmail = async () => {
  try {
    const response = await api.post('/password/verify-email');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Verify email with OTP
 * @param {string} otp - One-time password
 * @returns {Promise<Object>} Response data
 */
export const verifyEmail = async (otp) => {
  try {
    const response = await api.post('/password/verify-email-otp', { otp });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Handle API errors
 * @param {Error} error - Axios error object
 * @returns {Error} Formatted error
 */
const handleError = (error) => {
  if (error.response) {
    // Log full error for debugging
    console.log("Full error response:", error.response);
    
    // Server responded with an error
    if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
      // Handle validation errors array from express-validator
      const validationErrors = error.response.data.errors.map(err => err.msg).join(', ');
      return new Error(validationErrors);
    } else if (error.response.data.errors) {
      // Handle object of errors
      return new Error(JSON.stringify(error.response.data.errors));
    } else if (error.response.data.message) {
      // Handle simple message error
      return new Error(error.response.data.message);
    } else if (error.response.status === 401) {
      // Handle unauthorized errors
      return new Error('Invalid credentials. Please check your email and password.');
    } else if (error.response.status === 400) {
      // Handle bad request errors
      return new Error('Invalid input. Please check your information and try again.');
    } else {
      // Generic error with status code
      return new Error(`Error (${error.response.status}): ${error.response.statusText || 'Unknown error'}`);
    }
  } else if (error.request) {
    // Request was made but no response
    return new Error('No response from server. Please check your internet connection.');
  } else {
    // Something else happened
    return new Error(`Request failed: ${error.message || 'Unknown error'}`);
  }
}; 