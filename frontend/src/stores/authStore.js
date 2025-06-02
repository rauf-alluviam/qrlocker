import { create } from 'zustand';
import jwt_decode from 'jwt-decode';
import { toast } from 'react-toastify';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
  requireTwoFactor: false,
  twoFactorEmail: '',
  isInitialized: false,

  login: async (email, password, token = null) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/users/login', { email, password, token });
      
      // Check if 2FA is required
      if (response.data.requireTwoFactor) {
        set({ 
          loading: false, 
          requireTwoFactor: true,
          twoFactorEmail: email
        });
        return false;
      }
      
      // Login successful
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      set({ 
        user: response.data, 
        token: response.data.token, 
        loading: false,
        requireTwoFactor: false,
        twoFactorEmail: '',
        isInitialized: true
      });
      
      return true;
    } catch (error) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'An error occurred during login' 
      });
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  },

  register: async (userData) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/users', userData);
      
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      set({ 
        user: response.data, 
        token: response.data.token, 
        loading: false,
        isInitialized: true
      });
      
      return true;
    } catch (error) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Registration failed' 
      });
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isInitialized: true });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ isInitialized: true });
      return false;
    }
    
    try {
      // Check if token is expired
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isInitialized: true });
        return false;
      }
      
      // Token valid, set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user profile
      const response = await api.get('/users/profile');
      set({ user: { ...response.data, token }, token, isInitialized: true });
      
      return true;
    } catch (error) {
      // Invalid token or server error
      console.error('Auth check failed:', error);
      
      // Only clear token if it's an authentication error (401) or token is invalid
      // Don't clear on network errors to maintain offline capability
      if (error.response?.status === 401 || 
          error.message?.includes('invalid') || 
          error.message?.includes('expired')) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isInitialized: true });
      } else {
        // Network error - keep token but mark as initialized
        set({ isInitialized: true });
      }
      return false;
    }
  },

  updateProfile: async (userData) => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.put('/users/profile', userData);
      
      set({ 
        user: { ...response.data, token: get().token }, 
        loading: false 
      });
      
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      });
      toast.error(error.response?.data?.message || 'Failed to update profile');
      return false;
    }
  },

  setup2FA: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await api.post('/users/2fa/setup');
      
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Failed to setup 2FA' 
      });
      toast.error(error.response?.data?.message || 'Failed to setup 2FA');
      return null;
    }
  },

  verify2FA: async (token) => {
    try {
      set({ loading: true, error: null });
      
      await api.post('/users/2fa/verify', { token });
      
      // Update user state with 2FA enabled
      const user = get().user;
      set({ 
        user: { ...user, twoFactorEnabled: true },
        loading: false 
      });
      
      toast.success('Two-factor authentication enabled');
      return true;
    } catch (error) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Failed to verify 2FA code' 
      });
      toast.error(error.response?.data?.message || 'Failed to verify 2FA code');
      return false;
    }
  },

  disable2FA: async (password, token) => {
    try {
      set({ loading: true, error: null });
      
      await api.post('/users/2fa/disable', { password, token });
      
      // Update user state with 2FA disabled
      const user = get().user;
      set({ 
        user: { ...user, twoFactorEnabled: false },
        loading: false 
      });
      
      toast.success('Two-factor authentication disabled');
      return true;
    } catch (error) {
      set({ 
        loading: false, 
        error: error.response?.data?.message || 'Failed to disable 2FA' 
      });
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
      return false;
    }
  },

  resetTwoFactorState: () => {
    set({
      requireTwoFactor: false,
      twoFactorEmail: ''
    });
  },

  // Force initialize auth state (useful for testing or manual reset)
  initialize: () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp >= currentTime) {
          // Token is still valid, set auth header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ token, isInitialized: true });
          return;
        }
      } catch (error) {
        console.error('Token decode error:', error);
      }
    }
    
    // Clear invalid token
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isInitialized: true });
  }
}));

export { useAuthStore };