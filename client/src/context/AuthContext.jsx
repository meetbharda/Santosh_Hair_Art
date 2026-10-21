import React, { createContext, useContext, useState, useEffect } from 'react';
import fetchApi from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on mount
  const checkSession = async () => {
    try {
      const res = await fetchApi('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email, password) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.success) {
      if (res.data?.token) {
        localStorage.setItem('sha_token', res.data.token);
      }
      setUser(res.data);
    }
    return res;
  };

  const register = async (data) => {
    const res = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.success) {
      if (res.data?.token) {
        localStorage.setItem('sha_token', res.data.token);
      }
      setUser(res.data);
    }
    return res;
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('sha_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
