'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/services/api';

// Asumimos que la API devuelve un token y datos del usuario
interface User {
  username: string;
  // Puedes añadir más campos como email, nombre, etc.
}

interface AuthData {
  user: User | null;
  token: string | null;
}

interface AuthContextType {
  auth: AuthData | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  verify: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadAuthFromStorage = useCallback(() => {
    try {
      const storedAuth = localStorage.getItem('auth');
      if (storedAuth) {
        setAuth(JSON.parse(storedAuth));
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.removeItem('auth');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthFromStorage();
  }, [loadAuthFromStorage]);

  const login = async (username, password) => {
    try {
      const response = await api.login(username, password);
      localStorage.setItem('usernameFor2FA', username); // Guardar username
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const verify = async (code: string) => {
    const usernameFor2FA = localStorage.getItem('usernameFor2FA'); // Leer username
    if (!usernameFor2FA) {
      throw new Error("Username not found for 2FA.");
    }
    setLoading(true);
    try {
      const data = await api.verify2FA(usernameFor2FA, code);
      const newAuth: AuthData = {
        token: data.access,
        user: { username: usernameFor2FA },
      };
      localStorage.setItem('auth', JSON.stringify(newAuth));
      setAuth(newAuth);
      localStorage.removeItem('usernameFor2FA'); // Limpiar username
      router.push('/');
    } catch (error) {
      console.error("2FA verification failed:", error);
      localStorage.removeItem('auth');
      setAuth(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout, verify }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};