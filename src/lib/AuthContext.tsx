import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import i18n from '../i18n/config';

interface AuthContextType {
  user: User | null;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  language: string;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  upgradePlan: (plan: 'free' | 'premium') => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [language, setLanguageState] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const isInitialAdmin = user.email === 'markostamaki23@gmail.com';
          const defaultData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            plan: 'free',
            role: isInitialAdmin ? 'admin' : 'user',
            status: 'active',
            language: i18n.language || 'en',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(userRef, defaultData);
          setPlan('free');
          setRole(defaultData.role as 'user' | 'admin');
          setStatus('active');
          setLanguageState(defaultData.language);
        } else {
          const data = userSnap.data();
          const isAdminEmail = user.email === 'markostamaki23@gmail.com';
          
          if (isAdminEmail && data.role !== 'admin') {
            await setDoc(userRef, { role: 'admin', updatedAt: new Date().toISOString() }, { merge: true });
            setRole('admin');
          } else {
            setRole(data.role || 'user');
          }

          setPlan(data.plan || 'free');
          setStatus(data.status || 'active');
          if (data.language) {
            setLanguageState(data.language);
            i18n.changeLanguage(data.language);
          }
          
          if (data.status === 'suspended') {
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }
        }
        setUser(user);
      } else {
        setUser(null);
        setPlan('free');
        setRole('user');
        setStatus('active');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const upgradePlan = async (newPlan: 'free' | 'premium') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { plan: newPlan, updatedAt: new Date().toISOString() }, { merge: true });
      setPlan(newPlan);
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { language: lang, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (error) {
        console.error('Language sync error:', error);
      }
    } else {
      localStorage.setItem('i18nextLng', lang);
    }
  };

  return (
    <AuthContext.Provider value={{ user, plan, role, status, language, loading, loginWithGoogle, logout, upgradePlan, setLanguage }}>
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
