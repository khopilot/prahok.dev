import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message
      });
    }
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        Cookies.set('access_token', accessToken, { 
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax' 
        });
        Cookies.set('refresh_token', newRefreshToken, { 
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax' 
        });

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;