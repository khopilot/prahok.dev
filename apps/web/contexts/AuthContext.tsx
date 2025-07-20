'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { AxiosErrorWithResponse } from '@/lib/types';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only check for existing session if there's a token
    const token = Cookies.get('access_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      const axiosError = error as AxiosErrorWithResponse;
      console.error('Failed to fetch user:', error);
      // Only remove tokens if it's not a 401 error (which is expected when no valid token)
      if (axiosError.response?.status !== 401) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Login attempt:', { email, passwordLength: password.length });
      }
      
      const response = await api.post('/auth/login', { email, password });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Login response:', response.status, response.data);
      }
      
      const { accessToken, refreshToken, user } = response.data;

      Cookies.set('access_token', accessToken, { 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax' 
      });
      Cookies.set('refresh_token', refreshToken, { 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax' 
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🍪 Cookies set, user:', user);
      }
      
      setUser(user);
      router.push('/editor');
    } catch (error) {
      const axiosError = error as AxiosErrorWithResponse;
      
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Login error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message
        });
      }
      
      throw new Error(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Signup attempt:', { email, username, passwordLength: password.length });
      }
      
      const response = await api.post('/auth/signup', { email, username, password });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Signup response:', response.status, response.data);
      }
      
      const { accessToken, refreshToken, user } = response.data;

      Cookies.set('access_token', accessToken, { 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax' 
      });
      Cookies.set('refresh_token', refreshToken, { 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax' 
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🍪 Signup cookies set, user:', user);
      }
      
      setUser(user);
      router.push('/editor');
    } catch (error) {
      const axiosError = error as AxiosErrorWithResponse;
      
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Signup error:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message
        });
      }
      
      throw new Error(axiosError.response?.data?.error || axiosError.response?.data?.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚪 Starting logout process');
      }
      
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Calling logout API with refresh token');
        }
        await api.post('/auth/logout', { refreshToken });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Logout API call successful');
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Logout API error:', error);
      }
    } finally {
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Cleaning up cookies and redirecting');
      }
      
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};