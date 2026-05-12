import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUser = async () => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      setToken(null);
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      setAuthLoading(true);

      const response = await api.get('/me');
      const freshUser = response.data;

      setToken(storedToken);
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      setToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (newToken, newUser = null) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);

    if (newUser) {
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return;
    }

    await loadUser();
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      setToken(null);
      setUser(null);
    }
  };

  const role = user?.role?.toLowerCase();
  const isAdmin = role === 'admin';
  const isMember = role === 'member';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAdmin,
        isMember,
        authLoading,
        login,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};