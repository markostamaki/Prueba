import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n/config';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  plan: 'free' | 'premium';
  status: 'active' | 'suspended';
}

interface AuthContextType {
  user: User | null;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  language: string;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradePlan: (plan: 'free' | 'premium') => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState(i18n.language || 'en');

  // Derived states for backward compatibility with existing components
  const plan = user?.plan || 'free';
  const role = user?.role || 'user';
  const status = user?.status || 'active';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          if (userData.language) {
            setLanguageState(userData.language);
            i18n.changeLanguage(userData.language);
          }
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const upgradePlan = async (newPlan: 'free' | 'premium') => {
    // For now, this is just local state as we haven't implemented the update API yet
    if (!user) return;
    setUser({ ...user, plan: newPlan });
  };

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    if (!user) {
      localStorage.setItem('i18nextLng', lang);
    }
    // API logic for persisting language could be added here
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      plan, 
      role, 
      status, 
      language, 
      loading, 
      error, 
      login, 
      register, 
      logout, 
      upgradePlan, 
      setLanguage 
    }}>
      {!loading && children}
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
