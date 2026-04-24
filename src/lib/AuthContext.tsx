import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n/config';
import { apiRequest } from './api';

interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'premium';
  status: 'active' | 'suspended';
  language: string;
}

interface AuthContextType {
  user: User | null;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  language: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradePlan: (plan: 'free' | 'premium') => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('shinigami_token');
    const storedUser = localStorage.getItem('shinigami_user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.language) {
          i18n.changeLanguage(parsedUser.language);
        }
      } catch (e) {
        localStorage.removeItem('shinigami_token');
        localStorage.removeItem('shinigami_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    localStorage.setItem('shinigami_token', data.token);
    localStorage.setItem('shinigami_user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.language) {
      i18n.changeLanguage(data.user.language);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    
    localStorage.setItem('shinigami_token', data.token);
    localStorage.setItem('shinigami_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    localStorage.removeItem('shinigami_token');
    localStorage.removeItem('shinigami_user');
    setUser(null);
  };

  const upgradePlan = async (newPlan: 'free' | 'premium') => {
    if (!user) return;
    try {
      // In self-hosted mode, plan upgrade might be an admin action 
      // or a profile update if we want to allow self-upgrade for testing
      const updatedUser = await apiRequest(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ plan: newPlan }),
      });
      setUser(updatedUser);
      localStorage.setItem('shinigami_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  const setLanguage = async (lang: string) => {
    if (!user) return;
    try {
      const updatedUser = await apiRequest(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ language: lang }),
      });
      setUser(updatedUser);
      localStorage.setItem('shinigami_user', JSON.stringify(updatedUser));
      i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Language sync error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      plan: user?.plan || 'free', 
      role: user?.role || 'user', 
      status: user?.status || 'active', 
      language: user?.language || 'en', 
      loading, 
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
