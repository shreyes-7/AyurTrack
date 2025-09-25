// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing auth data on app start
    const storedUser = localStorage.getItem('ayurtrack_user');
    const storedTokens = localStorage.getItem('ayurtrack_tokens');
    
    if (storedUser && storedTokens) {
      const userData = JSON.parse(storedUser);
      const tokenData = JSON.parse(storedTokens);
      
      // Check if token is still valid
      if (new Date(tokenData.access.expires) > new Date()) {
        setUser(userData);
      } else {
        // Token expired, clear localStorage
        localStorage.removeItem('ayurtrack_user');
        localStorage.removeItem('ayurtrack_tokens');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, tokens) => {
    // Store user data and tokens in localStorage
    localStorage.setItem('ayurtrack_user', JSON.stringify(userData));
    localStorage.setItem('ayurtrack_tokens', JSON.stringify(tokens));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ayurtrack_user');
    localStorage.removeItem('ayurtrack_tokens');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    hasRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
