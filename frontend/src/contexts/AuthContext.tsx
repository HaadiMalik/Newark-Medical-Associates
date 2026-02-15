import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../services/apiService';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isLoading: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nma_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('nma_token');
    const storedUser = localStorage.getItem('nma_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    } else {
        // No token or user, ensure they are null
        setUser(null);
        setToken(null);
        delete apiClient.defaults.headers.common['Authorization'];
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('nma_token', newToken);
    localStorage.setItem('nma_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    navigate('/dashboard'); 
  };

  const logout = () => {
    localStorage.removeItem('nma_token');
    localStorage.removeItem('nma_user');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const isAuthenticated = () => {
    // Add more robust checks if needed, e.g., token expiration
    return !!token && !!user;
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user || !user.role) {
      return false;
    }
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading, hasRole }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 