"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export default function TestAuthPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('pheakdey@example.com');
  const [password, setPassword] = useState('password123');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    try {
      setLoading(true);
      await login(email, password);
      setTestResult({ success: true, message: 'Login successful!' });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testProjectsAPI = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setTestResult({ 
        success: true, 
        message: 'Projects fetched successfully!',
        data: response.data 
      });
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.response?.data?.error || error.message,
        status: error.response?.status 
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTokens = () => {
    const accessToken = Cookies.get('access_token');
    const refreshToken = Cookies.get('refresh_token');
    const localStorageToken = localStorage.getItem('token');
    
    setTestResult({
      cookies: {
        access_token: accessToken ? 'Present' : 'Missing',
        refresh_token: refreshToken ? 'Present' : 'Missing',
      },
      localStorage: {
        token: localStorageToken ? 'Present' : 'Missing',
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
      
      <div className="max-w-4xl space-y-6">
        {/* User Status */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Current User</h2>
          {user ? (
            <pre className="text-green-400">{JSON.stringify(user, null, 2)}</pre>
          ) : (
            <p className="text-red-400">Not logged in</p>
          )}
        </div>

        {/* Login Test */}
        {!user && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Test Login</h2>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-2 bg-gray-700 rounded"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-2 bg-gray-700 rounded"
              />
              <button
                onClick={testLogin}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                Test Login
              </button>
            </div>
          </div>
        )}

        {/* Token Check */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Token Storage</h2>
          <button
            onClick={checkTokens}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded mb-3"
          >
            Check Tokens
          </button>
        </div>

        {/* API Test */}
        {user && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Test Projects API</h2>
            <button
              onClick={testProjectsAPI}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
            >
              Test Projects API
            </button>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`bg-gray-800 p-6 rounded-lg border-2 ${
            testResult.success ? 'border-green-500' : 'border-red-500'
          }`}>
            <h2 className="text-xl font-semibold mb-3">Result</h2>
            <pre className={testResult.success ? 'text-green-400' : 'text-red-400'}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}