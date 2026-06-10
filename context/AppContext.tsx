"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/utils/translations';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  isLoading: boolean;
  t: typeof translations['en'];
  fetchSession: () => Promise<void>;
  
  // Simulated Fallback Actions (Ensures the app runs seamlessly without server blocks)
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setDemoMode] = useState(false);

  // Load configuration options from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedLang = localStorage.getItem('lang') as Language | null;
    
    // Default to dark theme for futuristic style
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (savedLang) {
      setLanguage(savedLang);
    }
    
    fetchSession();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const fetchSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setDemoMode(false);
        }
      } else {
        // Check for local storage mock session as fallback
        const mockUser = localStorage.getItem('mock_user_session');
        if (mockUser) {
          setUser(JSON.parse(mockUser));
          setDemoMode(true);
        }
      }
    } catch (e) {
      console.warn("Auth check failed, fallback to client-side session");
      const mockUser = localStorage.getItem('mock_user_session');
      if (mockUser) {
        setUser(JSON.parse(mockUser));
        setDemoMode(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const t = translations[language] || translations['en'];

  return (
    <AppContext.Provider value={{
      language,
      setLanguage: changeLanguage,
      theme,
      toggleTheme,
      user,
      setUser,
      isLoading,
      t,
      fetchSession,
      isDemoMode,
      setDemoMode
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
