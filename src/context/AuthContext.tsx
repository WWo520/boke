'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE = typeof window !== 'undefined'
  ? sessionStorage    // 每个标签页独立会话，互不干扰
  : null;

function loadUserFromStorage(): User | null {
  if (!STORAGE) return null;
  const storedUser = STORAGE.getItem('blog_user');
  const storedToken = STORAGE.getItem('blog_token');
  if (storedUser && storedToken) {
    try {
      return JSON.parse(storedUser);
    } catch {
      STORAGE.removeItem('blog_user');
      STORAGE.removeItem('blog_token');
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const initialUser = loadUserFromStorage();
    setUser(initialUser);
    setIsAuthLoading(false);
  }, []);

  const login = useCallback((userData: User, token: string) => {
    setUser(userData);
    STORAGE?.setItem('blog_user', JSON.stringify(userData));
    STORAGE?.setItem('blog_token', token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    STORAGE?.removeItem('blog_user');
    STORAGE?.removeItem('blog_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin', isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
