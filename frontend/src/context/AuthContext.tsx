'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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

  const login = async (username: string, password: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiBaseUrl}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      const data = await response.json();
      
      // Assuming the token is in `data.access` as per django-ninja-jwt default
      const newAuth: AuthData = {
        token: data.access, 
        user: { username }, // You might want to decode the token to get more user info
      };

      localStorage.setItem('auth', JSON.stringify(newAuth));
      setAuth(newAuth);
      router.push('/');

    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout }}>
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
